// =============================================================================
// app/(dashboard)/reports/page.tsx
// Halaman laporan dan export (IT Admin only)
// =============================================================================

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/user-actions'
import { createClient } from '@/lib/supabase/server'
import { ReportsClient } from '@/components/reports/reports-client'
import type { TicketPriority, TicketStatus } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Laporan' }

export default async function ReportsPage() {
  const profile = await getCurrentUser()
  if (!profile || profile.role !== 'it_admin') redirect('/tickets')

  const supabase = await createClient()

  const { data: tickets } = await supabase
    .from('tickets')
    .select(`
      id, ticket_number, title, status, priority, created_at, resolved_at, closed_at,
      sla_response_met, sla_resolution_met, rating,
      reporter:profiles!reporter_id(full_name, department),
      assignee:profiles!assignee_id(full_name),
      category:categories(name)
    `)
    .order('created_at', { ascending: false })

  const safeTickets = (tickets ?? []).map((item) => ({
    id: item.id as string,
    ticket_number: item.ticket_number as string,
    title: item.title as string,
    status: item.status as TicketStatus,
    priority: item.priority as TicketPriority,
    created_at: item.created_at as string,
    resolved_at: item.resolved_at as string | null,
    sla_response_met: item.sla_response_met as boolean | null,
    sla_resolution_met: item.sla_resolution_met as boolean | null,
    rating: item.rating as number | null,
    reporter: Array.isArray(item.reporter) ? (item.reporter[0] as { full_name: string; department: string | null } | undefined) ?? null : null,
    assignee: Array.isArray(item.assignee) ? (item.assignee[0] as { full_name: string } | undefined) ?? null : null,
    category: Array.isArray(item.category) ? (item.category[0] as { name: string } | undefined) ?? null : null,
  }))

  return <ReportsClient tickets={safeTickets} />
}
