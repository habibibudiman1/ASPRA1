'use client'

// =============================================================================
// app/(dashboard)/ruangan/jadwal/page.tsx
// Kalender jadwal ruangan — FullCalendar (Premium UI)
// =============================================================================

import { useEffect, useState, useCallback, useTransition, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { getAllRuanganForSchedule, getJadwalKalenderPublik } from '@/lib/actions/ruangan-actions'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  CalendarDays, MapPin, Clock, Users, FileText, Building2,
  CalendarPlus, Wifi, Monitor, Tv, Printer, Wind, Megaphone,
  Presentation, PenLine, Loader2, Info,
} from 'lucide-react'
import type { Ruangan, PeminjamanRuanganWithRelations } from '@/lib/types'
import { BOOKING_STATUS } from '@/lib/constants'
import Link from 'next/link'
import { ExportPDFJadwal } from '@/components/ruangan/export-pdf-jadwal'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  color: string
  textColor: string
  borderColor: string
  extendedProps: { booking: PeminjamanRuanganWithRelations }
}

// Ikon fasilitas
const FACILITY_ICON: Record<string, React.ReactNode> = {
  proyektor: <Presentation className="h-3 w-3" />,
  AC: <Wind className="h-3 w-3" />,
  whiteboard: <PenLine className="h-3 w-3" />,
  sound_system: <Megaphone className="h-3 w-3" />,
  wifi: <Wifi className="h-3 w-3" />,
  komputer: <Monitor className="h-3 w-3" />,
  tv: <Tv className="h-3 w-3" />,
  printer: <Printer className="h-3 w-3" />,
}

// Warna event yang lebih modern
const EVENT_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  menunggu:   { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
  disetujui:  { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
  ditolak:    { bg: '#f3f4f6', text: '#6b7280', border: '#9ca3af' },
  selesai:    { bg: '#f3f4f6', text: '#4b5563', border: '#6b7280' },
  dibatalkan: { bg: '#f9fafb', text: '#9ca3af', border: '#d1d5db' },
}

export default function JadwalRuanganPage() {
  const [ruanganList, setRuanganList] = useState<Ruangan[]>([])
  const [selectedRuangan, setSelectedRuangan] = useState<string>('')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<PeminjamanRuanganWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitLoading, setIsInitLoading] = useState(true)
  const [, startTransition] = useTransition()

  // Load daftar semua ruangan aktif (termasuk maintenance)
  useEffect(() => {
    getAllRuanganForSchedule().then((list) => {
      setRuanganList(list)
      if (list.length > 0) setSelectedRuangan(list[0].id)
      setIsInitLoading(false)
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

      const calEvents: CalendarEvent[] = (data ?? []).map((b) => {
        const style = EVENT_STYLES[b.status] ?? EVENT_STYLES.menunggu
        return {
          id: b.id,
          title: `${b.jam_mulai.slice(0, 5)} ${(b.user as { full_name: string }).full_name} — ${b.keperluan.slice(0, 30)}`,
          start: `${b.tanggal}T${b.jam_mulai}`,
          end: `${b.tanggal}T${b.jam_selesai}`,
          color: style.bg,
          textColor: style.text,
          borderColor: style.border,
          extendedProps: { booking: b as PeminjamanRuanganWithRelations },
        }
      })
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
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') void loadEvents()
    }, 30000)
    return () => clearInterval(interval)
  }, [loadEvents])

  const ruangan = useMemo(
    () => ruanganList.find(r => r.id === selectedRuangan),
    [ruanganList, selectedRuangan]
  )

  const statusColor = ruangan
    ? ruangan.status === 'tersedia' ? 'bg-emerald-500' : ruangan.status === 'maintenance' ? 'bg-amber-500' : 'bg-gray-400'
    : ''

  if (isInitLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Memuat data ruangan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* ===== HEADER ===== */}
      <div className="rounded-xl border bg-gradient-to-br from-card via-card to-accent/30 p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Jadwal Ruangan</h1>
              <p className="text-muted-foreground text-sm">
                Kalender booking & pemakaian ruangan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Select value={selectedRuangan} onValueChange={setSelectedRuangan}>
              <SelectTrigger className="w-56 bg-background/80 backdrop-blur-sm" id="pilih-ruangan">
                <SelectValue placeholder="Pilih ruangan..." />
              </SelectTrigger>
              <SelectContent>
                {ruanganList.map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        r.status === 'tersedia'    ? 'bg-emerald-500' :
                        r.status === 'maintenance' ? 'bg-amber-500' : 'bg-gray-400'
                      }`} />
                      <span>{r.nama_ruangan}</span>
                      {r.status !== 'tersedia' && (
                        <span className="text-xs text-muted-foreground">
                          ({r.status === 'maintenance' ? 'Maintenance' : 'Tidak Aktif'})
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ExportPDFJadwal
              selectedRuanganId={selectedRuangan}
              selectedRuanganNama={ruangan?.nama_ruangan}
            />
            <Button asChild className="gap-1.5 shadow-sm">
              <Link href="/ruangan/booking">
                <CalendarPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Booking</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Room Info Card */}
        {ruangan && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 pt-1">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${statusColor} ring-2 ring-offset-1 ring-offset-card ${
                ruangan.status === 'tersedia' ? 'ring-emerald-200' : ruangan.status === 'maintenance' ? 'ring-amber-200' : 'ring-gray-200'
              }`} />
              <span className="font-medium text-sm">{ruangan.nama_ruangan}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {ruangan.lokasi_gedung}{ruangan.lantai ? ` Lt.${ruangan.lantai}` : ''}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {ruangan.kapasitas} orang
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {ruangan.status === 'tersedia' ? 'Aktif' : ruangan.status === 'maintenance' ? 'Maintenance' : 'Tidak Aktif'}
              </span>
            </div>
            {ruangan.fasilitas.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {ruangan.fasilitas.map(f => (
                  <Badge key={f} variant="outline" className="text-[10px] gap-1 py-0.5 px-1.5 bg-background/50 backdrop-blur-sm font-normal">
                    {FACILITY_ICON[f] ?? <Info className="h-3 w-3" />}
                    {f.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== LEGEND ===== */}
      <div className="flex items-center gap-5 text-xs text-muted-foreground flex-wrap px-1">
        <span className="font-medium text-foreground/70 uppercase tracking-wider text-[10px]">Status:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-1 ring-amber-200" />
          Menunggu Approval
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 ring-1 ring-red-200" />
          Disetujui (Terpakai)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-400 ring-1 ring-gray-200" />
          Selesai / Dibatalkan
        </span>
      </div>

      {/* ===== KALENDER ===== */}
      <Card className="overflow-hidden border shadow-sm">
        <CardContent className="p-0">
          {/* Loading overlay */}
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-2.5 bg-primary/5 border-b text-sm text-primary">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Memuat jadwal...</span>
            </div>
          )}
          <div className="jadwal-calendar">
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
              slotDuration="00:30:00"
              expandRows
              dayMaxEvents={3}
              eventDisplay="block"
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* ===== DIALOG DETAIL BOOKING ===== */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Detail Booking
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {(() => {
                  const st = BOOKING_STATUS[selectedEvent.status as keyof typeof BOOKING_STATUS]
                  return (
                    <Badge
                      className="text-xs px-3 py-1 font-medium"
                      style={{ background: st?.bgColor, color: st?.color, border: 'none' }}
                    >
                      {st?.label ?? selectedEvent.status}
                    </Badge>
                  )
                })()}
              </div>

              {/* Detail Fields */}
              <div className="rounded-lg border bg-muted/30 divide-y">
                <div className="flex items-center gap-3 px-4 py-3">
                  <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tanggal</p>
                    <p className="text-sm font-medium">
                      {new Date(selectedEvent.tanggal).toLocaleDateString('id-ID', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Waktu</p>
                    <p className="text-sm font-medium">
                      {selectedEvent.jam_mulai.slice(0, 5)} – {selectedEvent.jam_selesai.slice(0, 5)} WIB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Pemohon</p>
                    <p className="text-sm font-medium">
                      {(selectedEvent.user as { full_name: string }).full_name}
                      {selectedEvent.jumlah_peserta && (
                        <span className="text-muted-foreground font-normal"> · {selectedEvent.jumlah_peserta} peserta</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 px-4 py-3">
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Keperluan</p>
                    <p className="text-sm">{selectedEvent.keperluan}</p>
                  </div>
                </div>
              </div>

              {/* Catatan Admin */}
              {selectedEvent.catatan_admin && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800 p-3">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Catatan Admin</p>
                  <p className="text-sm text-amber-900 dark:text-amber-200">{selectedEvent.catatan_admin}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
