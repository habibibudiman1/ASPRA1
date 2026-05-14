'use server'

// =============================================================================
// lib/actions/export-inventaris-actions.ts
// Server actions untuk mengambil data inventaris lengkap (tanpa paginasi)
// =============================================================================

import { createAdminClient } from '@/lib/supabase/server'
import type { Inventaris } from '@/lib/types'

const BATCH = 1000

/** Ambil semua barang (untuk laporan lengkap) — batch-fetch melewati batas 1000 baris PostgREST */
export async function getAllInventarisForExport(filters?: {
  kategori?: string
  kondisi?: string
  search?: string
}): Promise<Inventaris[]> {
  const supabase = await createAdminClient()

  const all: Inventaris[] = []
  let from = 0

  while (true) {
    let query = supabase
      .from('inventaris')
      .select('*')
      .eq('is_deleted', false)
      .order('kategori', { ascending: true })
      .order('nama_barang', { ascending: true })
      .range(from, from + BATCH - 1)

    if (filters?.search)
      query = query.ilike('nama_barang', `%${filters.search}%`)
    if (filters?.kategori && filters.kategori !== 'all')
      query = query.eq('kategori', filters.kategori)
    if (filters?.kondisi && filters.kondisi !== 'all')
      query = query.eq('kondisi', filters.kondisi)

    const { data, error } = await query
    if (error) {
      console.error('[getAllInventarisForExport]', error.message)
      return all
    }

    const batch = (data ?? []) as Inventaris[]
    all.push(...batch)

    if (batch.length < BATCH) break
    from += BATCH
  }

  return all
}

/** Ambil semua unit dari satu nama barang (untuk laporan per barang) */
export async function getInventarisByNamaForExport(namaBarang: string): Promise<Inventaris[]> {
  const supabase = await createAdminClient()

  const all: Inventaris[] = []
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('inventaris')
      .select('*')
      .eq('is_deleted', false)
      .ilike('nama_barang', namaBarang)
      .order('lokasi_penempatan', { ascending: true })
      .range(from, from + BATCH - 1)

    if (error) {
      console.error('[getInventarisByNamaForExport]', error.message)
      return all
    }

    const batch = (data ?? []) as Inventaris[]
    all.push(...batch)

    if (batch.length < BATCH) break
    from += BATCH
  }

  return all
}
