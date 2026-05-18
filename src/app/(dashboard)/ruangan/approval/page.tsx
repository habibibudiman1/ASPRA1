'use client'

// =============================================================================
// app/(dashboard)/ruangan/approval/page.tsx
// Halaman approval booking ruangan — Sarana only
// Fitur: klik card → popup detail, Setujui/Tolak dari popup maupun card langsung
// =============================================================================

import { useState, useTransition, useEffect } from 'react'
import { toast } from 'sonner'
import {
  CheckCircle, XCircle, Clock, Building2, Users, Calendar,
  MapPin, Wifi, Tv, Wind, Coffee, Info, User, FileText,
} from 'lucide-react'
import { getPendingBookings, approveBooking, rejectBooking } from '@/lib/actions/booking-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import type { PeminjamanRuanganWithRelations } from '@/lib/types'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

// Ikon fasilitas ruangan
const FASILITAS_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-3.5 w-3.5" />,
  ac: <Wind className="h-3.5 w-3.5" />,
  proyektor: <Tv className="h-3.5 w-3.5" />,
  tv: <Tv className="h-3.5 w-3.5" />,
  pantry: <Coffee className="h-3.5 w-3.5" />,
}

function getFasilitasIcon(fasilitas: string) {
  const key = fasilitas.toLowerCase()
  for (const [k, icon] of Object.entries(FASILITAS_ICONS)) {
    if (key.includes(k)) return icon
  }
  return <Info className="h-3.5 w-3.5" />
}

export default function ApprovalBookingPage() {
  const [bookings, setBookings] = useState<PeminjamanRuanganWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // State untuk dialog reject
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null })
  const [catatanReject, setCatatanReject] = useState('')

  // State untuk popup detail
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; booking: PeminjamanRuanganWithRelations | null }>({
    open: false, booking: null,
  })

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
    startTransition(() => { void loadBookings() })
  }, [])

  const handleApprove = (bookingId: string) => {
    startTransition(async () => {
      const result = await approveBooking(bookingId)
      if (result.success) {
        toast.success('Booking disetujui!')
        setDetailDialog({ open: false, booking: null })
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
        setDetailDialog({ open: false, booking: null })
        loadBookings()
      } else {
        toast.error(result.error ?? 'Gagal menolak booking')
      }
    })
  }

  function openDetail(b: PeminjamanRuanganWithRelations) {
    setDetailDialog({ open: true, booking: b })
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
          <Card
            key={b.id}
            className="border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-600 transition-colors cursor-pointer"
            onClick={() => openDetail(b)}
          >
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">{b.ruangan?.nama_ruangan ?? '—'}</h3>
                    <Badge variant="outline" className="text-xs">
                      {b.ruangan?.lokasi_gedung}{b.ruangan?.lantai ? ` Lt.${b.ruangan.lantai}` : ''}
                    </Badge>
                    <Badge variant="secondary" className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-0">
                      Menunggu
                    </Badge>
                  </div>
                  <div className="text-sm space-y-0.5">
                    <p>
                      📅 {format(new Date(b.tanggal), 'EEEE, d MMMM yyyy', { locale: id })}
                      &nbsp;·&nbsp;
                      🕐 {b.jam_mulai.slice(0, 5)} – {b.jam_selesai.slice(0, 5)}
                    </p>
                    <p>👤 <strong>{b.user?.full_name}</strong> {b.jumlah_peserta ? `(${b.jumlah_peserta} peserta)` : ''}</p>
                    <p className="text-muted-foreground line-clamp-1">{b.keperluan}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Diajukan {format(new Date(b.created_at), 'd MMM yyyy HH:mm', { locale: id })}
                  </p>
                </div>

                {/* Tombol aksi langsung di card */}
                <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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

      {/* =========================================================
          Dialog: Detail Booking Ruangan
      ========================================================= */}
      <Dialog open={detailDialog.open} onOpenChange={(open) => setDetailDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-amber-500" />
              Detail Peminjaman Ruangan
            </DialogTitle>
            <DialogDescription>
              Tinjau detail peminjaman sebelum menyetujui atau menolak
            </DialogDescription>
          </DialogHeader>

          {detailDialog.booking && (
            <div className="space-y-4 py-1">
              {/* Info Ruangan */}
              <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Ruangan
                </h4>
                <div className="space-y-1.5 text-sm">
                  <p className="font-medium text-base">{detailDialog.booking.ruangan?.nama_ruangan ?? '—'}</p>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>
                      {detailDialog.booking.ruangan?.lokasi_gedung}
                      {detailDialog.booking.ruangan?.lantai ? `, Lantai ${detailDialog.booking.ruangan.lantai}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>Kapasitas {detailDialog.booking.ruangan?.kapasitas ?? '—'} orang</span>
                  </div>
                  {detailDialog.booking.ruangan?.fasilitas && detailDialog.booking.ruangan.fasilitas.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {detailDialog.booking.ruangan.fasilitas.map((f) => (
                        <Badge key={f} variant="outline" className="text-xs gap-1 py-0.5">
                          {getFasilitasIcon(f)}
                          {f}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {detailDialog.booking.ruangan?.keterangan && (
                    <p className="text-xs text-muted-foreground italic mt-1">{detailDialog.booking.ruangan.keterangan}</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Info Waktu */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {format(new Date(detailDialog.booking.tanggal), 'EEEE, d MMMM yyyy', { locale: id })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {detailDialog.booking.jam_mulai.slice(0, 5)} – {detailDialog.booking.jam_selesai.slice(0, 5)}
                    <span className="text-muted-foreground ml-2 text-xs">
                      ({(() => {
                        const [sh, sm] = detailDialog.booking.jam_mulai.split(':').map(Number)
                        const [eh, em] = detailDialog.booking.jam_selesai.split(':').map(Number)
                        const dur = (eh * 60 + em) - (sh * 60 + sm)
                        return `${Math.floor(dur / 60)}j ${dur % 60 > 0 ? `${dur % 60}m` : ''}`.trim()
                      })()})
                    </span>
                  </span>
                </div>
              </div>

              <Separator />

              {/* Info Pemohon */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span><strong>{detailDialog.booking.user?.full_name}</strong></span>
                  {detailDialog.booking.user?.department && (
                    <Badge variant="outline" className="text-xs">{detailDialog.booking.user.department}</Badge>
                  )}
                </div>
                {detailDialog.booking.jumlah_peserta && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{detailDialog.booking.jumlah_peserta} peserta</span>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Keperluan</p>
                    <p>{detailDialog.booking.keperluan}</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Diajukan {format(new Date(detailDialog.booking.created_at), 'd MMMM yyyy, HH:mm', { locale: id })}
              </p>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setDetailDialog({ open: false, booking: null })}
            >
              Tutup
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (detailDialog.booking) {
                  setRejectDialog({ open: true, id: detailDialog.booking.id })
                  setCatatanReject('')
                }
                setDetailDialog({ open: false, booking: null })
              }}
              disabled={isPending}
            >
              <XCircle className="h-4 w-4 mr-1" /> Tolak
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => detailDialog.booking && handleApprove(detailDialog.booking.id)}
              disabled={isPending}
            >
              <CheckCircle className="h-4 w-4 mr-1" /> Setujui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================
          Dialog: Alasan Penolakan
      ========================================================= */}
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
