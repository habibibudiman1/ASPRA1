'use server'

// =============================================================================
// lib/actions/export-ruangan-actions.ts
// Server action untuk mengambil semua data ruangan (tanpa paginasi) untuk export
// =============================================================================

import { createClient } from '@/lib/supabase/server'
import type { Ruangan } from '@/lib/types'

export async function getAllRuanganForExport(): Promise<Ruangan[]> {
  const supabase = await createClient()

  // Cek auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('ruangan')
    .select('*')
    .eq('is_deleted', false)
    .order('lokasi_gedung', { ascending: true })
    .order('nama_ruangan',  { ascending: true })

  if (error) {
    console.error('[getAllRuanganForExport]', error.message)
    return []
  }

  return (data ?? []) as Ruangan[]
}
