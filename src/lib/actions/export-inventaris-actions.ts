'use server'

// =============================================================================
// lib/actions/export-inventaris-actions.ts
// Server actions untuk mengambil data inventaris lengkap (tanpa paginasi)
// =============================================================================

import { createClient } from '@/lib/supabase/server'
import type { Inventaris } from '@/lib/types'

/** Ambil semua barang (untuk laporan lengkap) */
export async function getAllInventarisForExport(filters?: {
  kategori?: string
  kondisi?: string
  search?: string
}): Promise<Inventaris[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
    .from('inventaris')
    .select('*')
    .eq('is_deleted', false)
    .order('kategori', { ascending: true })
    .order('nama_barang', { ascending: true })
    .limit(100000)

  if (filters?.search)   query = query.ilike('nama_barang', `%${filters.search}%`)
  if (filters?.kategori && filters.kategori !== 'all') query = query.eq('kategori', filters.kategori)
  if (filters?.kondisi  && filters.kondisi !== 'all')  query = query.eq('kondisi', filters.kondisi)

  const { data, error } = await query
  if (error) { console.error('[getAllInventarisForExport]', error.message); return [] }
  return (data ?? []) as Inventaris[]
}

/** Ambil semua unit dari satu nama barang (untuk laporan per barang) */
export async function getInventarisByNamaForExport(namaBarang: string): Promise<Inventaris[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('inventaris')
    .select('*')
    .eq('is_deleted', false)
    .ilike('nama_barang', namaBarang)
    .order('lokasi_penempatan', { ascending: true })
    .limit(100000)

  if (error) { console.error('[getInventarisByNamaForExport]', error.message); return [] }
  return (data ?? []) as Inventaris[]
}
