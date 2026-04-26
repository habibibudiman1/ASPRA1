import { getRoomBookings, getRooms } from '@/lib/actions/room-actions'
import { getCurrentUser } from '@/lib/actions/user-actions'
import { BookingClient } from '@/components/rooms/booking-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Booking Ruangan' }

export default async function BookingPage() {
  const [profile, bookings, rooms] = await Promise.all([
    getCurrentUser(),
    getRoomBookings(),
    getRooms(),
  ])

  return <BookingClient bookings={bookings} rooms={rooms} profile={profile!} />
}
