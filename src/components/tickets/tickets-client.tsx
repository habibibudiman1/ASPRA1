'use client'

// =============================================================================
// components/tickets/tickets-client.tsx
// Client component untuk list tiket dengan filter dan pagination
// =============================================================================

import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useRef, useEffect } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TicketStatusBadge } from './ticket-status-badge'
import { TicketPriorityBadge } from './ticket-priority-badge'
import { TICKET_STATUS_LIST, TICKET_PRIORITY_LIST } from '@/lib/constants'
import { formatRelativeTime } from '@/lib/utils'
import type { TicketWithRelations, Category, Profile, PaginationState } from '@/lib/types'
import Link from 'next/link'

interface TicketsClientProps {
  tickets: TicketWithRelations[]
  pagination: PaginationState
  categories: Category[]
  profile: Profile
  currentFilters: {
    status: string
    priority: string
    category_id: string
    search: string
  }
}

export function TicketsClient({ tickets, pagination, currentFilters }: TicketsClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current) }, [])

  const updateFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams()
    const filters = { ...currentFilters, [key]: value, page: '1' }
    Object.entries(filters).forEach(([k, v]) => { if (v && v !== 'all' && v !== '') params.set(k, v) })
    router.push(`${pathname}?${params.toString()}`)
  }, [currentFilters, pathname, router])

  const handleSearchChange = useCallback((value: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => updateFilter('search', value), 400)
  }, [updateFilter])

  const hasActiveFilters = currentFilters.status !== 'all' || currentFilters.priority !== 'all' ||
    currentFilters.category_id !== 'all' || currentFilters.search !== ''

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="tickets-search"
            placeholder="Cari tiket atau nomor tiket..."
            className="pl-9"
            defaultValue={currentFilters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={currentFilters.status} onValueChange={(v) => updateFilter('status', v)}>
            <SelectTrigger className="flex-1 min-w-0" id="filter-status">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {TICKET_STATUS_LIST.map((s) => (
                <SelectItem key={s} value={s}><TicketStatusBadge status={s} /></SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={currentFilters.priority} onValueChange={(v) => updateFilter('priority', v)}>
            <SelectTrigger className="flex-1 min-w-0" id="filter-priority">
              <SelectValue placeholder="Semua Prioritas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Prioritas</SelectItem>
              {TICKET_PRIORITY_LIST.map((p) => (
                <SelectItem key={p} value={p}><TicketPriorityBadge priority={p} /></SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="outline" size="icon" onClick={() => router.push(pathname)} id="clear-filters" className="flex-shrink-0">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Ticket Cards */}
      {tickets.length === 0 ? (
        <div className="text-center py-16 border rounded-xl bg-muted/20">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Filter className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg">Tidak ada tiket</h3>
          <p className="text-muted-foreground text-sm mt-1">
            {hasActiveFilters ? 'Tidak ada tiket yang sesuai filter.' : 'Belum ada tiket yang dibuat.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <Link href={`/tickets/${ticket.id}`} key={ticket.id} id={`ticket-${ticket.id}`}>
              <div className="p-3 sm:p-4 border rounded-xl bg-card hover:border-primary/30 hover:shadow-sm active:bg-muted/20 transition-all duration-150 cursor-pointer group">
                <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                  <span className="text-[11px] text-muted-foreground font-mono">{ticket.ticket_number}</span>
                  <TicketStatusBadge status={ticket.status} />
                  <TicketPriorityBadge priority={ticket.priority} />
                  {ticket.category && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ticket.category.color }} />
                      {ticket.category.name}
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2 sm:line-clamp-1">
                  {ticket.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                  <span>{ticket.reporter?.full_name ?? '-'}</span>
                  {ticket.assignee && <span>· {ticket.assignee.full_name}</span>}
                  <span>· {formatRelativeTime(ticket.created_at)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground text-xs">
            {tickets.length} / {pagination.total} tiket
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              disabled={pagination.page <= 1}
              onClick={() => updateFilter('page', String(pagination.page - 1))}
            >
              ‹ Sblm
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {pagination.page}/{pagination.total_pages}
            </span>
            <Button
              variant="outline" size="sm"
              disabled={pagination.page >= pagination.total_pages}
              onClick={() => updateFilter('page', String(pagination.page + 1))}
            >
              Bktn ›
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
