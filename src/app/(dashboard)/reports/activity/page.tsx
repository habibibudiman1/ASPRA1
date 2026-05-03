// =============================================================================
// app/(dashboard)/reports/activity/page.tsx
// Audit Log — semua aktivitas user di sistem (it_admin & admin)
// =============================================================================

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Activity, User, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/user-actions'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/utils'

export const metadata: Metadata = { title: 'Audit Log | ASPRA' }
export const dynamic = 'force-dynamic'

const ACTION_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  created:           { label: 'Dibuat',            color: '#16a34a', bg: '#dcfce7' },
  status_changed:    { label: 'Status Diubah',      color: '#2563eb', bg: '#dbeafe' },
  assigned:          { label: 'Ditugaskan',         color: '#7c3aed', bg: '#ede9fe' },
  unassigned:        { label: 'Dihapus Tugas',      color: '#6b7280', bg: '#f3f4f6' },
  commented:         { label: 'Komentar',           color: '#0891b2', bg: '#cffafe' },
  rated:             { label: 'Dinilai',            color: '#d97706', bg: '#fef3c7' },
  attachment_added:  { label: 'File Ditambah',      color: '#ea580c', bg: '#ffedd5' },
  attachment_removed:{ label: 'File Dihapus',       color: '#dc2626', bg: '#fee2e2' },
  reopened:          { label: 'Dibuka Kembali',     color: '#dc2626', bg: '#fee2e2' },
}

interface Props {
  searchParams: Promise<{ page?: string; action?: string; user?: string }>
}

export default async function ActivityLogPage({ searchParams }: Props) {
  const profile = await getCurrentUser()
  if (!profile || !['it_admin', 'admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const sp = await searchParams
  const page = Number(sp.page ?? 1)
  const perPage = 30
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const supabase = await createClient()

  let query = supabase
    .from('ticket_activity_log')
    .select(`
      id, action, old_value, new_value, created_at,
      actor:profiles!actor_id(id, full_name, role),
      ticket:tickets!ticket_id(id, ticket_number, title)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (sp.action && sp.action !== 'all') {
    query = query.eq('action', sp.action)
  }
  if (sp.user && sp.user !== 'all') {
    query = query.eq('actor_id', sp.user)
  }

  const { data: logs, count, error } = await query
  if (error) throw new Error(error.message)

  const totalPages = Math.ceil((count ?? 0) / perPage)

  const buildUrl = (overrides: Record<string, string>) => {
    const p = { page: String(page), action: sp.action ?? '', user: sp.user ?? '', ...overrides }
    const qs = Object.entries(p).filter(([, v]) => v && v !== '1' || (p.page !== '1')).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
    return `/reports/activity${qs ? '?' + qs : ''}`
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/reports"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" /> Audit Log
          </h1>
          <p className="text-sm text-muted-foreground">{count ?? 0} aktivitas tercatat</p>
        </div>
      </div>

      {/* Filter Action */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={!sp.action || sp.action === 'all' ? 'default' : 'outline'} asChild>
          <Link href={buildUrl({ action: 'all', page: '1' })}>Semua</Link>
        </Button>
        {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
          <Button key={key} size="sm" variant={sp.action === key ? 'default' : 'outline'} asChild>
            <Link href={buildUrl({ action: key, page: '1' })}>{cfg.label}</Link>
          </Button>
        ))}
      </div>

      {/* Log Entries */}
      {(!logs || logs.length === 0) ? (
        <div className="text-center py-16 text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Tidak ada aktivitas ditemukan</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(logs as unknown as Array<{
            id: string
            action: string
            old_value: string | null
            new_value: string | null
            created_at: string
            actor: { id: string; full_name: string; role: string } | null
            ticket: { id: string; ticket_number: string; title: string } | null
          }>).map((log) => {
            const actionCfg = ACTION_CONFIG[log.action]
            return (
              <div key={log.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/20 transition-colors">
                {/* Icon */}
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: actionCfg?.bg ?? '#f3f4f6' }}>
                  <Activity className="h-4 w-4" style={{ color: actionCfg?.color ?? '#6b7280' }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge style={{ background: actionCfg?.bg, color: actionCfg?.color, border: 'none' }}>
                      {actionCfg?.label ?? log.action}
                    </Badge>
                    {log.ticket && (
                      <Link
                        href={`/tickets/${log.ticket.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {log.ticket.ticket_number}
                      </Link>
                    )}
                    {log.ticket && (
                      <span className="text-sm text-muted-foreground truncate max-w-xs">{log.ticket.title}</span>
                    )}
                  </div>

                  {(log.old_value || log.new_value) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {log.old_value && <span className="line-through mr-1">{log.old_value}</span>}
                      {log.old_value && log.new_value && '→ '}
                      {log.new_value && <span className="font-medium text-foreground">{log.new_value}</span>}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-1.5">
                    {log.actor && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" /> {log.actor.full_name}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatRelativeTime(log.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages} ({count} aktivitas)
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link href={buildUrl({ page: String(page - 1) })}>‹ Sebelumnya</Link>
              </Button>
            )}
            {page < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link href={buildUrl({ page: String(page + 1) })}>Berikutnya ›</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
