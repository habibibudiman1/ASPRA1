'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar, Plus, XCircle, CheckCircle, Clock, Building2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatDate } from '@/lib/utils'
import { createRoomBooking, cancelRoomBooking } from '@/lib/actions/room-actions'
import type { RoomBooking, Room, Profile } from '@/lib/types'

interface Props {
  bookings: RoomBooking[]
  rooms: Room[]
  profile: Profile
}

export function BookingClient({ bookings, rooms, profile }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [showCreate, setShowCreate] = useState(false)
  const [cancelModal, setCancelModal] = useState<RoomBooking | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const [form, setForm] = useState({
    room_id: '',
    title: '',
    description: '',
    start_time: '',
    end_time: '',
  })

  const activeBookings = bookings.filter(b => b.status === 'confirmed')
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled')

  async function handleCreate() {
    if (!form.room_id || !form.title || !form.start_time || !form.end_time) {
      toast.error('Lengkapi semua field yang wajib diisi')
      return
    }

    if (new Date(form.end_time) <= new Date(form.start_time)) {
      toast.error('Waktu selesai harus lebih dari waktu mulai')
      return
    }

    const result = await createRoomBooking({
      room_id: form.room_id,
      title: form.title,
      description: form.description || undefined,
      start_time: form.start_time,
      end_time: form.end_time,
    })

    if (result.success) {
      toast.success('Booking berhasil dibuat')
      setShowCreate(false)
      setForm({ room_id: '', title: '', description: '', start_time: '', end_time: '' })
      startTransition(() => router.refresh())
    } else {
      toast.error(result.error)
    }
  }

  async function handleCancel() {
    if (!cancelModal) return

    const result = await cancelRoomBooking(cancelModal.id, cancelReason)
    if (result.success) {
      toast.success('Booking berhasil dibatalkan')
      setCancelModal(null)
      setCancelReason('')
      startTransition(() => router.refresh())
    } else {
      toast.error(result.error)
    }
  }

  const isAdmin = profile.role === 'it_admin'

  function canCancel(booking: RoomBooking) {
    if (booking.status !== 'confirmed') return false
    return isAdmin || booking.booked_by === profile.id
  }

  function BookingCard({ booking }: { booking: RoomBooking }) {
    const start = new Date(booking.start_time)
    const end = new Date(booking.end_time)
    const isPast = end < new Date()

    return (
      <div className="border rounded-lg p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{booking.title}</span>
              <Badge variant={booking.status === 'cancelled' ? 'secondary' : isPast ? 'outline' : 'default'}>
                {booking.status === 'cancelled' ? 'Dibatalkan' : isPast ? 'Selesai' : 'Aktif'}
              </Badge>
            </div>

            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {booking.room?.name} ({booking.room?.code})
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(booking.start_time)} — {formatDate(booking.end_time)}
              </span>
            </div>

            {isAdmin && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Dipesan oleh: {booking.booker?.full_name}
                {booking.booker?.department && ` (${booking.booker.department})`}
              </p>
            )}

            {booking.description && (
              <p className="text-xs text-muted-foreground mt-1">{booking.description}</p>
            )}

            {booking.status === 'cancelled' && booking.cancel_reason && (
              <p className="text-xs text-muted-foreground mt-1">
                Alasan: {booking.cancel_reason}
              </p>
            )}
          </div>

          {canCancel(booking) && (
            <Button
              variant="outline" size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/10 shrink-0"
              onClick={() => { setCancelModal(booking); setCancelReason('') }}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Batalkan
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Booking Ruangan</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {activeBookings.length} booking aktif
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Buat Booking
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            <CheckCircle className="h-4 w-4 mr-2" />
            Aktif ({activeBookings.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            <XCircle className="h-4 w-4 mr-2" />
            Dibatalkan ({cancelledBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3 mt-4">
          {activeBookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Tidak ada booking aktif</p>
            </div>
          ) : (
            activeBookings.map(b => <BookingCard key={b.id} booking={b} />)
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-3 mt-4">
          {cancelledBookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg">
              <XCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Tidak ada booking yang dibatalkan</p>
            </div>
          ) : (
            cancelledBookings.map(b => <BookingCard key={b.id} booking={b} />)
          )}
        </TabsContent>
      </Tabs>

      {/* Modal: Buat Booking */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Booking Ruangan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Ruangan *</label>
              <Select value={form.room_id} onValueChange={v => setForm(f => ({ ...f, room_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Pilih ruangan" /></SelectTrigger>
                <SelectContent>
                  {rooms.filter(r => r.is_active).map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name} ({r.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Keperluan *</label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Rapat bulanan, Kelas pengganti"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Keterangan</label>
              <Input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Opsional"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Mulai *</label>
                <Input
                  type="datetime-local"
                  value={form.start_time}
                  onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Selesai *</label>
                <Input
                  type="datetime-local"
                  value={form.end_time}
                  onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Batal</Button>
            <Button onClick={handleCreate}>Buat Booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Cancel Booking */}
      <Dialog open={!!cancelModal} onOpenChange={() => setCancelModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batalkan Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Yakin ingin membatalkan booking <strong>{cancelModal?.title}</strong>?
            </p>
            <div>
              <label className="text-sm font-medium">Alasan Pembatalan</label>
              <Input
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Opsional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelModal(null)}>Kembali</Button>
            <Button variant="destructive" onClick={handleCancel}>
              <XCircle className="h-4 w-4 mr-2" />
              Batalkan Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
