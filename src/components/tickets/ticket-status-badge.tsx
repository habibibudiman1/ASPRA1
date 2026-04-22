// =============================================================================
// components/tickets/ticket-status-badge.tsx
// Badge warna untuk status tiket
// =============================================================================

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TicketStatus } from '@/lib/types'

const STATUS_CONFIG: Record<TicketStatus, { label: string; className: string; pulse?: boolean }> = {
  open: {
    label: 'Open',
    className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  },
  resolved: {
    label: 'Resolved',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  },
  closed: {
    label: 'Closed',
    className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700',
  },
  reopened: {
    label: 'Reopened',
    className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  },
}

interface TicketStatusBadgeProps {
  status: TicketStatus
  className?: string
}

export function TicketStatusBadge({ status, className }: TicketStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge
      variant="outline"
      className={cn('font-medium text-xs', config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
