'use server'

// =============================================================================
// lib/actions/export-booking-actions.ts
// Server actions untuk mengambil data booking lengkap (tanpa paginasi) untuk PDF
// =============================================================================

import { createAdminClient } from '@/lib/supabase/server'
import type { PeminjamanRuanganWithRelations } from '@/lib/types'

const BATCH = 1000

/** Ambil semua booking ruangan untuk periode tertentu */
export async function getAllBookingForExport(filters?: {
  ruangan_id?: string
  status?: string
  date_from?: string
  date_to?: string
}): Promise<PeminjamanRuanganWithRelations[]> {
  const supabase = await createAdminClient()

  const all: PeminjamanRuanganWithRelations[] = []
  let from = 0

  while (true) {
    let query = supabase
      .from('peminjaman_ruangan')
      .select('*, ruangan:ruangan_id(*), user:user_id(*), approver:approved_by(*)')
      .order('tanggal', { ascending: false })
      .order('jam_mulai', { ascending: true })
      .range(from, from + BATCH - 1)

    if (filters?.ruangan_id && filters.ruangan_id !== 'all')
      query = query.eq('ruangan_id', filters.ruangan_id)
    if (filters?.status && filters.status !== 'all')
      query = query.eq('status', filters.status)
    if (filters?.date_from)
      query = query.gte('tanggal', filters.date_from)
    if (filters?.date_to)
      query = query.lte('tanggal', filters.date_to)

    const { data, error } = await query
    if (error) {
      console.error('[getAllBookingForExport]', error.message)
      return all
    }

    const batch = (data ?? []) as PeminjamanRuanganWithRelations[]
    all.push(...batch)

    if (batch.length < BATCH) break
    from += BATCH
  }

  return all
}
