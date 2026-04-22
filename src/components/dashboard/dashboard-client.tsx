'use client'

// =============================================================================
// components/dashboard/dashboard-client.tsx
// Client component untuk dashboard analytics dengan charts (Premium Redesign)
// =============================================================================

import { TrendingUp, Ticket, Clock, CheckCircle, BarChart3, AlertCircle, ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TicketStatusBadge } from '@/components/tickets/ticket-status-badge'
import { TicketPriorityBadge } from '@/components/tickets/ticket-priority-badge'
import { formatRelativeTime, cn } from '@/lib/utils'
import Link from 'next/link'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts'
import type { TicketStatus, TicketPriority } from '@/lib/types'

interface DashboardClientProps {
  stats: {
    total: number
    byStatus: Record<string, number>
    avgResolutionHours: number
    slaResponseCompliance: number
    slaResolutionCompliance: number
  }
  recentTickets: any[]
}

const STATUS_COLORS: Record<string, string> = {
  open: '#10b981', // emerald-500
  in_progress: '#f59e0b', // amber-500
  resolved: '#14b8a6', // teal-500
  closed: '#71717a', // zinc-500
  reopened: '#ef4444', // red-500
}

export function DashboardClient({ stats, recentTickets }: DashboardClientProps) {
  const pieData = Object.entries(stats.byStatus)
    .filter(([, v]) => v > 0)
    .map(([status, count]) => ({
      name: status.replace('_', ' '),
      value: count,
      color: STATUS_COLORS[status],
    }))

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1 border-l-4 border-primary pl-4">
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Dashboard Analytics
          </h2>
          <p className="text-muted-foreground text-sm font-medium">
            Overview performa sistem dan penyelesaian tiket harian.
          </p>
        </div>
      </div>

      {/* Stats Cards - Glassmorphism Bento Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 relative group">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 blur-[120px] -z-10 rounded-[3rem] pointer-events-none transition-opacity duration-1000 opacity-50 group-hover:opacity-100" />
        
        {[
          { label: 'Total Tiket', value: stats.total, icon: Ticket, color: 'text-indigo-500 dark:text-indigo-400', bgIcon: 'bg-indigo-500/10 dark:bg-indigo-400/10', dropShadow: 'shadow-indigo-500/10' },
          { label: 'Tiket Open', value: stats.byStatus.open + stats.byStatus.reopened, icon: AlertCircle, color: 'text-emerald-500 dark:text-emerald-400', bgIcon: 'bg-emerald-500/10 dark:bg-emerald-400/10', dropShadow: 'shadow-emerald-500/10' },
          { label: 'In Progress', value: stats.byStatus.in_progress, icon: Clock, color: 'text-amber-500 dark:text-amber-400', bgIcon: 'bg-amber-500/10 dark:bg-amber-400/10', dropShadow: 'shadow-amber-500/10' },
          { label: 'Avg Resolusi', value: `${stats.avgResolutionHours}j`, icon: TrendingUp, color: 'text-cyan-500 dark:text-cyan-400', bgIcon: 'bg-cyan-500/10 dark:bg-cyan-400/10', dropShadow: 'shadow-cyan-500/10' },
        ].map(({ label, value, icon: Icon, color, bgIcon, dropShadow }) => (
          <Card 
            key={label} 
            className={cn(
              "overflow-hidden relative bg-card/60 backdrop-blur-xl border-foreground/5 dark:border-white/5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl dark:hover:border-white/10 dark:hover:bg-card/80", 
              dropShadow
            )}
          >
            {/* Glossy top edge */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{label}</p>
                  <p className="text-4xl font-black tracking-tighter">{value}</p>
                </div>
                <div className={cn("p-4 rounded-2xl transition-colors duration-300", bgIcon)}>
                  <Icon className={cn("h-7 w-7", color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Pie Chart: Status - takes 5 cols */}
        <Card className="xl:col-span-5 bg-card/40 backdrop-blur-sm border-foreground/5 dark:border-white/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Distribusi Status
            </CardTitle>
            <CardDescription>Rasio tiket berdasarkan status terkini</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.total === 0 ? (
              <div className="h-[240px] flex flex-col items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border/50 rounded-xl m-4">
                <Ticket className="h-8 w-8 mb-2 opacity-20" />
                Belum ada data
              </div>
            ) : (
              <div className="flex flex-col h-full justify-between">
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={pieData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={65} 
                        outerRadius={90} 
                        paddingAngle={5} 
                        dataKey="value"
                        stroke="none"
                        cornerRadius={4}
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={`cell-${i}`} fill={entry.color} style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(v, name) => [v, String(name ?? '').replace(/_/g, ' ')]} 
                        contentStyle={{ borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', background: 'hsl(var(--card))', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom Legend */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 mt-2 px-2">
                  {Object.entries(stats.byStatus).filter(([, count]) => count > 0).map(([status, count]) => (
                    <div key={status} className="flex items-center gap-2.5 text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <span className="w-3 h-3 rounded-full shadow-inner" style={{ background: STATUS_COLORS[status] }} />
                      <span className="text-muted-foreground font-medium capitalize flex-1">{status.replace('_', ' ')}</span>
                      <span className="font-bold bg-background px-2 py-0.5 rounded-md shadow-sm border border-border/50">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SLA Compliance - takes 7 cols */}
        <Card className="xl:col-span-7 bg-card/40 backdrop-blur-sm border-foreground/5 dark:border-white/5 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-[80px] -z-10 transform translate-x-1/2 -translate-y-1/2" />
          <CardHeader className="pb-6">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" /> SLA Compliance
            </CardTitle>
            <CardDescription>Persentase pemenuhan Service Level Agreement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Progress Bars */}
            <div className="space-y-6">
              <div className="group">
                <div className="flex justify-between text-sm mb-3">
                  <span className="font-semibold text-foreground/80">Kecepatan Respon Pertama</span>
                  <span className={cn(
                    "font-bold px-2.5 py-0.5 rounded-full text-xs",
                    stats.slaResponseCompliance >= 80 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                  )}>
                    {stats.slaResponseCompliance}%
                  </span>
                </div>
                <div className="relative h-4 rounded-full bg-muted overflow-hidden inner-shadow">
                  <div 
                    className={cn(
                      "absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out",
                      stats.slaResponseCompliance >= 80 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-red-500 to-red-400'
                    )}
                    style={{ width: `${stats.slaResponseCompliance}%` }}
                  />
                </div>
              </div>
              
              <div className="group">
                <div className="flex justify-between text-sm mb-3">
                  <span className="font-semibold text-foreground/80">Waktu Resolusi</span>
                  <span className={cn(
                    "font-bold px-2.5 py-0.5 rounded-full text-xs",
                    stats.slaResolutionCompliance >= 80 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                  )}>
                    {stats.slaResolutionCompliance}%
                  </span>
                </div>
                <div className="relative h-4 rounded-full bg-muted overflow-hidden inner-shadow">
                  <div 
                    className={cn(
                      "absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out",
                      stats.slaResolutionCompliance >= 80 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-red-500 to-red-400'
                    )}
                    style={{ width: `${stats.slaResolutionCompliance}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="pt-6 border-t border-border/50">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Selesai (Resolved)', value: stats.byStatus.resolved + stats.byStatus.closed, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10' },
                  { label: 'Dikerjakan (In Progress)', value: stats.byStatus.in_progress, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
                  { label: 'Dikembalikan (Reopened)', value: stats.byStatus.reopened, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className={cn("text-center p-4 rounded-xl border border-transparent transition-all hover:bg-muted/50 hover:border-border/50")}>
                     <div className={cn("w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center", bg)}>
                        <p className={cn("text-xl font-black", color)}>{value}</p>
                     </div>
                    <p className="text-xs font-medium text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabel Tiket Terbaru */}
      <Card className="bg-card/40 backdrop-blur-sm border-foreground/5 dark:border-white/5 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-border/30 pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold">Tiket Terbaru</CardTitle>
              <CardDescription>Daftar 10 tiket yang masuk terakhir</CardDescription>
            </div>
            <Link 
              href="/tickets" 
              className="group flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-4 py-2 rounded-full"
            >
              Lihat Semua
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recentTickets.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-muted-foreground">
               <Ticket className="h-10 w-10 mb-3 opacity-20" />
               <p className="font-medium text-sm">Belum ada tiket yang masuk</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {recentTickets.map((ticket) => (
                <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="block group">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:px-6 hover:bg-muted/40 transition-colors">
                    {/* Number & Status */}
                    <div className="flex flex-row sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-2 sm:w-32 flex-shrink-0">
                       <span className="text-xs font-mono font-semibold bg-background border border-border/60 px-2 py-1 rounded inline-block">
                        {ticket.ticket_number}
                       </span>
                       <div className="hidden sm:block">
                         <TicketStatusBadge status={ticket.status as TicketStatus} />
                       </div>
                    </div>
                    
                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex sm:hidden items-center gap-2 mb-2">
                        <TicketStatusBadge status={ticket.status as TicketStatus} />
                        <TicketPriorityBadge priority={ticket.priority as TicketPriority} />
                      </div>
                      <p className="text-sm font-bold truncate group-hover:text-primary transition-colors pr-4">
                        {ticket.title}
                      </p>
                      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold text-foreground/40">
                            {ticket.reporter?.full_name?.charAt(0) || '?'}
                          </span>
                          {ticket.reporter?.full_name}
                        </span>
                        <span className="opacity-50">•</span>
                        <span>{formatRelativeTime(ticket.created_at)}</span>
                      </div>
                    </div>

                    {/* Right side (Priority & Assignee) */}
                    <div className="hidden sm:flex flex-col items-end gap-2 flex-shrink-0 sm:w-auto">
                      <TicketPriorityBadge priority={ticket.priority as TicketPriority} />
                      {ticket.assignee ? (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2 py-1 rounded-md border border-border/30">
                          <span className="text-[10px]">📌</span>
                          <span className="font-medium truncate max-w-[120px]">{ticket.assignee.full_name}</span>
                        </div>
                      ) : (
                         <span className="text-xs text-muted-foreground/50 italic px-2 py-1">Belum di-assign</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

