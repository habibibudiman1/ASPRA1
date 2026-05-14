'use server'

// =============================================================================
// lib/actions/export-ticket-actions.ts
// Server action untuk mengambil semua tiket (tanpa paginasi) untuk export
// =============================================================================

import { createAdminClient } from '@/lib/supabase/server'
import type { TicketWithRelations } from '@/lib/types'

const BATCH = 1000

export async function getAllTicketsForExport(filters?: {
  status?: string
  priority?: string
  category_id?: string
  search?: string
}): Promise<TicketWithRelations[]> {
  const supabase = await createAdminClient()

  const all: TicketWithRelations[] = []
  let from = 0

  while (true) {
    let query = supabase
      .from('tickets')
      .select(`
        *,
        category:categories(id, name, color),
        reporter:profiles!reporter_id(id, full_name, email, avatar_url, department),
        assignee:profiles!assignee_id(id, full_name, email, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .range(from, from + BATCH - 1)

    if (filters?.status && filters.status !== 'all')
      query = query.eq('status', filters.status)
    if (filters?.priority && filters.priority !== 'all')
      query = query.eq('priority', filters.priority)
    if (filters?.category_id && filters.category_id !== 'all')
      query = query.eq('category_id', filters.category_id)
    if (filters?.search)
      query = query.ilike('title', `%${filters.search}%`)

    const { data, error } = await query
    if (error) {
      console.error('[getAllTicketsForExport]', error.message)
      return all
    }

    const batch = (data ?? []) as TicketWithRelations[]
    all.push(...batch)

    if (batch.length < BATCH) break
    from += BATCH
  }

  return all
}
