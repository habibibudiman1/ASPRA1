'use server'

// =============================================================================
// lib/actions/peminjaman-barang-actions.ts
// Server Actions untuk peminjaman barang (approval & pengembalian)
// =============================================================================

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type {
  ActionResult, PeminjamanBarang, PeminjamanBarangWithRelations, PaginatedResult, PeminjamanBarangFilters,
} from '@/lib/types'
import { PEMINJAMAN_BARANG_RULES, DEFAULT_PAGE_SIZE } from '@/lib/constants'
import { sendNotification } from './notification-actions'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Tidak terautentikasi')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = (user.app_metadata?.role as string | undefined) ?? (profile?.role as string | undefined) ?? 'staff'
  return { supabase, user, role }
}

// =============================================================================
// READ
// =============================================================================

export async function getPeminjamanBarang(
  filters?: PeminjamanBarangFilters,
  page = 1,
  per_page = DEFAULT_PAGE_SIZE
): Promise<PaginatedResult<PeminjamanBarangWithRelations>> {
  const { supabase, user, role } = await requireAuth()
  const from = (page - 1) * per_page
  const to = from + per_page - 1

  let query = supabase
    .from('peminjaman_barang')
    .select('*, inventaris(*), user:user_id(*), approver:approved_by(*), receiver:returned_to(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  // Staff hanya lihat miliknya
  if (role === 'staff') query = query.eq('user_id', user.id)

  if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status)
  if (filters?.user_id && filters.user_id !== 'all') query = query.eq('user_id', filters.user_id)
  if (filters?.date_from) query = query.gte('tanggal_pinjam', filters.date_from)
  if (filters?.date_to)   query = query.lte('tanggal_pinjam', filters.date_to)

  const { data, count, error } = await query
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as PeminjamanBarangWithRelations[],
    pagination: { page, per_page, total: count ?? 0, total_pages: Math.ceil((count ?? 0) / per_page) },
  }
}

export async function getPendingPeminjamanBarang(): Promise<PeminjamanBarangWithRelations[]> {
  const adminClient = await createAdminClient()
  const { data } = await adminClient
    .from('peminjaman_barang')
    .select('*, inventaris(*), user:user_id(*)')
    .eq('status', 'menunggu')
    .order('created_at', { ascending: true })
  return (data ?? []) as PeminjamanBarangWithRelations[]
}

// =============================================================================
// CREATE (Ajukan Peminjaman)
// =============================================================================

export async function createPeminjamanBarang(formData: FormData): Promise<ActionResult<PeminjamanBarang>> {
  try {
    const { supabase, user, role } = await requireAuth()

    const inventarisId = formData.get('inventaris_id') as string
    const jumlah = Number(formData.get('jumlah_dipinjam'))
    const tanggalPinjam = formData.get('tanggal_pinjam') as string
    const tanggalKembali = formData.get('tanggal_kembali_estimasi') as string
    const catatanPeminjam = (formData.get('catatan_peminjam') as string) || null

    if (!inventarisId || !jumlah || !tanggalPinjam || !tanggalKembali) {
      return { success: false, error: 'Semua field wajib diisi' }
    }
    if (jumlah < 1) return { success: false, error: 'Jumlah minimal 1' }

    // Validasi durasi maks 30 hari
    const durationDays = Math.floor(
      (new Date(tanggalKembali).getTime() - new Date(tanggalPinjam).getTime()) / 86400000
    )
    if (durationDays > PEMINJAMAN_BARANG_RULES.MAX_DURATION_DAYS) {
      return { success: false, error: `Durasi peminjaman maksimal ${PEMINJAMAN_BARANG_RULES.MAX_DURATION_DAYS} hari` }
    }

    // Ambil data inventaris
    const { data: barang } = await supabase
      .from('inventaris').select('*').eq('id', inventarisId).eq('is_deleted', false).single()
    if (!barang) return { success: false, error: 'Barang tidak ditemukan' }
    if (barang.kondisi === 'rusak_berat') return { success: false, error: 'Barang dengan kondisi rusak berat tidak bisa dipinjam' }

    // Hitung stok tersedia (total - yang sedang dipinjam)
    const { data: sedangDipinjam } = await supabase
      .from('peminjaman_barang').select('jumlah_dipinjam')
      .eq('inventaris_id', inventarisId).in('status', ['menunggu', 'dipinjam', 'terlambat'])
    const totalDipinjam = sedangDipinjam?.reduce((s, p) => s + p.jumlah_dipinjam, 0) ?? 0
    const stokTersedia = barang.jumlah_stok - totalDipinjam

    if (stokTersedia < jumlah) {
      return { success: false, error: `Stok tersedia hanya ${stokTersedia} ${barang.satuan}` }
    }

    // Cek limit 5 item aktif per staff
    if (role === 'staff') {
      const { count: activeCount } = await supabase
        .from('peminjaman_barang').select('*', { count: 'exact', head: true })
        .eq('user_id', user.id).in('status', ['menunggu', 'dipinjam', 'terlambat'])

      if ((activeCount ?? 0) >= PEMINJAMAN_BARANG_RULES.MAX_ACTIVE_ITEMS) {
        return { success: false, error: `Maksimal ${PEMINJAMAN_BARANG_RULES.MAX_ACTIVE_ITEMS} peminjaman aktif bersamaan` }
      }
    }

    const { data, error } = await supabase
      .from('peminjaman_barang')
      .insert({
        inventaris_id: inventarisId,
        user_id: user.id,
        jumlah_dipinjam: jumlah,
        tanggal_pinjam: tanggalPinjam,
        tanggal_kembali_estimasi: tanggalKembali,
        catatan_peminjam: catatanPeminjam,
        status: 'menunggu',
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    // Notifikasi ke semua Sarana dan Admin
    // Gunakan adminClient — staff tidak bisa query profiles lain (RLS profiles_select_own)
    const adminClientNotif = await createAdminClient()
    const { data: penerima } = await adminClientNotif
      .from('profiles').select('id')
      .in('role', ['sarana', 'admin'])
      .eq('is_active', true)
    await Promise.all(
      (penerima ?? []).map(p =>
        sendNotification({
          user_id: p.id,
          judul: 'Peminjaman Barang Baru',
          pesan: `Ada permintaan peminjaman ${jumlah} ${barang.satuan} ${barang.nama_barang}`,
          tipe: 'peminjaman_barang',
          reference_id: data.id,
        })
      )
    )

    revalidatePath('/inventaris/peminjaman')
    return { success: true, data: data as PeminjamanBarang }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

// =============================================================================
// APPROVE (Sarana Only)
// =============================================================================

export async function approvePeminjamanBarang(id: string, catatan?: string): Promise<ActionResult> {
  try {
    const { supabase, user, role } = await requireAuth()
    if (role !== 'sarana') return { success: false, error: 'Hanya Sarana yang bisa menyetujui peminjaman' }

    const { data: peminjaman } = await supabase
      .from('peminjaman_barang')
      .select('*, inventaris(*), user:user_id(id, full_name)')
      .eq('id', id).single()
    if (!peminjaman) return { success: false, error: 'Peminjaman tidak ditemukan' }
    if (peminjaman.status !== 'menunggu') return { success: false, error: 'Peminjaman sudah tidak dalam status menunggu' }

    // Update status peminjaman
    const { error } = await supabase
      .from('peminjaman_barang')
      .update({
        status: 'dipinjam',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        catatan_sarana: catatan ?? null,
      })
      .eq('id', id)
    if (error) return { success: false, error: error.message }

    // Catat mutasi keluar
    const { data: inv } = await supabase.from('inventaris').select('jumlah_stok').eq('id', peminjaman.inventaris_id).single()
    if (inv) {
      await supabase.from('mutasi_barang').insert({
        inventaris_id: peminjaman.inventaris_id,
        jenis_mutasi: 'keluar',
        jumlah: peminjaman.jumlah_dipinjam,
        stok_sebelum: inv.jumlah_stok,
        stok_sesudah: inv.jumlah_stok - peminjaman.jumlah_dipinjam,
        keterangan: `Dipinjam oleh ${peminjaman.user?.full_name ?? peminjaman.user?.id} (peminjaman #${id})`,
        user_id: user.id,
        tanggal: new Date().toISOString().split('T')[0],
      })
    }

    // Notifikasi ke peminjam
    await sendNotification({
      user_id: peminjaman.user.id,
      judul: 'Peminjaman Barang Disetujui ✓',
      pesan: `Peminjaman ${peminjaman.jumlah_dipinjam} ${peminjaman.inventaris.satuan} ${peminjaman.inventaris.nama_barang} telah disetujui.`,
      tipe: 'peminjaman_barang',
      reference_id: id,
    })

    revalidatePath('/inventaris/peminjaman')
    revalidatePath('/inventaris/barang')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

// =============================================================================
// REJECT (Sarana Only)
// =============================================================================

export async function rejectPeminjamanBarang(id: string, catatan: string): Promise<ActionResult> {
  try {
    const { supabase, user, role } = await requireAuth()
    if (role !== 'sarana') return { success: false, error: 'Hanya Sarana yang bisa menolak peminjaman' }
    if (!catatan || catatan.length < 5) return { success: false, error: 'Catatan alasan wajib diisi' }

    const { data: peminjaman } = await supabase
      .from('peminjaman_barang').select('*, inventaris(nama_barang, satuan), user:user_id(id)')
      .eq('id', id).single()
    if (!peminjaman) return { success: false, error: 'Peminjaman tidak ditemukan' }

    const { error } = await supabase
      .from('peminjaman_barang')
      .update({ status: 'ditolak', catatan_sarana: catatan, approved_by: user.id, approved_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return { success: false, error: error.message }

    await sendNotification({
      user_id: peminjaman.user.id,
      judul: 'Peminjaman Barang Ditolak',
      pesan: `Peminjaman ${peminjaman.inventaris.nama_barang} ditolak. Alasan: ${catatan}`,
      tipe: 'peminjaman_barang',
      reference_id: id,
    })

    revalidatePath('/inventaris/peminjaman')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

// =============================================================================
// KONFIRMASI PENGEMBALIAN (Sarana Only)
// =============================================================================

export async function konfirmasiPengembalian(
  id: string,
  kondisiSaatKembali: string,
  catatan?: string
): Promise<ActionResult> {
  try {
    const { supabase, user, role } = await requireAuth()
    if (role !== 'sarana') return { success: false, error: 'Hanya Sarana yang bisa konfirmasi pengembalian' }

    const { data: peminjaman } = await supabase
      .from('peminjaman_barang').select('*, inventaris(*)')
      .eq('id', id).single()
    if (!peminjaman) return { success: false, error: 'Peminjaman tidak ditemukan' }
    if (!['dipinjam', 'terlambat'].includes(peminjaman.status)) {
      return { success: false, error: 'Barang tidak sedang dipinjam' }
    }

    const today = new Date().toISOString().split('T')[0]

    const { error } = await supabase
      .from('peminjaman_barang')
      .update({
        status: 'dikembalikan',
        kondisi_saat_kembali: kondisiSaatKembali,
        catatan_sarana: catatan ?? null,
        returned_to: user.id,
        returned_at: new Date().toISOString(),
        tanggal_dikembalikan_aktual: today,
      })
      .eq('id', id)
    if (error) return { success: false, error: error.message }

    // Update stok inventaris
    const { data: inv } = await supabase
      .from('inventaris').select('jumlah_stok').eq('id', peminjaman.inventaris_id).single()
    if (inv) {
      if (kondisiSaatKembali === 'hilang') {
        // Barang hilang — stok tidak dikembalikan, catat mutasi hilang
        await supabase.from('mutasi_barang').insert({
          inventaris_id: peminjaman.inventaris_id,
          jenis_mutasi: 'hilang',
          jumlah: peminjaman.jumlah_dipinjam,
          stok_sebelum: inv.jumlah_stok,
          stok_sesudah: inv.jumlah_stok,
          keterangan: `Barang hilang dari peminjaman #${id}`,
          user_id: user.id,
          tanggal: today,
        })
      } else {
        const stokBaru = inv.jumlah_stok + peminjaman.jumlah_dipinjam
        await supabase.from('inventaris').update({ jumlah_stok: stokBaru }).eq('id', peminjaman.inventaris_id)

        // Catat mutasi masuk
        await supabase.from('mutasi_barang').insert({
          inventaris_id: peminjaman.inventaris_id,
          jenis_mutasi: 'masuk',
          jumlah: peminjaman.jumlah_dipinjam,
          stok_sebelum: inv.jumlah_stok,
          stok_sesudah: stokBaru,
          keterangan: `Dikembalikan dari peminjaman #${id}, kondisi: ${kondisiSaatKembali}`,
          user_id: user.id,
          tanggal: today,
        })

        // Jika rusak, tambah mutasi rusak
        if (['rusak_ringan', 'rusak_berat'].includes(kondisiSaatKembali)) {
          await supabase.from('mutasi_barang').insert({
            inventaris_id: peminjaman.inventaris_id,
            jenis_mutasi: 'rusak',
            jumlah: peminjaman.jumlah_dipinjam,
            stok_sebelum: stokBaru,
            stok_sesudah: stokBaru,
            keterangan: `Kondisi saat kembali: ${kondisiSaatKembali}`,
            user_id: user.id,
            tanggal: today,
          })
          // Update kondisi inventaris jika rusak berat
          if (kondisiSaatKembali === 'rusak_berat') {
            await supabase.from('inventaris').update({ kondisi: 'rusak_berat' }).eq('id', peminjaman.inventaris_id)
          }
        }
      }
    }

    revalidatePath('/inventaris/peminjaman')
    revalidatePath('/inventaris/barang')
    revalidatePath('/inventaris/mutasi')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

