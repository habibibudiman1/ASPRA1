// =============================================================================
// app/(dashboard)/tickets/[id]/page.tsx
// Halaman detail tiket
// =============================================================================

import { notFound } from 'next/navigation'
import { getTicketById } from '@/lib/actions/ticket-actions'
import { getCurrentUser, getAdmins } from '@/lib/actions/user-actions'
import { TicketDetail } from '@/components/tickets/ticket-detail'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const ticket = await getTicketById(id)
  return { title: ticket ? `${ticket.ticket_number} — ${ticket.title}` : 'Tiket Tidak Ditemukan' }
}

export default async function TicketDetailPage({ params }: PageProps) {
  const { id } = await params
  const [ticket, profile, admins] = await Promise.all([
    getTicketById(id),
    getCurrentUser(),
    getAdmins(),
  ])

  if (!ticket) notFound()

  return (
    <TicketDetail
      ticket={ticket}
      currentProfile={profile!}
      admins={admins}
    />
  )
}
