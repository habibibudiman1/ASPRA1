'use client'

// =============================================================================
// app/(dashboard)/ruangan/approval/page.tsx
// Halaman approval booking ruangan — Admin only
// =============================================================================

import { useState, useTransition, useEffect } from 'react'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Clock, Building2 } from 'lucide-react'
import { getPendingBookings, approveBooking, rejectBooking } from '@/lib/actions/booking-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import type { PeminjamanRuanganWithRelations } from '@/lib/types'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function ApprovalBookingPage() {
  const [bookings, setBookings] = useState<PeminjamanRuanganWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null })
  const [catatanReject, setCatatanReject] = useState('')

  const loadBookings = async () => {
    setIsLoading(true)
    try {
      const data = await getPendingBookings()
      setBookings(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    startTransition(() => {
      void loadBookings()
    })
  }, [])

  const handleApprove = (id: string) => {
    startTransition(async () => {
      const result = await approveBooking(id)
      if (result.success) {
        toast.success('Booking disetujui!')
        loadBookings()
      } else {
        toast.error(result.error ?? 'Gagal menyetujui booking')
      }
    })
  }

  const handleReject = () => {
    if (!rejectDialog.id) return
    if (!catatanReject.trim() || catatanReject.length < 5) {
      toast.error('Catatan alasan penolakan minimal 5 karakter')
      return
    }
    startTransition(async () => {
      const result = await rejectBooking(rejectDialog.id!, catatanReject)
      if (result.success) {
        toast.success('Booking ditolak')
        setRejectDialog({ open: false, id: null })
        setCatatanReject('')
        loadBookings()
      } else {
        toast.error(result.error ?? 'Gagal menolak booking')
      }
    })
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Approval Booking Ruangan</h1>
        <p className="text-muted-foreground text-sm">
          {isLoading ? 'Memuat...' : `${bookings.length} booking menunggu persetujuan`}
        </p>
      </div>

      {!isLoading && bookings.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Semua booking sudah ditangani</p>
          <p className="text-sm">Tidak ada booking yang menunggu persetujuan</p>
        </div>
      )}

      <div className="space-y-3">
        {bookings.map((b) => (
          <Card key={b.id} className="border-amber-200 dark:border-amber-800">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">{b.ruangan?.nama_ruangan ?? '—'}</h3>
                    <Badge variant="outline" className="text-xs">
                      {b.ruangan?.lokasi_gedung}{b.ruangan?.lantai ? ` Lt.${b.ruangan.lantai}` : ''}
                    </Badge>
                  </div>
                  <div className="text-sm space-y-0.5">
                    <p>
                      📅 {format(new Date(b.tanggal), 'EEEE, d MMMM yyyy', { locale: id })}
                      &nbsp;·&nbsp;
                      🕐 {b.jam_mulai.slice(0, 5)} – {b.jam_selesai.slice(0, 5)}
                    </p>
                    <p>👤 <strong>{b.user?.full_name}</strong> {b.jumlah_peserta ? `(${b.jumlah_peserta} peserta)` : ''}</p>
                    <p className="text-muted-foreground">{b.keperluan}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Diajukan {format(new Date(b.created_at), 'd MMM yyyy HH:mm', { locale: id })}
                  </p>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(b.id)}
                    disabled={isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />Setujui
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => { setRejectDialog({ open: true, id: b.id }); setCatatanReject('') }}
                    disabled={isPending}
                  >
                    <XCircle className="h-4 w-4 mr-1" />Tolak
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog Reject */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Booking</DialogTitle>
            <DialogDescription>Berikan alasan penolakan booking ini kepada pemohon.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="catatan-reject">Alasan Penolakan *</Label>
            <Textarea
              id="catatan-reject"
              placeholder="Jelaskan alasan penolakan..."
              value={catatanReject}
              onChange={e => setCatatanReject(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, id: null })}>Batal</Button>
            <Button variant="destructive" onClick={handleReject} disabled={isPending}>
              {isPending ? 'Menolak...' : 'Tolak Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
