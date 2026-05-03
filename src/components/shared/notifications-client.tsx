'use client'

// =============================================================================
// components/shared/notifications-client.tsx
// Client actions untuk halaman notifikasi (mark-as-read)
// =============================================================================

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { markNotificationRead, markAllNotificationsRead } from '@/lib/actions/notification-actions'

interface Props {
  action: 'mark-one' | 'mark-all'
  notifId?: string
  label?: string
}

export function NotificationsClient({ action, notifId, label }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      if (action === 'mark-all') {
        await markAllNotificationsRead()
      } else if (action === 'mark-one' && notifId) {
        await markNotificationRead(notifId)
      }
      router.refresh()
    })
  }

  if (action === 'mark-all') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isPending}
        className="text-xs"
      >
        <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
        {label ?? 'Tandai semua dibaca'}
      </Button>
    )
  }

  return (
    <button
      onClick={(e) => { e.preventDefault(); handleClick() }}
      disabled={isPending}
      className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors text-xs font-medium"
      title="Tandai dibaca"
    >
      <Check className="h-3.5 w-3.5" />
    </button>
  )
}
