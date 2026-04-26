// =============================================================================
// app/(dashboard)/dashboard/page.tsx
// Dashboard analytics untuk IT Admin
// =============================================================================

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/user-actions'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/dashboard/dashboard-client'
import type { TicketPriority, TicketStatus } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const profile = await getCurrentUser()
  if (!profile) redirect('/login')
  if (profile.role !== 'it_admin' && profile.role !== 'admin') redirect('/tickets')

  const supabase = await createClient()

  // Ambil semua statistik dalam parallel
  const [ticketsResult, recentTickets] = await Promise.all([
    supabase.from('tickets').select('status, priority, sla_response_met, sla_resolution_met, created_at, resolved_at, first_responded_at'),
    supabase
      .from('tickets')
      .select(`
        id, ticket_number, title, status, priority, created_at,
        reporter:profiles!reporter_id(full_name),
        assignee:profiles!assignee_id(full_name),
        category:categories(name, color)
      `)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const allTickets = ticketsResult.data ?? []
  const recent = (recentTickets.data ?? []).map((item) => ({
    id: item.id as string,
    ticket_number: item.ticket_number as string,
    title: item.title as string,
    status: item.status as TicketStatus,
    priority: item.priority as TicketPriority,
    created_at: item.created_at as string,
    reporter: Array.isArray(item.reporter) ? (item.reporter[0] as { full_name: string } | undefined) ?? null : null,
    assignee: Array.isArray(item.assignee) ? (item.assignee[0] as { full_name: string } | undefined) ?? null : null,
  }))

  // Hitung statistik
  const total = allTickets.length
  const byStatus = {
    open: allTickets.filter(t => t.status === 'open').length,
    in_progress: allTickets.filter(t => t.status === 'in_progress').length,
    resolved: allTickets.filter(t => t.status === 'resolved').length,
    closed: allTickets.filter(t => t.status === 'closed').length,
    reopened: allTickets.filter(t => t.status === 'reopened').length,
  }

  // Rata-rata waktu resolusi (dalam jam)
  const resolvedTickets = allTickets.filter(t => t.resolved_at && t.created_at)
  const avgResolutionHours = resolvedTickets.length > 0
    ? Math.round(
        resolvedTickets.reduce((sum, t) => {
          const diff = new Date(t.resolved_at!).getTime() - new Date(t.created_at).getTime()
          return sum + diff / (1000 * 60 * 60)
        }, 0) / resolvedTickets.length
      )
    : 0

  // SLA compliance
  const withSlaResponse = allTickets.filter(t => t.sla_response_met !== null)
  const withSlaResolution = allTickets.filter(t => t.sla_resolution_met !== null)
  const slaResponseCompliance = withSlaResponse.length > 0
    ? Math.round((withSlaResponse.filter(t => t.sla_response_met).length / withSlaResponse.length) * 100)
    : 100
  const slaResolutionCompliance = withSlaResolution.length > 0
    ? Math.round((withSlaResolution.filter(t => t.sla_resolution_met).length / withSlaResolution.length) * 100)
    : 100

  return (
    <DashboardClient
      stats={{ total, byStatus, avgResolutionHours, slaResponseCompliance, slaResolutionCompliance }}
      recentTickets={recent}
    />
  )
}
