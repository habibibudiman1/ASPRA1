'use server'

// =============================================================================
// lib/actions/inventaris-actions.ts
// Server Actions untuk CRUD inventaris barang
// =============================================================================

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  ActionResult, Inventaris, PaginatedResult, InventarisFilters,
  DashboardInventarisStats, InventarisByKategori, InventarisByKondisi,
  InventarisKategori, InventarisKondisi,
} from '@/lib/types'
import { DEFAULT_PAGE_SIZE, STOK_RENDAH_THRESHOLD } from '@/lib/constants'

async function requireSaranaOrAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Tidak terautentikasi')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = (user.app_metadata?.role as string | undefined) ?? (profile?.role as string | undefined) ?? 'staff'
  if (!['sarana', 'admin'].includes(role)) {
    throw new Error('Hanya Sarana atau Admin yang bisa melakukan aksi ini')
  }
  return { supabase, user, role }
}

async function requireSarana() {
  const ctx = await requireSaranaOrAdmin()
  if (ctx.role !== 'sarana') throw new Error('Hanya Sarana yang bisa melakukan aksi ini')
  return ctx
}

// =============================================================================
// READ
// =============================================================================

export async function getInventaris(
  filters?: InventarisFilters,
  page = 1,
  per_page = DEFAULT_PAGE_SIZE
): Promise<PaginatedResult<Inventaris>> {
  const supabase = await createClient()
  const from = (page - 1) * per_page
  const to = from + per_page - 1

  let query = supabase
    .from('inventaris')
    .select('*', { count: 'exact' })
    .eq('is_deleted', false)
    .order('nama_barang', { ascending: true })
    .range(from, to)

  if (filters?.search) {
    query = query.or(`nama_barang.ilike.%${filters.search}%,kode_barang.ilike.%${filters.search}%`)
  }
  if (filters?.kategori && filters.kategori !== 'all') query = query.eq('kategori', filters.kategori)
  if (filters?.kondisi && filters.kondisi !== 'all')   query = query.eq('kondisi', filters.kondisi)
  if (filters?.lokasi) query = query.ilike('lokasi_penempatan', `%${filters.lokasi}%`)

  const { data, count, error } = await query
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as Inventaris[],
    pagination: { page, per_page, total: count ?? 0, total_pages: Math.ceil((count ?? 0) / per_page) },
  }
}

// =============================================================================
// GROUP BY NAMA BARANG
// Mengelompokkan inventaris berdasarkan nama_barang
// =============================================================================

export interface InventarisGroupedByNama {
  nama_barang: string
  kategori: InventarisKategori
  total_jenis: number      // baris dengan nama yang sama
  total_unit: number       // jumlah stok gabungan
  kondisi_utama: InventarisKondisi  // kondisi terbanyak
  lokasi_list: string[]    // daftar lokasi unik
}

export async function getInventarisGroupedByNama(
  filters?: { search?: string; kategori?: InventarisKategori | 'all'; lokasi?: string; kondisi?: string }
): Promise<InventarisGroupedByNama[]> {
  const supabase = await createClient()

  let query = supabase
    .from('inventaris')
    .select('nama_barang, kategori, jumlah_stok, kondisi, lokasi_penempatan')
    .eq('is_deleted', false)
    .order('nama_barang', { ascending: true })
    .limit(100000)

  if (filters?.search) {
    query = query.ilike('nama_barang', `%${filters.search}%`)
  }
  if (filters?.kategori && filters.kategori !== 'all') {
    query = query.eq('kategori', filters.kategori)
  }
  if (filters?.lokasi) {
    query = query.eq('lokasi_penempatan', filters.lokasi)
  }
  if (filters?.kondisi && filters.kondisi !== 'all') {
    query = query.eq('kondisi', filters.kondisi)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  // Group di sisi aplikasi
  const groupMap = new Map<string, {
    kategori: InventarisKategori
    total_unit: number
    total_jenis: number
    kondisiCount: Map<string, number>
    lokasi_set: Set<string>
  }>()

  for (const row of data ?? []) {
    const key = row.nama_barang
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        kategori: row.kategori as InventarisKategori,
        total_unit: 0,
        total_jenis: 0,
        kondisiCount: new Map(),
        lokasi_set: new Set(),
      })
    }
    const g = groupMap.get(key)!
    g.total_unit += row.jumlah_stok
    g.total_jenis += 1
    g.kondisiCount.set(row.kondisi, (g.kondisiCount.get(row.kondisi) ?? 0) + 1)
    g.lokasi_set.add(row.lokasi_penempatan)
  }

  return Array.from(groupMap.entries()).map(([nama, g]) => {
    let kondisi_utama: InventarisKondisi = 'baik'
    let maxCount = 0
    for (const [k, c] of g.kondisiCount.entries()) {
      if (c > maxCount) { maxCount = c; kondisi_utama = k as InventarisKondisi }
    }
    return {
      nama_barang: nama,
      kategori: g.kategori,
      total_jenis: g.total_jenis,
      total_unit: g.total_unit,
      kondisi_utama,
      lokasi_list: Array.from(g.lokasi_set).slice(0, 3),
    }
  })
}

// =============================================================================
// GET BY NAMA — Semua baris dengan nama_barang tertentu (untuk drilldown)
// =============================================================================

export async function getInventarisByNama(
  nama: string,
  page = 1,
  per_page = DEFAULT_PAGE_SIZE,
  lokasi?: string
): Promise<PaginatedResult<Inventaris>> {
  const supabase = await createClient()
  const from = (page - 1) * per_page
  const to = from + per_page - 1

  let query = supabase
    .from('inventaris')
    .select('*', { count: 'exact' })
    .eq('is_deleted', false)
    .ilike('nama_barang', nama)

  if (lokasi) {
    query = query.eq('lokasi_penempatan', lokasi)
  }

  const { data, count, error } = await query
    .order('lokasi_penempatan', { ascending: true })
    .range(from, to)

  if (error) throw new Error(error.message)
  return {
    data: (data ?? []) as Inventaris[],
    pagination: { page, per_page, total: count ?? 0, total_pages: Math.ceil((count ?? 0) / per_page) },
  }
}

// =============================================================================
// GROUP BY LOKASI
// Mengelompokkan inventaris berdasarkan lokasi_penempatan
// =============================================================================

export interface InventarisGroupedByLokasi {
  lokasi: string
  total_jenis: number
  total_unit: number
  kategori_list: InventarisKategori[]
}

export async function getInventarisGroupedByLokasi(
  filters?: { search?: string }
): Promise<InventarisGroupedByLokasi[]> {
  const supabase = await createClient()

  let query = supabase
    .from('inventaris')
    .select('lokasi_penempatan, kategori, jumlah_stok')
    .eq('is_deleted', false)
    .order('lokasi_penempatan', { ascending: true })
    .limit(100000)

  if (filters?.search) {
    query = query.ilike('lokasi_penempatan', `%${filters.search}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const lokasiMap = new Map<string, {
    total_jenis: number
    total_unit: number
    kategori_set: Set<InventarisKategori>
  }>()

  for (const row of data ?? []) {
    const key = row.lokasi_penempatan
    if (!lokasiMap.has(key)) {
      lokasiMap.set(key, { total_jenis: 0, total_unit: 0, kategori_set: new Set() })
    }
    const g = lokasiMap.get(key)!
    g.total_jenis += 1
    g.total_unit += row.jumlah_stok
    g.kategori_set.add(row.kategori as InventarisKategori)
  }

  return Array.from(lokasiMap.entries())
    .map(([lokasi, g]) => ({
      lokasi,
      total_jenis: g.total_jenis,
      total_unit: g.total_unit,
      kategori_list: Array.from(g.kategori_set),
    }))
    .sort((a, b) => a.lokasi.localeCompare(b.lokasi, 'id'))
}

// =============================================================================
// GET BY LOKASI — Semua barang di satu lokasi (untuk drilldown)
// =============================================================================

export async function getInventarisByLokasi(
  lokasi: string,
  page = 1,
  per_page = DEFAULT_PAGE_SIZE
): Promise<PaginatedResult<Inventaris>> {
  const supabase = await createClient()
  const from = (page - 1) * per_page
  const to = from + per_page - 1

  const { data, count, error } = await supabase
    .from('inventaris')
    .select('*', { count: 'exact' })
    .eq('is_deleted', false)
    .eq('lokasi_penempatan', lokasi)
    .order('nama_barang', { ascending: true })
    .range(from, to)

  if (error) throw new Error(error.message)
  return {
    data: (data ?? []) as Inventaris[],
    pagination: { page, per_page, total: count ?? 0, total_pages: Math.ceil((count ?? 0) / per_page) },
  }
}



export async function getInventarisById(id: string): Promise<Inventaris | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('inventaris').select('*').eq('id', id).eq('is_deleted', false).single()
  return data as Inventaris | null
}

export async function getInventarisList(): Promise<Inventaris[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('inventaris').select('*').eq('is_deleted', false)
    .neq('kondisi', 'rusak_berat')
    .order('nama_barang', { ascending: true })
  return (data ?? []) as Inventaris[]
}

export async function generateKodeBarang(kategori: string): Promise<string> {
  const supabase = await createClient()
  const prefixMap: Record<string, string> = {
    elektronik: 'ELK', furniture: 'FRN', atk: 'ATK',
    kendaraan: 'KDR', alat_olahraga: 'OLR', alat_lab: 'LAB', lainnya: 'LNY',
  }
  const prefix = prefixMap[kategori] ?? 'LNY'

  const { data } = await supabase
    .from('inventaris')
    .select('kode_barang')
    .like('kode_barang', `INV-${prefix}-%`)
    .order('kode_barang', { ascending: false })
    .limit(1)
    .single()

  let seq = 1
  if (data?.kode_barang) {
    const parts = data.kode_barang.split('-')
    seq = (parseInt(parts[2] ?? '0', 10) || 0) + 1
  }
  return `INV-${prefix}-${String(seq).padStart(4, '0')}`
}

// =============================================================================
// CREATE
// =============================================================================

export async function createInventaris(formData: FormData): Promise<ActionResult<Inventaris>> {
  try {
    await requireSaranaOrAdmin()
    const supabase = await createClient()
    const kategori = formData.get('kategori') as string

    // Auto-generate kode jika tidak disertakan
    const kodeBarang = (formData.get('kode_barang') as string) || await generateKodeBarang(kategori)

    const payload = {
      kode_barang: kodeBarang,
      nama_barang: formData.get('nama_barang') as string,
      kategori,
      merk: (formData.get('merk') as string) || null,
      tipe_model: (formData.get('tipe_model') as string) || null,
      jumlah_stok: Number(formData.get('jumlah_stok')),
      satuan: formData.get('satuan') as string,
      kondisi: (formData.get('kondisi') as string) || 'baik',
      lokasi_penempatan: formData.get('lokasi_penempatan') as string,
      tanggal_perolehan: formData.get('tanggal_perolehan') as string,
      sumber_dana: (formData.get('sumber_dana') as string) || null,
      nilai_perolehan: formData.get('nilai_perolehan') ? Number(formData.get('nilai_perolehan')) : null,
      foto: (formData.get('foto') as string) || null,
      catatan: (formData.get('catatan') as string) || null,
    }

    if (!payload.nama_barang || !payload.kategori || !payload.satuan || !payload.lokasi_penempatan || !payload.tanggal_perolehan) {
      return { success: false, error: 'Field wajib belum lengkap' }
    }

    const { data, error } = await supabase.from('inventaris').insert(payload).select().single()
    if (error) return { success: false, error: error.message }

    revalidatePath('/inventaris/barang')
    revalidatePath('/inventaris')
    return { success: true, data: data as Inventaris }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

// =============================================================================
// UPDATE
// =============================================================================

export async function updateInventaris(formData: FormData): Promise<ActionResult> {
  try {
    await requireSaranaOrAdmin()
    const supabase = await createClient()
    const id = formData.get('id') as string

    const updates: Record<string, unknown> = {
      nama_barang: formData.get('nama_barang') as string,
      kategori: formData.get('kategori') as string,
      merk: (formData.get('merk') as string) || null,
      tipe_model: (formData.get('tipe_model') as string) || null,
      jumlah_stok: Number(formData.get('jumlah_stok')),
      satuan: formData.get('satuan') as string,
      kondisi: formData.get('kondisi') as string,
      lokasi_penempatan: formData.get('lokasi_penempatan') as string,
      tanggal_perolehan: formData.get('tanggal_perolehan') as string,
      sumber_dana: (formData.get('sumber_dana') as string) || null,
      nilai_perolehan: formData.get('nilai_perolehan') ? Number(formData.get('nilai_perolehan')) : null,
      catatan: (formData.get('catatan') as string) || null,
    }
    if (formData.get('foto')) updates.foto = formData.get('foto') as string

    const { error } = await supabase.from('inventaris').update(updates).eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/inventaris/barang')
    revalidatePath(`/inventaris/barang/${id}`)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

// =============================================================================
// DELETE (Soft Delete)
// =============================================================================

export async function deleteInventaris(id: string): Promise<ActionResult> {
  try {
    await requireSaranaOrAdmin()
    const supabase = await createClient()

    // Cek peminjaman aktif
    const { count } = await supabase
      .from('peminjaman_barang').select('*', { count: 'exact', head: true })
      .eq('inventaris_id', id).in('status', ['menunggu', 'dipinjam', 'terlambat'])

    if (count && count > 0) {
      return { success: false, error: 'Tidak bisa menghapus barang yang masih dipinjam' }
    }

    const { error } = await supabase.from('inventaris').update({ is_deleted: true }).eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/inventaris/barang')
    revalidatePath('/inventaris')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

// =============================================================================
// DASHBOARD INVENTARIS
// =============================================================================

export async function getDashboardInventaris(): Promise<
  DashboardInventarisStats & {
    byKategori: InventarisByKategori[]
    byKondisi: InventarisByKondisi[]
    terlambat: Array<{ peminjaman: unknown; daysLate: number }>
    stokRendah: Inventaris[]
  }
> {
  const supabase = await createClient()

  // Hanya ambil kolom yang dibutuhkan untuk kalkulasi dashboard (bukan catatan/foto dll)
  const { data: items } = await supabase
    .from('inventaris')
    .select('id, nama_barang, kode_barang, kategori, kondisi, jumlah_stok, nilai_perolehan, lokasi_penempatan, satuan, merk, tipe_model')
    .eq('is_deleted', false)

  const totalJenis = items?.length ?? 0
  const totalUnit = items?.reduce((sum, i) => sum + i.jumlah_stok, 0) ?? 0
  const totalNilai = items?.reduce((sum, i) => sum + (i.nilai_perolehan ?? 0) * i.jumlah_stok, 0) ?? 0

  // By kategori
  const kategoriMap = new Map<string, { jenis: number; unit: number }>()
  for (const item of items ?? []) {
    const k = kategoriMap.get(item.kategori) ?? { jenis: 0, unit: 0 }
    kategoriMap.set(item.kategori, { jenis: k.jenis + 1, unit: k.unit + item.jumlah_stok })
  }
  const byKategori: InventarisByKategori[] = Array.from(kategoriMap.entries()).map(([k, v]) => ({
    kategori: k as never,
    jumlah_jenis: v.jenis,
    jumlah_unit: v.unit,
  }))

  // By kondisi
  const kondisiMap = new Map<string, number>()
  for (const item of items ?? []) {
    kondisiMap.set(item.kondisi, (kondisiMap.get(item.kondisi) ?? 0) + 1)
  }
  const byKondisi: InventarisByKondisi[] = Array.from(kondisiMap.entries()).map(([k, v]) => ({
    kondisi: k as never,
    jumlah: v,
  }))

  // Peminjaman aktif
  const { data: pinjamAktif, count: pinjamItemCount } = await supabase
    .from('peminjaman_barang').select('jumlah_dipinjam', { count: 'exact' })
    .in('status', ['dipinjam', 'terlambat'])
  const totalUnitDipinjam = pinjamAktif?.reduce((s, p) => s + p.jumlah_dipinjam, 0) ?? 0

  // Terlambat
  const today = new Date().toISOString().split('T')[0]
  const { data: terlambatData } = await supabase
    .from('peminjaman_barang')
    .select('*, inventaris(*), user:user_id(full_name)')
    .in('status', ['dipinjam', 'terlambat'])
    .lt('tanggal_kembali_estimasi', today)
  const terlambat = (terlambatData ?? []).map(p => ({
    peminjaman: p,
    daysLate: Math.floor((Date.now() - new Date(p.tanggal_kembali_estimasi).getTime()) / 86400000),
  }))

  // Stok rendah
  const stokRendah = (items ?? []).filter(i => i.jumlah_stok < STOK_RENDAH_THRESHOLD) as Inventaris[]

  return {
    total_jenis_barang: totalJenis,
    total_unit: totalUnit,
    total_nilai_aset: totalNilai,
    sedang_dipinjam_item: pinjamItemCount ?? 0,
    sedang_dipinjam_unit: totalUnitDipinjam,
    terlambat_count: terlambat.length,
    stok_rendah_count: stokRendah.length,
    byKategori,
    byKondisi,
    terlambat,
    stokRendah,
  }
}

// =============================================================================
// IMPORT VIA CSV
// Format: nama_barang,kategori,jumlah_stok,satuan,kondisi,lokasi_penempatan,
//         merk,tipe_model,tanggal_perolehan,nilai_perolehan,catatan
// =============================================================================

const VALID_KATEGORI = ['elektronik', 'furniture', 'atk', 'kendaraan', 'alat_olahraga', 'alat_lab', 'lainnya']
const VALID_KONDISI  = ['baik', 'rusak_ringan', 'rusak_berat']

export async function importInventarisFromCSV(
  rows: Array<{
    nama_barang: string
    kategori: string
    jumlah_stok: number
    satuan: string
    kondisi?: string
    lokasi_penempatan: string
    tanggal_perolehan?: string
    merk?: string
    tipe_model?: string
    nilai_perolehan?: number
    catatan?: string
  }>
): Promise<ActionResult<{ imported: number; errors: string[] }>> {
  try {
    const { supabase } = await requireSaranaOrAdmin()
    const errors: string[] = []
    let imported = 0
    const today = new Date().toISOString().split('T')[0]

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2

      if (!row.nama_barang?.trim()) { errors.push(`Baris ${rowNum}: nama_barang kosong`); continue }
      const kat = row.kategori?.toLowerCase().trim()
      if (!VALID_KATEGORI.includes(kat)) { errors.push(`Baris ${rowNum}: kategori "${row.kategori}" tidak valid`); continue }
      if (!row.satuan?.trim()) { errors.push(`Baris ${rowNum}: satuan kosong`); continue }
      if (!row.lokasi_penempatan?.trim()) { errors.push(`Baris ${rowNum}: lokasi_penempatan kosong`); continue }

      const kondisi = VALID_KONDISI.includes(row.kondisi?.toLowerCase().trim() ?? '') ? row.kondisi!.toLowerCase().trim() : 'baik'
      const kode_barang = await generateKodeBarang(kat)

      const { error } = await supabase.from('inventaris').insert({
        kode_barang,
        nama_barang:        row.nama_barang.trim(),
        kategori:           kat as InventarisKategori,
        jumlah_stok:        Math.max(0, Number(row.jumlah_stok) || 0),
        satuan:             row.satuan.trim(),
        kondisi:            kondisi as InventarisKondisi,
        lokasi_penempatan:  row.lokasi_penempatan.trim(),
        tanggal_perolehan:  row.tanggal_perolehan?.trim() || today,
        merk:               row.merk?.trim() || null,
        tipe_model:         row.tipe_model?.trim() || null,
        nilai_perolehan:    row.nilai_perolehan ? Number(row.nilai_perolehan) : null,
        catatan:            row.catatan?.trim() || null,
      })

      if (error) { errors.push(`Baris ${rowNum}: ${error.message}`); continue }
      imported++
    }

    revalidatePath('/inventaris/barang')
    return { success: true, data: { imported, errors } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Gagal mengimport barang' }
  }
}
