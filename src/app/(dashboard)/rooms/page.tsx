import { getRooms } from '@/lib/actions/room-actions'
import { getCurrentUser } from '@/lib/actions/user-actions'
import { RoomsClient } from '@/components/rooms/rooms-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Daftar Ruangan' }

export default async function RoomsPage() {
  const [profile, rooms] = await Promise.all([getCurrentUser(), getRooms()])
  return <RoomsClient rooms={rooms} profile={profile!} />
}
