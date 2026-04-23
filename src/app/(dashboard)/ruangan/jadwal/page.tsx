'use client'

// =============================================================================
// app/(dashboard)/ruangan/jadwal/page.tsx
// Kalender jadwal ruangan — FullCalendar
// =============================================================================

import { useEffect, useState, useCallback, useTransition } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { getRuanganList, getJadwalKalenderPublik } from '@/lib/actions/ruangan-actions'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar, MapPin, Clock, Users, FileText } from 'lucide-react'
import type { Ruangan, PeminjamanRuanganWithRelations } from '@/lib/types'
import { BOOKING_CALENDAR_COLOR } from '@/lib/constants'
import Link from 'next/link'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  color: string
  extendedProps: { booking: PeminjamanRuanganWithRelations }
}

export default function JadwalRuanganPage() {
  const [ruanganList, setRuanganList] = useState<Ruangan[]>([])
  const [selectedRuangan, setSelectedRuangan] = useState<string>('')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<PeminjamanRuanganWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [, startTransition] = useTransition()

  // Load daftar ruangan
  useEffect(() => {
    getRuanganList().then((list) => {
      setRuanganList(list)
      if (list.length > 0) setSelectedRuangan(list[0].id)
    })
  }, [])

  // Load events saat ruangan berubah
  const loadEvents = useCallback(async () => {
    if (!selectedRuangan) return
    setIsLoading(true)
    try {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
      const end = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString().split('T')[0]
      const data = await getJadwalKalenderPublik(selectedRuangan, start, end)

      const calEvents: CalendarEvent[] = (data ?? []).map((b) => ({
        id: b.id,
        title: `${b.jam_mulai.slice(0, 5)} ${(b.user as { full_name: string }).full_name} — ${b.keperluan.slice(0, 30)}`,
        start: `${b.tanggal}T${b.jam_mulai}`,
        end: `${b.tanggal}T${b.jam_selesai}`,
        color: BOOKING_CALENDAR_COLOR[b.status as keyof typeof BOOKING_CALENDAR_COLOR],
        extendedProps: { booking: b as PeminjamanRuanganWithRelations },
      }))
      setEvents(calEvents)
    } finally {
      setIsLoading(false)
    }
  }, [selectedRuangan])

  useEffect(() => {
    startTransition(() => {
      void loadEvents()
    })
  }, [loadEvents, startTransition])

  // Auto-refresh setiap 30 detik
  useEffect(() => {
    const interval = setInterval(loadEvents, 30000)
    return () => clearInterval(interval)
  }, [loadEvents])

  const ruangan = ruanganList.find(r => r.id === selectedRuangan)

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Jadwal Ruangan</h1>
          <p className="text-muted-foreground text-sm">Klik event untuk melihat detail booking</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedRuangan} onValueChange={setSelectedRuangan}>
            <SelectTrigger className="w-52" id="pilih-ruangan">
              <SelectValue placeholder="Pilih ruangan..." />
            </SelectTrigger>
            <SelectContent>
              {ruanganList.map(r => (
                <SelectItem key={r.id} value={r.id}>{r.nama_ruangan}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button asChild>
            <Link href="/ruangan/booking">+ Booking</Link>
          </Button>
        </div>
      </div>

      {/* Info ruangan terpilih */}
      {ruangan && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{ruangan.lokasi_gedung}{ruangan.lantai ? ` Lt.${ruangan.lantai}` : ''}</span>
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{ruangan.kapasitas} orang</span>
          {ruangan.fasilitas.slice(0, 3).map(f => <Badge key={f} variant="outline" className="text-xs">{f}</Badge>)}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" />Menunggu Approval</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />Disetujui (Terpakai)</span>
      </div>

      {/* Kalender */}
      <Card>
        <CardContent className="pt-4">
          {isLoading && (
            <div className="text-center text-sm text-muted-foreground py-2">Memuat jadwal...</div>
          )}
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            locale="id"
            firstDay={1}
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            allDaySlot={false}
            events={events}
            eventClick={(info) => {
              setSelectedEvent(info.event.extendedProps.booking as PeminjamanRuanganWithRelations)
            }}
            height="auto"
            nowIndicator
          />
        </CardContent>
      </Card>

      {/* Dialog Detail Booking */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail Booking</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(selectedEvent.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{selectedEvent.jam_mulai.slice(0, 5)} – {selectedEvent.jam_selesai.slice(0, 5)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{(selectedEvent.user as { full_name: string }).full_name}</span>
                {selectedEvent.jumlah_peserta && <span className="text-muted-foreground">({selectedEvent.jumlah_peserta} peserta)</span>}
              </div>
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{selectedEvent.keperluan}</span>
              </div>
              <Badge className={selectedEvent.status === 'disetujui' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                {selectedEvent.status === 'disetujui' ? 'Disetujui' : 'Menunggu Persetujuan'}
              </Badge>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
