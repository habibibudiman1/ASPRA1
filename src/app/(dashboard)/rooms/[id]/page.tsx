import { getRoomById, getRoomBookings } from '@/lib/actions/room-actions'
import { getItems, getItemCategories, getItemMutations } from '@/lib/actions/inventory-actions'
import { getRooms } from '@/lib/actions/room-actions'
import { getCurrentUser } from '@/lib/actions/user-actions'
import { RoomDetailClient } from '@/components/rooms/room-detail-client'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const room = await getRoomById(id)
  return { title: room ? `${room.name} (${room.code})` : 'Ruangan' }
}

export default async function RoomDetailPage({ params }: Props) {
  const { id } = await params
  const [profile, room, allRooms, categories, mutations] = await Promise.all([
    getCurrentUser(),
    getRoomById(id),
    getRooms(),
    getItemCategories(),
    getItemMutations(),
  ])

  if (!room) notFound()

  const bookings = await getRoomBookings(id)

  return (
    <RoomDetailClient
      room={room}
      allRooms={allRooms}
      categories={categories}
      bookings={bookings}
      mutations={mutations.filter(m => m.from_room_id === id || m.to_room_id === id)}
      profile={profile!}
    />
  )
}
