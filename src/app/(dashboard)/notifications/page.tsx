// =============================================================================
// app/(dashboard)/notifications/page.tsx
// Halaman pusat notifikasi — semua riwayat dengan mark as read
// =============================================================================

import type { Metadata } from 'next'
import Link from 'next/link'
import { Bell, Ticket, Building2, Package, Settings } from 'lucide-react'
import { getNotifications } from '@/lib/actions/notification-actions'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils'
import { NotificationsClient } from '@/components/shared/notifications-client'
import type { Notification } from '@/lib/types'

export const metadata: Metadata = { title: 'Notifikasi | ASPRA' }
export const dynamic = 'force-dynamic'

function getNotifIcon(tipe?: string) {
  switch (tipe) {
    case 'tiket':             return Ticket
    case 'booking_ruangan':   return Building2
    case 'peminjaman_barang': return Package
    default:                  return Settings
  }
}

export default async function NotificationsPage() {
  // Ambil 100 notifikasi terbaru (cukup untuk halaman full list)
  const notifications = await getNotifications(100)
  const unread = notifications.filter(n => !n.is_read)

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Bell className="h-5 w-5 sm:h-6 sm:w-6" /> Notifikasi
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {unread.length > 0 ? `${unread.length} belum dibaca` : 'Semua sudah dibaca'}
          </p>
        </div>
        {unread.length > 0 && (
          <NotificationsClient action="mark-all" label="Tandai semua dibaca" />
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Tidak ada notifikasi</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = getNotifIcon(notif.tipe)
            return (
              <NotificationItem key={notif.id} notif={notif} Icon={Icon} />
            )
          })}
        </div>
      )}
    </div>
  )
}

function NotificationItem({ notif, Icon }: { notif: Notification; Icon: React.ElementType }) {
  const href = notif.ticket_id
    ? `/tickets/${notif.ticket_id}`
    : notif.reference_id
      ? `#`
      : undefined

  const inner = (
    <div
      className={`flex items-start gap-3 p-3 sm:p-4 rounded-lg border transition-colors hover:bg-muted/30 active:bg-muted/30 ${
        !notif.is_read ? 'bg-primary/5 border-primary/20' : 'bg-card'
      }`}
    >
      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
        !notif.is_read ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
      }`}>
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-sm font-semibold leading-snug ${!notif.is_read ? '' : 'text-muted-foreground'}`}>
                {notif.title}
              </p>
              {!notif.is_read && (
                <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 h-4">Baru</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">{formatRelativeTime(notif.created_at)}</p>
          </div>
          {!notif.is_read && (
            <div className="shrink-0">
              <NotificationsClient action="mark-one" notifId={notif.id} label="✓" />
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href} className="block">{inner}</Link>
  }
  return <div>{inner}</div>
}
