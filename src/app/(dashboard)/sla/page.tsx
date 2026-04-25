// =============================================================================
// app/(dashboard)/sla/page.tsx
// Halaman manajemen SLA (IT Admin only)
// =============================================================================

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/user-actions'
import { getSLAPolicies } from '@/lib/actions/sla-actions'
import { SLAClient } from '@/components/sla/sla-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'SLA Management' }

export default async function SLAPage() {
  const profile = await getCurrentUser()
  if (!profile || (profile.role !== 'it_admin' && profile.role !== 'admin')) redirect('/tickets')

  const policies = await getSLAPolicies()
  return <SLAClient policies={policies} />
}
