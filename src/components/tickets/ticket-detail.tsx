'use client'

// =============================================================================
// components/tickets/ticket-detail.tsx
// Detail tiket lengkap dengan komentar, activity, dan actions
// =============================================================================

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft, User, Calendar,
  CheckCircle2, Clock, Star, MessageSquare, History,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TicketStatusBadge } from './ticket-status-badge'
import { TicketPriorityBadge } from './ticket-priority-badge'
import { TicketComments } from './ticket-comments'
import { TicketActivity } from './ticket-activity'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { updateTicketStatus, assignTicket, rateTicket } from '@/lib/actions/ticket-actions'
import { formatDate, formatRelativeTime, isSLABreached } from '@/lib/utils'
import { TICKET_STATUS_LIST } from '@/lib/constants'
import type { TicketWithRelations, Profile, TicketStatus } from '@/lib/types'

interface TicketDetailProps {
  ticket: TicketWithRelations
  currentProfile: Profile
  admins: Profile[]
}

export function TicketDetail({ ticket, currentProfile, admins }: TicketDetailProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>(ticket.status)
  const [selectedAssignee, setSelectedAssignee] = useState(ticket.assignee_id ?? '')
  const [rating, setRating] = useState(0)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)

  const isAdmin = currentProfile.role === 'it_admin' || currentProfile.role === 'admin'
  const isReporter = ticket.reporter_id === currentProfile.id
  const canRate = isReporter && ticket.status === 'resolved' && !ticket.rating
  const canReopen = isReporter && (ticket.status === 'resolved' || ticket.status === 'closed')
  const responseBreached = isSLABreached(ticket.sla_response_deadline)
  const resolutionBreached = isSLABreached(ticket.sla_resolution_deadline)

  function handleStatusChange(newStatus: TicketStatus) {
    startTransition(async () => {
      const result = await updateTicketStatus(ticket.id, newStatus)
      if (result.success) {
        toast.success(`Status berhasil diubah ke ${newStatus}`)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleAssign(assigneeId: string) {
    startTransition(async () => {
      const result = await assignTicket(ticket.id, assigneeId === 'unassigned' ? null : assigneeId)
      if (result.success) {
        toast.success('Assignee berhasil diperbarui')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleRate() {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('ticket_id', ticket.id)
      fd.append('rating', String(rating))
      const result = await rateTicket(fd)
      if (result.success) {
        toast.success('Rating berhasil dikirim. Tiket ditutup.')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Button + Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mt-1">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</span>
            <TicketStatusBadge status={ticket.status} />
            <TicketPriorityBadge priority={ticket.priority} />
            {ticket.category && (
              <Badge variant="outline" className="gap-1 text-xs">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: ticket.category.color }} />
                {ticket.category.name}
              </Badge>
            )}
          </div>
          <h2 className="text-xl font-bold leading-tight">{ticket.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Dibuat oleh {ticket.reporter?.full_name} • {formatRelativeTime(ticket.created_at)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kiri: Deskripsi + Komentar — order-2 di mobile (di bawah sidebar), col 1-2 di desktop */}
        <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
          {/* Deskripsi */}
          <Card>
            <CardHeader><CardTitle className="text-base">Deskripsi Masalah</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          {/* Rating Form (Staff, setelah resolved) */}
          {canRate && (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  Berikan Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Masalah Anda telah diselesaikan. Berikan rating untuk menutup tiket ini.
                </p>
                <div className="flex gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRating(r)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${r <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`}
                      />
                    </button>
                  ))}
                </div>
                <Button
                  onClick={handleRate}
                  disabled={rating === 0 || isPending}
                  size="sm"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Konfirmasi & Tutup Tiket
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tabs: Komentar & Aktivitas */}
          <Tabs defaultValue="comments">
            <TabsList>
              <TabsTrigger value="comments" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Komentar ({ticket.comments?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2">
                <History className="h-4 w-4" />
                Aktivitas
              </TabsTrigger>
            </TabsList>
            <TabsContent value="comments" className="mt-4">
              <TicketComments
                ticketId={ticket.id}
                comments={ticket.comments ?? []}
                currentProfile={currentProfile}
              />
            </TabsContent>
            <TabsContent value="activity" className="mt-4">
              <TicketActivity logs={ticket.activity_log ?? []} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Kanan: Info & Actions — order-1 di mobile (muncul pertama), col 3 di desktop */}
        <div className="space-y-4 order-1 lg:order-2">
          {/* Admin Actions */}
          {isAdmin && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Aksi IT Admin</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {/* Status */}
                <div>
                  <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Ubah Status</label>
                  <Select value={selectedStatus} onValueChange={(v) => { setSelectedStatus(v as TicketStatus); handleStatusChange(v as TicketStatus) }} disabled={isPending}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TICKET_STATUS_LIST.map((s) => (
                        <SelectItem key={s} value={s}><TicketStatusBadge status={s} /></SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Assign */}
                <div>
                  <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Assignee</label>
                  <Select
                    value={selectedAssignee || 'unassigned'}
                    onValueChange={(v) => { setSelectedAssignee(v); handleAssign(v) }}
                    disabled={isPending}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Belum di-assign" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">— Belum di-assign —</SelectItem>
                      {admins.filter((a) => a.is_active).map((admin) => (
                        <SelectItem key={admin.id} value={admin.id}>
                          {admin.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Staff Reopen */}
          {canReopen && (
            <Card className="border-destructive/30">
              <CardContent className="pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive border-destructive/50 hover:bg-destructive/10"
                  onClick={() => setShowCloseConfirm(true)}
                  disabled={isPending}
                >
                  Buka Kembali Tiket
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Info Tiket */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Informasi Tiket</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Reporter', icon: User, value: ticket.reporter?.full_name ?? '-' },
                { label: 'Assignee', icon: User, value: ticket.assignee?.full_name ?? 'Belum di-assign' },
                { label: 'Dibuat', icon: Calendar, value: formatDate(ticket.created_at) },
                { label: 'Diperbarui', icon: Clock, value: formatDate(ticket.updated_at) },
              ].map(({ label, icon: Icon, value }) => (
                <div key={label} className="flex items-start gap-2">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-xs font-medium">{value}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* SLA Info */}
          <Card>
            <CardHeader><CardTitle className="text-sm">SLA Status</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Respon</span>
                {ticket.sla_response_met !== null ? (
                  <Badge variant="outline" className={ticket.sla_response_met ? 'text-green-600 border-green-300' : 'text-red-600 border-red-300'}>
                    {ticket.sla_response_met ? '✓ Terpenuhi' : '✗ Terlewati'}
                  </Badge>
                ) : (
                  <span className={responseBreached ? 'text-red-500 font-medium' : 'text-muted-foreground'}>
                    {responseBreached ? 'Terlewati' : 'Menunggu'}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Resolusi</span>
                {ticket.sla_resolution_met !== null ? (
                  <Badge variant="outline" className={ticket.sla_resolution_met ? 'text-green-600 border-green-300' : 'text-red-600 border-red-300'}>
                    {ticket.sla_resolution_met ? '✓ Terpenuhi' : '✗ Terlewati'}
                  </Badge>
                ) : (
                  <span className={resolutionBreached ? 'text-red-500 font-medium' : 'text-muted-foreground'}>
                    {resolutionBreached ? 'Terlewati' : 'Menunggu'}
                  </span>
                )}
              </div>
              {ticket.sla_resolution_deadline && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                <p className="text-xs text-muted-foreground pt-1">
                  Deadline: {formatDate(ticket.sla_resolution_deadline)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Rating yang sudah diberikan */}
          {ticket.rating && (
            <Card className="border-amber-200 dark:border-amber-800">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-1">Rating dari Reporter</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <Star
                      key={r}
                      className={`h-4 w-4 ${r <= ticket.rating! ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`}
                    />
                  ))}
                </div>
                {ticket.rating_comment && (
                  <p className="text-xs text-muted-foreground mt-2 italic">&quot;{ticket.rating_comment}&quot;</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Confirm Reopen Dialog */}
      <ConfirmDialog
        open={showCloseConfirm}
        onOpenChange={setShowCloseConfirm}
        title="Buka Kembali Tiket?"
        description="Tiket akan kembali ke status Reopened dan tim IT akan diberitahu."
        confirmLabel="Ya, Buka Kembali"
        variant="default"
        onConfirm={() => handleStatusChange('reopened')}
      />
    </div>
  )
}
