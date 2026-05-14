// =============================================================================
// app/(dashboard)/ruangan/booking/page.tsx
// Server component — fetch ruangan terbaru lalu render form interaktif
// =============================================================================

import { getRuanganList } from '@/lib/actions/ruangan-actions'
import BookingRuanganClient from './booking-client'

export default async function BookingRuanganPage() {
  const ruanganList = await getRuanganList()
  return <BookingRuanganClient ruanganList={ruanganList} />
}
