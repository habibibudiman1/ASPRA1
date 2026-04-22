// =============================================================================
// app/(dashboard)/reports/page.tsx
// Halaman laporan dan export (IT Admin only)
// =============================================================================

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/user-actions'
import { createClient } from '@/lib/supabase/server'
import { ReportsClient } from '@/components/reports/reports-client'
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

  return <ReportsClient tickets={tickets as any[] ?? []} />
}
