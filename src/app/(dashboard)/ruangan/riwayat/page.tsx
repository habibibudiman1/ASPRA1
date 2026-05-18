// =============================================================================
// app/(dashboard)/ruangan/riwayat/page.tsx
// Riwayat booking ruangan (role-aware)
// =============================================================================

import type { Metadata } from 'next'
import { getBookings } from '@/lib/actions/booking-actions'
import { getCurrentUser } from '@/lib/actions/user-actions'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BOOKING_STATUS } from '@/lib/constants'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Link from 'next/link'
import { CalendarPlus } from 'lucide-react'
import type { PeminjamanRuanganWithRelations } from '@/lib/types'

export const metadata: Metadata = { title: 'Riwayat Booking | ASPRA' }
export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ status?: string; page?: string }>
}

function BookingStatusBadge({ status }: { status: string }) {
  const config = BOOKING_STATUS[status as keyof typeof BOOKING_STATUS]
  if (!config) return <Badge variant="outline">{status}</Badge>
  return (
    <Badge style={{ background: config.bgColor, color: config.color, border: 'none' }}>
      {config.label}
    </Badge>
  )
}

export default async function RiwayatBookingPage({ searchParams }: Props) {
  const params = await searchParams
  const profile = await getCurrentUser()
  const canViewAll = profile?.role === 'it_admin' || profile?.role === 'admin' || profile?.role === 'sarana'
  const page = Number(params.page ?? 1)

  const { data: bookings, pagination } = await getBookings(
    { status: (params.status as 'menunggu') ?? 'all' },
    page,
    20
  )

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Riwayat Booking</h1>
          <p className="text-muted-foreground text-sm">
            {canViewAll ? 'Semua booking ruangan' : 'Booking ruangan milik Anda'}
          </p>
        </div>
        <Button asChild>
          <Link href="/ruangan/booking"><CalendarPlus className="h-4 w-4 mr-2" />Booking Baru</Link>
        </Button>
      </div>

      {/* Filter status */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'menunggu', 'disetujui', 'ditolak', 'selesai', 'dibatalkan'].map(s => (
          <Button
            key={s}
            variant={params.status === s || (!params.status && s === 'all') ? 'default' : 'outline'}
            size="sm"
            asChild
          >
            <Link href={`/ruangan/riwayat?status=${s}`}>
              {s === 'all' ? 'Semua' : BOOKING_STATUS[s as keyof typeof BOOKING_STATUS]?.label ?? s}
            </Link>
          </Button>
        ))}
      </div>

      {/* Tabel */}
      {bookings.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CalendarPlus className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Belum ada riwayat booking</p>
          <Button asChild className="mt-4"><Link href="/ruangan/booking">Buat Booking Pertama</Link></Button>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b: PeminjamanRuanganWithRelations) => (
            <Card key={b.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{b.ruangan?.nama_ruangan ?? '—'}</h3>
                      <BookingStatusBadge status={b.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(b.tanggal), 'EEEE, d MMMM yyyy', { locale: id })} · {b.jam_mulai.slice(0, 5)}–{b.jam_selesai.slice(0, 5)}
                    </p>
                    <p className="text-sm truncate">{b.keperluan}</p>
                    {canViewAll && (
                      <p className="text-xs text-muted-foreground">Diajukan oleh: {b.user?.full_name}</p>
                    )}
                    {b.catatan_admin && (
                      <p className="text-xs text-muted-foreground mt-1 bg-muted/50 px-2 py-1 rounded">
                        📝 Catatan: {b.catatan_admin}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex-shrink-0">
                    {format(new Date(b.created_at), 'd MMM yyyy', { locale: id })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Halaman {pagination.page} dari {pagination.total_pages} ({pagination.total} total)
          </p>
          <div className="flex gap-2">
            {pagination.page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/ruangan/riwayat?status=${params.status ?? 'all'}&page=${pagination.page - 1}`}>‹ Sebelumnya</Link>
              </Button>
            )}
            {pagination.page < pagination.total_pages && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/ruangan/riwayat?status=${params.status ?? 'all'}&page=${pagination.page + 1}`}>Berikutnya ›</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
