'use server'

// =============================================================================
// lib/actions/export-ruangan-actions.ts
// Server action untuk mengambil semua data ruangan (tanpa paginasi) untuk export
// =============================================================================

import { createAdminClient } from '@/lib/supabase/server'
import type { Ruangan } from '@/lib/types'

const BATCH = 1000

export async function getAllRuanganForExport(): Promise<Ruangan[]> {
  const supabase = await createAdminClient()

  const all: Ruangan[] = []
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('ruangan')
      .select('*')
      .eq('is_deleted', false)
      .order('lokasi_gedung', { ascending: true })
      .order('nama_ruangan',  { ascending: true })
      .range(from, from + BATCH - 1)

    if (error) {
      console.error('[getAllRuanganForExport]', error.message)
      return all
    }

    const batch = (data ?? []) as Ruangan[]
    all.push(...batch)

    if (batch.length < BATCH) break
    from += BATCH
  }

  return all
}
