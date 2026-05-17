import { getCurrentUser } from '@/lib/actions/user-actions'
import { getRuanganList } from '@/lib/actions/ruangan-actions'
import BookingRuanganClient from './booking-client'

export default async function BookingRuanganPage() {
  const [profile, ruanganList] = await Promise.all([getCurrentUser(), getRuanganList()])
  const isStaff = !profile || profile.role === 'staff'
  return <BookingRuanganClient ruanganList={ruanganList} isStaff={isStaff} />
}
