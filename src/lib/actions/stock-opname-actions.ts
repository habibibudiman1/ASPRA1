'use server'

// =============================================================================
// lib/actions/stock-opname-actions.ts
// Server Actions untuk stock opname
// =============================================================================

import { createClient } from '@/lib/supabase/server'
import type { ActionResult, StockOpname, Inventaris, PaginatedResult } from '@/lib/types'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'

async function requireSarana() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Tidak terautentikasi')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'sarana') throw new Error('Hanya Sarana yang bisa melakukan stock opname')
  return { supabase, user }
}

// Ambil riwayat stock opname per sesi
export async function getStockOpnameSesi(
  page = 1,
  per_page = DEFAULT_PAGE_SIZE
): Promise<PaginatedResult<{ sesi_id: string; tanggal_opname: string; total: number; tidak_sesuai: number; user: { full_name: string } }>> {
  const supabase = await createClient()

  // Group by sesi_id menggunakan subquery
  const { data, error } = await supabase
    .from('stock_opname')
    .select('sesi_id, tanggal_opname, user:user_id(full_name)')
    .order('tanggal_opname', { ascending: false })

  if (error) throw new Error(error.message)

  // Deduplicate sesi
  const seen = new Set<string>()
  const sesiMap: Record<string, { sesi_id: string; tanggal_opname: string; user: { full_name: string }; total: number; tidak_sesuai: number }> = {}

  for (const row of data ?? []) {
    if (!seen.has(row.sesi_id)) {
      seen.add(row.sesi_id)
      const userRow = Array.isArray(row.user) ? row.user[0] : row.user
      sesiMap[row.sesi_id] = {
        sesi_id: row.sesi_id,
        tanggal_opname: row.tanggal_opname,
        user: { full_name: userRow?.full_name ?? '-' },
        total: 0,
        tidak_sesuai: 0,
      }
    }
  }

  // Count per sesi
  const sesiIds = Array.from(seen)
  for (const sesiId of sesiIds) {
    const { data: items } = await supabase
      .from('stock_opname').select('status').eq('sesi_id', sesiId)
    sesiMap[sesiId].total = items?.length ?? 0
    sesiMap[sesiId].tidak_sesuai = items?.filter(i => i.status === 'tidak_sesuai').length ?? 0
  }

  const allSesi = Object.values(sesiMap)
  const total = allSesi.length
  const paginated = allSesi.slice((page - 1) * per_page, page * per_page)

  return {
    data: paginated,
    pagination: { page, per_page, total, total_pages: Math.ceil(total / per_page) },
  }
}

export async function getStockOpnameBySesi(sesiId: string): Promise<(StockOpname & { inventaris: Inventaris })[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('stock_opname')
    .select('*, inventaris(*)')
    .eq('sesi_id', sesiId)
    .order('created_at', { ascending: true })
  return (data ?? []) as (StockOpname & { inventaris: Inventaris })[]
}

// Ambil daftar barang untuk memulai stock opname
export async function getInventarisUntukOpname(filters?: {
  kategori?: string
  lokasi?: string
}): Promise<Inventaris[]> {
  const supabase = await createClient()
  let query = supabase.from('inventaris').select('*').eq('is_deleted', false).order('nama_barang')
  if (filters?.kategori && filters.kategori !== 'all') query = query.eq('kategori', filters.kategori)
  if (filters?.lokasi) query = query.ilike('lokasi_penempatan', `%${filters.lokasi}%`)
  const { data } = await query
  return (data ?? []) as Inventaris[]
}

// Submit hasil stock opname (satu sesi)
export async function submitStockOpname(
  sesiId: string,
  tanggal: string,
  items: Array<{ inventaris_id: string; jumlah_fisik: number; keterangan?: string }>
): Promise<ActionResult<{ total: number; tidak_sesuai: number }>> {
  try {
    const { supabase, user } = await requireSarana()

    if (!items || items.length === 0) {
      return { success: false, error: 'Tidak ada item untuk disubmit' }
    }

    // Validasi: jika tidak sesuai, keterangan wajib
    for (const item of items) {
      // Ambil stok sistem
      const { data: inv } = await supabase.from('inventaris').select('jumlah_stok, nama_barang').eq('id', item.inventaris_id).single()
      if (!inv) continue
      const selisih = item.jumlah_fisik - inv.jumlah_stok
      if (selisih !== 0 && !item.keterangan) {
        return { success: false, error: `Keterangan wajib diisi untuk barang "${inv.nama_barang}" yang tidak sesuai` }
      }
    }

    // Build insert payload
    const insertPayload = await Promise.all(
      items.map(async (item) => {
        const { data: inv } = await supabase.from('inventaris').select('jumlah_stok').eq('id', item.inventaris_id).single()
        return {
          sesi_id: sesiId,
          inventaris_id: item.inventaris_id,
          jumlah_sistem: inv?.jumlah_stok ?? 0,
          jumlah_fisik: item.jumlah_fisik,
          keterangan: item.keterangan ?? null,
          user_id: user.id,
          tanggal_opname: tanggal,
        }
      })
    )

    const { error } = await supabase.from('stock_opname').insert(insertPayload)
    if (error) return { success: false, error: error.message }

    const tidakSesuai = insertPayload.filter(i => i.jumlah_fisik !== i.jumlah_sistem).length

    return {
      success: true,
      data: { total: items.length, tidak_sesuai: tidakSesuai },
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

