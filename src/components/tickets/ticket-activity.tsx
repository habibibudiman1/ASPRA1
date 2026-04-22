// =============================================================================
// components/tickets/ticket-activity.tsx
// Timeline aktivitas tiket dari activity log
// =============================================================================

import { formatRelativeTime } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import type { TicketActivityLog, Profile } from '@/lib/types'

const ACTION_LABELS: Record<string, (log: TicketActivityLog) => string> = {
  created: () => 'membuat tiket ini',
  status_changed: (log) => `mengubah status dari "${log.old_value}" ke "${log.new_value}"`,
  assigned: (log) => log.new_value ? `meng-assign tiket ke ${log.new_value}` : 'menghapus assignee',
  commented: () => 'menambahkan komentar',
  rated: (log) => `memberikan rating ${log.new_value} bintang`,
  attachment_added: () => 'menambahkan lampiran',
  reopened: () => 'membuka kembali tiket',
}

interface TicketActivityProps {
  logs: TicketActivityLog[]
}

export function TicketActivity({ logs }: TicketActivityProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground border rounded-xl bg-muted/20">
        Belum ada aktivitas tercatat.
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {logs.map((log, index) => {
        const actor = log.actor as Profile | undefined
        const label = ACTION_LABELS[log.action]?.(log) ?? log.action
        const isLast = index === logs.length - 1

        return (
          <div key={log.id} className="flex gap-3 relative">
            {/* Garis timeline */}
            {!isLast && (
              <div className="absolute left-4 top-8 w-px h-full -bottom-0 bg-border" />
            )}

            <div className="flex-shrink-0 z-10">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                  {getInitials(actor?.full_name ?? 'S')}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 pb-4">
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="text-xs font-semibold">{actor?.full_name ?? 'Sistem'}</span>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                {formatRelativeTime(log.created_at)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
