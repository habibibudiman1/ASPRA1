'use client'

// =============================================================================
// components/reports/reports-client.tsx
// Laporan dan export CSV
// =============================================================================

import { useState } from 'react'
import { Download, FileText, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TicketStatusBadge } from '@/components/tickets/ticket-status-badge'
import { TicketPriorityBadge } from '@/components/tickets/ticket-priority-badge'
import { formatDate, generateCSV, downloadCSV } from '@/lib/utils'
import { TICKET_STATUS_LIST, TICKET_PRIORITY_LIST } from '@/lib/constants'
import type { TicketStatus, TicketPriority } from '@/lib/types'

type ReportTicket = {
  id: string
  ticket_number: string
  title: string
  status: TicketStatus
  priority: TicketPriority
  created_at: string
  resolved_at: string | null
  sla_response_met: boolean | null
  sla_resolution_met: boolean | null
  rating: number | null
  reporter: { full_name: string; department: string | null } | null
  assignee: { full_name: string } | null
  category: { name: string } | null
}

interface ReportsClientProps { tickets: ReportTicket[] }

export function ReportsClient({ tickets }: ReportsClientProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [search, setSearch] = useState('')

  const filtered = tickets.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false
    if (search && !t.title?.toLowerCase().includes(search.toLowerCase()) && !t.ticket_number?.includes(search)) return false
    return true
  })

  function handleExportCSV() {
    const headers = {
      ticket_number: 'No. Tiket',
      title: 'Judul',
      status: 'Status',
      priority: 'Prioritas',
      reporter_name: 'Reporter',
      department: 'Departemen',
      assignee_name: 'Assignee',
      category_name: 'Kategori',
      sla_response_met: 'SLA Respon',
      sla_resolution_met: 'SLA Resolusi',
      rating: 'Rating',
      created_at: 'Dibuat',
      resolved_at: 'Diselesaikan',
    }
    const data = filtered.map(t => ({
      ticket_number: t.ticket_number,
      title: t.title,
      status: t.status,
      priority: t.priority,
      reporter_name: t.reporter?.full_name ?? '-',
      department: t.reporter?.department ?? '-',
      assignee_name: t.assignee?.full_name ?? '-',
      category_name: t.category?.name ?? '-',
      sla_response_met: t.sla_response_met === null ? 'N/A' : t.sla_response_met ? 'Ya' : 'Tidak',
      sla_resolution_met: t.sla_resolution_met === null ? 'N/A' : t.sla_resolution_met ? 'Ya' : 'Tidak',
      rating: t.rating?.toString() ?? '-',
      created_at: formatDate(t.created_at),
      resolved_at: t.resolved_at ? formatDate(t.resolved_at) : '-',
    }))
    const csv = generateCSV(data, headers)
    downloadCSV(csv, `laporan-tiket-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Laporan Tiket</h2>
          <p className="text-muted-foreground text-sm mt-1">{filtered.length} tiket ditemukan</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" id="btn-export-csv" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" id="btn-print" onClick={() => window.print()}>
            <FileText className="mr-2 h-4 w-4" /> Cetak
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Cari tiket..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {TICKET_STATUS_LIST.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Prioritas</SelectItem>
            {TICKET_PRIORITY_LIST.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Ticket Table */}
      <div className="border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                {['No. Tiket', 'Judul', 'Status', 'Prioritas', 'Reporter', 'Assignee', 'SLA', 'Rating', 'Dibuat'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{t.ticket_number}</td>
                  <td className="px-4 py-3 max-w-48 truncate">{t.title}</td>
                  <td className="px-4 py-3"><TicketStatusBadge status={t.status as TicketStatus} /></td>
                  <td className="px-4 py-3"><TicketPriorityBadge priority={t.priority as TicketPriority} /></td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">{t.reporter?.full_name ?? '-'}</td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">{t.assignee?.full_name ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${t.sla_resolution_met === true ? 'text-green-600' : t.sla_resolution_met === false ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {t.sla_resolution_met === null ? 'N/A' : t.sla_resolution_met ? '✓' : '✗'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">{t.rating ? `${'⭐'.repeat(t.rating)}` : '-'}</td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground">{formatDate(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <Filter className="h-8 w-8 mx-auto mb-2 opacity-30" />
              Tidak ada data yang sesuai filter
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
