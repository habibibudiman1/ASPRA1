'use client'

// =============================================================================
// components/shared/notification-bell.tsx
// Bell notifikasi dengan realtime subscription dan dropdown list
// =============================================================================

import { useState, useEffect, useTransition, useCallback } from 'react'
import Link from 'next/link'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead } from '@/lib/actions/notification-actions'
import type { Notification } from '@/lib/types'

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const loadNotifications = useCallback(async () => {
    const [notifs, count] = await Promise.all([getNotifications(10), getUnreadCount()])
    setNotifications(notifs)
    setUnreadCount(count)
  }, [])

  // Load awal
  useEffect(() => {
    startTransition(() => {
      void loadNotifications()
    })
  }, [loadNotifications, startTransition])

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        void loadNotifications()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadNotifications])

  function handleMarkRead(notifId: string) {
    startTransition(async () => {
      await markNotificationRead(notifId)
      setNotifications((prev) => prev.map((n) => n.id === notifId ? { ...n, is_read: true } : n))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    })
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative" id="notification-bell">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-4 min-w-4 px-1 flex items-center justify-center text-xs p-0 bg-destructive text-white border-0"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notifikasi</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
              disabled={isPending}
            >
              <CheckCheck className="h-3 w-3 mr-1" /> Tandai semua dibaca
            </Button>
          )}
        </div>

        {/* Notification List */}
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              Tidak ada notifikasi
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-4 py-3 hover:bg-muted/50 transition-colors ${!notif.is_read ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      {notif.ticket_id ? (
                        <Link
                          href={`/tickets/${notif.ticket_id}`}
                          className="block"
                          onClick={() => { handleMarkRead(notif.id); setOpen(false) }}
                        >
                          <p className="text-xs font-semibold truncate">{notif.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-xs text-muted-foreground/60 mt-1">{formatRelativeTime(notif.created_at)}</p>
                        </Link>
                      ) : (
                        <>
                          <p className="text-xs font-semibold">{notif.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                          <p className="text-xs text-muted-foreground/60 mt-1">{formatRelativeTime(notif.created_at)}</p>
                        </>
                      )}
                    </div>
                    {!notif.is_read && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors mt-0.5"
                        title="Tandai dibaca"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
