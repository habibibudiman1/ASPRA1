import { getOpnameSessions } from '@/lib/actions/inventory-actions'
import { getItems, getItemCategories } from '@/lib/actions/inventory-actions'
import { getRooms } from '@/lib/actions/room-actions'
import { getCurrentUser } from '@/lib/actions/user-actions'
import { OpnameClient } from '@/components/inventory/opname-client'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Opname Barang' }

export default async function OpnamePage() {
  const profile = await getCurrentUser()
  if (profile?.role !== 'it_admin') redirect('/inventory')

  const [sessions, items, rooms] = await Promise.all([
    getOpnameSessions(),
    getItems(),
    getRooms(),
  ])

  return <OpnameClient sessions={sessions} items={items} rooms={rooms} />
}
