'use server'

// =============================================================================
// lib/actions/ruangan-actions.ts
// Server Actions untuk manajemen ruangan & jadwal
// =============================================================================

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type {
  ActionResult, Ruangan, PeminjamanRuangan, PeminjamanRuanganWithRelations,
  DashboardRuanganStats, RuanganStatusRealtime, PaginatedResult,
} from '@/lib/types'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Tidak terautentikasi')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return { supabase, user, role: profile?.role ?? 'staff' }
}

async function requireSaranaOnly() {
  const ctx = await requireAuth()
  if (ctx.role !== 'sarana') throw new Error('Hanya Sarana yang bisa melakukan aksi ini')
  return ctx
}

// =============================================================================
// CRUD RUANGAN (Admin Only)
// =============================================================================

export async function getRuangan(filters?: {
  search?: string
  status?: string
  gedung?: string
  lantai?: number
  page?: number
  per_page?: number
}): Promise<PaginatedResult<Ruangan>> {
  const supabase = await createClient()
  const page = filters?.page ?? 1
  const per_page = filters?.per_page ?? DEFAULT_PAGE_SIZE
  const from = (page - 1) * per_page
  const to = from + per_page - 1

  let query = supabase
    .from('ruangan')
    .select('*', { count: 'exact' })
    .eq('is_deleted', false)
    .order('nama_ruangan', { ascending: true })
    .range(from, to)

  if (filters?.search) {
    query = query.or(`nama_ruangan.ilike.%${filters.search}%,lokasi_gedung.ilike.%${filters.search}%`)
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters?.gedung) {
    query = query.eq('lokasi_gedung', filters.gedung)
  }
  if (filters?.lantai) {
    query = query.eq('lantai', filters.lantai)
  }

  const { data, count, error } = await query
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as Ruangan[],
    pagination: {
      page,
      per_page,
      total: count ?? 0,
      total_pages: Math.ceil((count ?? 0) / per_page),
    },
  }
}

export async function getRuanganById(id: string): Promise<Ruangan | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ruangan')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single()
  if (error) return null
  return data as Ruangan
}

export async function getRuanganList(): Promise<Ruangan[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ruangan')
    .select('*')
    .eq('is_deleted', false)
    .eq('status', 'tersedia')
    .order('nama_ruangan', { ascending: true })
  return (data ?? []) as Ruangan[]
}

export async function createRuangan(formData: FormData): Promise<ActionResult<Ruangan>> {
  try {
    await requireSaranaOnly()
    const supabase = await createClient()

    const fasilitas = formData.get('fasilitas')
    const payload = {
      nama_ruangan: formData.get('nama_ruangan') as string,
      lokasi_gedung: formData.get('lokasi_gedung') as string,
      lantai: formData.get('lantai') ? Number(formData.get('lantai')) : null,
      kapasitas: Number(formData.get('kapasitas')),
      fasilitas: fasilitas ? JSON.parse(fasilitas as string) : [],
      status: (formData.get('status') as string) || 'tersedia',
      foto: formData.get('foto') as string | null,
      keterangan: formData.get('keterangan') as string | null,
    }

    if (!payload.nama_ruangan || !payload.lokasi_gedung || !payload.kapasitas) {
      return { success: false, error: 'Nama ruangan, lokasi gedung, dan kapasitas wajib diisi' }
    }

    const { data, error } = await supabase.from('ruangan').insert(payload).select().single()
    if (error) {
      return { success: false, error: error.message.includes('unique') ? 'Nama ruangan sudah digunakan' : error.message }
    }

    revalidatePath('/ruangan')
    revalidatePath('/ruangan/kelola')
    return { success: true, data: data as Ruangan }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

export async function updateRuangan(formData: FormData): Promise<ActionResult> {
  try {
    await requireSaranaOnly()
    const supabase = await createClient()
    const id = formData.get('id') as string

    const fasilitas = formData.get('fasilitas')
    const updates: Record<string, unknown> = {
      nama_ruangan: formData.get('nama_ruangan') as string,
      lokasi_gedung: formData.get('lokasi_gedung') as string,
      lantai: formData.get('lantai') ? Number(formData.get('lantai')) : null,
      kapasitas: Number(formData.get('kapasitas')),
      fasilitas: fasilitas ? JSON.parse(fasilitas as string) : [],
      status: formData.get('status') as string,
      keterangan: formData.get('keterangan') as string | null,
    }

    if (formData.get('foto')) updates.foto = formData.get('foto') as string

    const { error } = await supabase.from('ruangan').update(updates).eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/ruangan')
    revalidatePath('/ruangan/kelola')
    revalidatePath(`/ruangan/kelola/${id}`)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

export async function deleteRuangan(id: string): Promise<ActionResult> {
  try {
    await requireSaranaOnly()
    const supabase = await createClient()

    // Cek apakah ada booking aktif
    const { count } = await supabase
      .from('peminjaman_ruangan')
      .select('*', { count: 'exact', head: true })
      .eq('ruangan_id', id)
      .in('status', ['menunggu', 'disetujui'])

    if (count && count > 0) {
      return { success: false, error: 'Tidak bisa menghapus ruangan yang masih memiliki booking aktif' }
    }

    const { error } = await supabase.from('ruangan').update({ is_deleted: true }).eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/ruangan/kelola')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

// =============================================================================
// JADWAL & BOOKING
// =============================================================================

export async function getJadwalRuangan(ruanganId: string, tanggal: string): Promise<PeminjamanRuangan[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('peminjaman_ruangan')
    .select('*')
    .eq('ruangan_id', ruanganId)
    .eq('tanggal', tanggal)
    .in('status', ['menunggu', 'disetujui'])
    .order('jam_mulai', { ascending: true })
  return (data ?? []) as PeminjamanRuangan[]
}

export async function getJadwalBulanan(
  ruanganId: string,
  bulanMulai: string,
  bulanSelesai: string
): Promise<PeminjamanRuanganWithRelations[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('peminjaman_ruangan')
    .select('*, ruangan(*), user:user_id(*), approver:approved_by(*)')
    .eq('ruangan_id', ruanganId)
    .gte('tanggal', bulanMulai)
    .lte('tanggal', bulanSelesai)
    .in('status', ['menunggu', 'disetujui'])
    .order('tanggal', { ascending: true })
  return (data ?? []) as PeminjamanRuanganWithRelations[]
}

// Jadwal publik untuk semua user login (agar bisa lihat slot terpakai)
export async function getJadwalKalenderPublik(
  ruanganId: string,
  tanggalMulai: string,
  tanggalSelesai: string
): Promise<PeminjamanRuanganWithRelations[]> {
  await requireAuth()

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('peminjaman_ruangan')
    .select('*, user:user_id(full_name), ruangan(*)')
    .eq('ruangan_id', ruanganId)
    .gte('tanggal', tanggalMulai)
    .lte('tanggal', tanggalSelesai)
    .in('status', ['menunggu', 'disetujui'])
    .order('tanggal', { ascending: true })
    .order('jam_mulai', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as PeminjamanRuanganWithRelations[]
}

export async function cekBookingBentrok(
  ruanganId: string,
  tanggal: string,
  jamMulai: string,
  jamSelesai: string,
  excludeId?: string
): Promise<PeminjamanRuangan[]> {
  const supabase = await createClient()
  let query = supabase
    .from('peminjaman_ruangan')
    .select('*')
    .eq('ruangan_id', ruanganId)
    .eq('tanggal', tanggal)
    .in('status', ['menunggu', 'disetujui'])
    .or(`and(jam_mulai.lt.${jamSelesai},jam_selesai.gt.${jamMulai})`)

  if (excludeId) query = query.neq('id', excludeId)

  const { data } = await query
  return (data ?? []) as PeminjamanRuangan[]
}

// =============================================================================
// DASHBOARD RUANGAN
// =============================================================================

export async function getDashboardRuangan(): Promise<DashboardRuanganStats & { ruanganStatus: RuanganStatusRealtime[] }> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const nowTime = new Date().toTimeString().split(' ')[0]

  // Total ruangan
  const { count: totalRuangan } = await supabase
    .from('ruangan').select('*', { count: 'exact', head: true }).eq('is_deleted', false)

  // Status per kategori
  const { data: byStatus } = await supabase
    .from('ruangan').select('status').eq('is_deleted', false)
  const tersedia = byStatus?.filter(r => r.status === 'tersedia').length ?? 0
  const maintenance = byStatus?.filter(r => r.status === 'maintenance').length ?? 0

  // Booking hari ini
  const { count: bookingHariIni } = await supabase
    .from('peminjaman_ruangan').select('*', { count: 'exact', head: true })
    .eq('tanggal', today).in('status', ['menunggu', 'disetujui'])

  // Booking menunggu
  const { count: bookingMenunggu } = await supabase
    .from('peminjaman_ruangan').select('*', { count: 'exact', head: true })
    .eq('status', 'menunggu')

  // Booking aktif (sedang dipakai sekarang)
  const { count: sedangDipakai } = await supabase
    .from('peminjaman_ruangan').select('*', { count: 'exact', head: true })
    .eq('tanggal', today).eq('status', 'disetujui')
    .lte('jam_mulai', nowTime).gte('jam_selesai', nowTime)

  // Ruangan dengan status realtime
  const { data: semuaRuangan } = await supabase
    .from('ruangan').select('*').eq('is_deleted', false).order('nama_ruangan')

  const ruanganStatus: RuanganStatusRealtime[] = await Promise.all(
    (semuaRuangan ?? []).map(async (r) => {
      const { data: aktif } = await supabase
        .from('peminjaman_ruangan')
        .select('*, user:user_id(full_name), ruangan(*)')
        .eq('ruangan_id', r.id).eq('tanggal', today).eq('status', 'disetujui')
        .lte('jam_mulai', nowTime).gte('jam_selesai', nowTime)
        .limit(1).single()

      const { data: berikutnya } = await supabase
        .from('peminjaman_ruangan')
        .select('*, user:user_id(full_name), ruangan(*)')
        .eq('ruangan_id', r.id).eq('tanggal', today).in('status', ['menunggu', 'disetujui'])
        .gt('jam_mulai', nowTime)
        .order('jam_mulai', { ascending: true })
        .limit(1).single()

      return {
        ruangan: r as Ruangan,
        booking_aktif: aktif as PeminjamanRuanganWithRelations | null,
        booking_berikutnya: berikutnya as PeminjamanRuanganWithRelations | null,
      }
    })
  )

  return {
    total_ruangan: totalRuangan ?? 0,
    tersedia,
    sedang_dipakai: sedangDipakai ?? 0,
    maintenance,
    booking_hari_ini: bookingHariIni ?? 0,
    booking_menunggu: bookingMenunggu ?? 0,
    ruanganStatus,
  }
}
