'use server'

// =============================================================================
// lib/actions/booking-actions.ts
// Server Actions untuk peminjaman ruangan (booking workflow)
// =============================================================================

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type {
  ActionResult, PeminjamanRuangan, PeminjamanRuanganWithRelations,
  PaginatedResult, BookingFilters,
} from '@/lib/types'
import { BOOKING_RULES, DEFAULT_PAGE_SIZE } from '@/lib/constants'
import { sendNotification } from './notification-actions'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Tidak terautentikasi')
  // Ambil profile untuk full_name (notifikasi) dan role sebagai fallback
  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
  // Gunakan JWT role jika ada (hook aktif), fallback ke profiles.role
  const role = (user.app_metadata?.role as string | undefined) ?? (profile?.role as string | undefined) ?? 'staff'
  return { supabase, user, role, profile }
}

// =============================================================================
// READ
// =============================================================================

export async function getBookings(
  filters?: BookingFilters,
  page = 1,
  per_page = DEFAULT_PAGE_SIZE
): Promise<PaginatedResult<PeminjamanRuanganWithRelations>> {
  const { supabase, user, role } = await requireAuth()
  const from = (page - 1) * per_page
  const to = from + per_page - 1

  let query = supabase
    .from('peminjaman_ruangan')
    .select('*, ruangan(*), user:user_id(*), approver:approved_by(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  // Staff, IT, dan Sarana hanya bisa lihat miliknya — Admin lihat semua
  if (role !== 'admin') {
    query = query.eq('user_id', user.id)
  }

  if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status)
  if (filters?.ruangan_id && filters.ruangan_id !== 'all') query = query.eq('ruangan_id', filters.ruangan_id)
  if (filters?.user_id && filters.user_id !== 'all') query = query.eq('user_id', filters.user_id)
  if (filters?.date_from) query = query.gte('tanggal', filters.date_from)
  if (filters?.date_to) query = query.lte('tanggal', filters.date_to)

  const { data, count, error } = await query
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as PeminjamanRuanganWithRelations[],
    pagination: {
      page, per_page,
      total: count ?? 0,
      total_pages: Math.ceil((count ?? 0) / per_page),
    },
  }
}

export async function getBookingById(id: string): Promise<PeminjamanRuanganWithRelations | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('peminjaman_ruangan')
    .select('*, ruangan(*), user:user_id(*), approver:approved_by(*)')
    .eq('id', id)
    .single()
  return data as PeminjamanRuanganWithRelations | null
}

export async function getPendingBookings(): Promise<PeminjamanRuanganWithRelations[]> {
  // Admin client untuk bypass RLS: policy hanya izinkan sarana lihat booking miliknya sendiri
  const adminClient = await createAdminClient()
  const { data } = await adminClient
    .from('peminjaman_ruangan')
    .select('*, ruangan(*), user:user_id(*)')
    .eq('status', 'menunggu')
    .order('created_at', { ascending: true })
  return (data ?? []) as PeminjamanRuanganWithRelations[]
}

// =============================================================================
// CREATE BOOKING
// =============================================================================

export async function createBooking(formData: FormData): Promise<ActionResult<PeminjamanRuangan>> {
  try {
    const { supabase, user, role } = await requireAuth()

    const ruanganId = formData.get('ruangan_id') as string
    const tanggal = formData.get('tanggal') as string
    const jamMulai = formData.get('jam_mulai') as string
    const jamSelesai = formData.get('jam_selesai') as string
    const keperluan = formData.get('keperluan') as string
    const jumlahPeserta = formData.get('jumlah_peserta') ? Number(formData.get('jumlah_peserta')) : null

    // Validasi input
    if (!ruanganId || !tanggal || !jamMulai || !jamSelesai || !keperluan) {
      return { success: false, error: 'Semua field wajib diisi' }
    }
    if (keperluan.length < 10) {
      return { success: false, error: 'Keperluan minimal 10 karakter' }
    }

    // Validasi tanggal (staff: maks 14 hari ke depan)
    if (role === 'staff') {
      const maxDate = new Date()
      maxDate.setDate(maxDate.getDate() + BOOKING_RULES.MAX_DAYS_AHEAD)
      if (new Date(tanggal) > maxDate) {
        return { success: false, error: `Staff hanya bisa booking maksimal ${BOOKING_RULES.MAX_DAYS_AHEAD} hari ke depan` }
      }
    }

    // Validasi durasi
    const [startH, startM] = jamMulai.split(':').map(Number)
    const [endH, endM] = jamSelesai.split(':').map(Number)
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM)
    if (durationMinutes < BOOKING_RULES.MIN_DURATION_MINUTES) {
      return { success: false, error: `Durasi minimal ${BOOKING_RULES.MIN_DURATION_MINUTES} menit` }
    }
    if (durationMinutes > BOOKING_RULES.MAX_DURATION_HOURS * 60) {
      return { success: false, error: `Durasi maksimal ${BOOKING_RULES.MAX_DURATION_HOURS} jam` }
    }

    // Cek status ruangan
    const { data: ruangan } = await supabase.from('ruangan').select('status, kapasitas, nama_ruangan').eq('id', ruanganId).single()
    if (!ruangan || ruangan.status !== 'tersedia') {
      return { success: false, error: 'Ruangan tidak tersedia untuk dibooking' }
    }

    // Validasi kapasitas
    if (jumlahPeserta && jumlahPeserta > ruangan.kapasitas) {
      return { success: false, error: `Jumlah peserta melebihi kapasitas ruangan (${ruangan.kapasitas} orang)` }
    }

    // Cek booking aktif staff (maks 3) — hanya booking yang masih aktif/akan datang
    const today = new Date().toISOString().slice(0, 10)   // 'YYYY-MM-DD'
    const currentTime = new Date().toTimeString().slice(0, 8) // 'HH:mm:ss'
    const { data: activeBookings } = await supabase
      .from('peminjaman_ruangan')
      .select('id, tanggal, jam_selesai')
      .eq('user_id', user.id)
      .in('status', ['menunggu', 'disetujui'])
    // Filter di sisi aplikasi: hanya booking yang belum selesai
    const stillActive = (activeBookings ?? []).filter((b) => {
      if (b.tanggal > today) return true           // tanggal mendatang
      if (b.tanggal === today && b.jam_selesai > currentTime) return true  // hari ini & belum selesai
      return false
    })
    if (stillActive.length >= BOOKING_RULES.MAX_ACTIVE_BOOKINGS) {
      return { success: false, error: `Maksimal ${BOOKING_RULES.MAX_ACTIVE_BOOKINGS} booking aktif secara bersamaan` }
    }

    // Cek bentrok waktu
    const { data: bentrok } = await supabase
      .from('peminjaman_ruangan').select('id')
      .eq('ruangan_id', ruanganId).eq('tanggal', tanggal)
      .in('status', ['menunggu', 'disetujui'])
      .or(`and(jam_mulai.lt.${jamSelesai},jam_selesai.gt.${jamMulai})`)

    if (bentrok && bentrok.length > 0) {
      return { success: false, error: 'Waktu yang dipilih bentrok dengan booking lain. Pilih waktu yang berbeda.' }
    }

    // Insert booking
    const { data, error } = await supabase
      .from('peminjaman_ruangan')
      .insert({
        ruangan_id: ruanganId,
        user_id: user.id,
        tanggal,
        jam_mulai: jamMulai,
        jam_selesai: jamSelesai,
        keperluan,
        jumlah_peserta: jumlahPeserta,
        status: 'menunggu',
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    // Notifikasi ke semua Sarana dan Admin (mereka yang handle approval)
    // Gunakan adminClient — staff tidak bisa query profiles lain (RLS)
    const adminClientNotif = await createAdminClient()
    const { data: penerima } = await adminClientNotif
      .from('profiles').select('id')
      .in('role', ['sarana', 'admin'])
      .eq('is_active', true)
    await Promise.all(
      (penerima ?? []).map(p =>
        sendNotification({
          user_id: p.id,
          judul: 'Booking Ruangan Baru',
          pesan: `Ada booking baru untuk ruangan ${ruangan.nama_ruangan} pada ${tanggal} ${jamMulai}–${jamSelesai}`,
          tipe: 'booking_ruangan',
          reference_id: data.id,
        })
      )
    )

    revalidatePath('/ruangan/riwayat')
    revalidatePath('/ruangan/approval')
    revalidatePath('/', 'layout')
    return { success: true, data: data as PeminjamanRuangan }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

// =============================================================================
// APPROVE / REJECT (Admin Only)
// =============================================================================

export async function approveBooking(id: string, catatanAdmin?: string): Promise<ActionResult> {
  try {
    const { user, role } = await requireAuth()
    if (role !== 'sarana') return { success: false, error: 'Hanya Sarana yang bisa menyetujui booking' }

    // Admin client: RLS hanya izinkan sarana SELECT/UPDATE booking miliknya sendiri
    const adminClient = await createAdminClient()
    const { data: booking } = await adminClient
      .from('peminjaman_ruangan').select('*, user:user_id(id, full_name), ruangan(nama_ruangan)').eq('id', id).single()
    if (!booking) return { success: false, error: 'Booking tidak ditemukan' }
    if (booking.status !== 'menunggu') return { success: false, error: 'Booking sudah tidak dalam status menunggu' }

    const { error } = await adminClient
      .from('peminjaman_ruangan')
      .update({ status: 'disetujui', approved_by: user.id, approved_at: new Date().toISOString(), catatan_admin: catatanAdmin ?? null })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    // Notifikasi ke pengaju
    await sendNotification({
      user_id: booking.user.id,
      judul: 'Booking Ruangan Disetujui ✓',
      pesan: `Booking Anda untuk ${booking.ruangan.nama_ruangan} pada ${booking.tanggal} telah disetujui.`,
      tipe: 'booking_ruangan',
      reference_id: id,
    })

    revalidatePath('/ruangan/approval')
    revalidatePath('/ruangan/riwayat')
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

export async function rejectBooking(id: string, catatanAdmin: string): Promise<ActionResult> {
  try {
    const { user, role } = await requireAuth()
    if (role !== 'sarana') return { success: false, error: 'Hanya Sarana yang bisa menolak booking' }
    if (!catatanAdmin || catatanAdmin.trim().length < 5) {
      return { success: false, error: 'Catatan alasan penolakan wajib diisi (minimal 5 karakter)' }
    }

    const adminClient = await createAdminClient()
    const { data: booking } = await adminClient
      .from('peminjaman_ruangan').select('*, user:user_id(id), ruangan(nama_ruangan)').eq('id', id).single()
    if (!booking) return { success: false, error: 'Booking tidak ditemukan' }

    const { error } = await adminClient
      .from('peminjaman_ruangan')
      .update({ status: 'ditolak', approved_by: user.id, approved_at: new Date().toISOString(), catatan_admin: catatanAdmin })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    await sendNotification({
      user_id: booking.user.id,
      judul: 'Booking Ruangan Ditolak',
      pesan: `Booking untuk ${booking.ruangan.nama_ruangan} pada ${booking.tanggal} ditolak. Alasan: ${catatanAdmin}`,
      tipe: 'booking_ruangan',
      reference_id: id,
    })

    revalidatePath('/ruangan/approval')
    revalidatePath('/ruangan/riwayat')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

// =============================================================================
// CANCEL (oleh pengaju)
// =============================================================================

export async function cancelBooking(id: string, alasan?: string): Promise<ActionResult> {
  try {
    const { supabase, user, role } = await requireAuth()

    const { data: booking } = await supabase
      .from('peminjaman_ruangan').select('user_id, status').eq('id', id).single()
    if (!booking) return { success: false, error: 'Booking tidak ditemukan' }

    if (role !== 'admin' && booking.user_id !== user.id) {
      return { success: false, error: 'Tidak diizinkan membatalkan booking ini' }
    }
    if (!['admin', 'sarana'].includes(role) && booking.status !== 'menunggu') {
      return { success: false, error: 'Hanya booking berstatus "menunggu" yang bisa dibatalkan. Hubungi Admin untuk booking yang sudah disetujui.' }
    }

    const { error } = await supabase
      .from('peminjaman_ruangan')
      .update({ status: 'dibatalkan', cancelled_reason: alasan ?? null })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/ruangan/riwayat')
    revalidatePath('/ruangan/approval')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

