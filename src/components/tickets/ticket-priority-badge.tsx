// =============================================================================
// components/tickets/ticket-priority-badge.tsx
// Badge warna untuk prioritas tiket
// =============================================================================

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TicketPriority } from '@/lib/types'

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; className: string; pulse?: boolean }> = {
  low: {
    label: 'Low',
    className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700',
  },
  medium: {
    label: 'Medium',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  },
  high: {
    label: 'High',
    className: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  },
  critical: {
    label: 'Critical',
    className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    pulse: true,
  },
}

interface TicketPriorityBadgeProps {
  priority: TicketPriority
  className?: string
}

export function TicketPriorityBadge({ priority, className }: TicketPriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority]
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium text-xs',
        config.className,
        config.pulse && 'animate-pulse-critical',
        className
      )}
    >
      {config.label}
    </Badge>
  )
}
