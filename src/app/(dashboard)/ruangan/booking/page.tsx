'use client'

// =============================================================================
// app/(dashboard)/ruangan/booking/page.tsx
// Form booking ruangan dengan validasi realtime
// =============================================================================

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { CalendarPlus, AlertTriangle, CheckCircle } from 'lucide-react'
import { createBookingSchema, type CreateBookingSchema } from '@/lib/validators/ruangan-schema'
import { createBooking } from '@/lib/actions/booking-actions'
import { getRuanganList, cekBookingBentrok } from '@/lib/actions/ruangan-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { Ruangan } from '@/lib/types'
import { BOOKING_RULES } from '@/lib/constants'

// Generate time options (30-minute increments from 06:00 to 21:30)
function generateTimeOptions() {
  const options: string[] = []
  for (let h = 6; h <= 21; h++) {
    options.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 21) options.push(`${String(h).padStart(2, '0')}:30`)
  }
  return options
}
const TIME_OPTIONS = generateTimeOptions()

function getMaxDate() {
  const d = new Date()
  d.setDate(d.getDate() + BOOKING_RULES.MAX_DAYS_AHEAD)
  return d.toISOString().split('T')[0]
}
function getMinDate() {
  return new Date().toISOString().split('T')[0]
}

export default function BookingRuanganPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [ruanganList, setRuanganList] = useState<Ruangan[]>([])
  const [selectedRuangan, setSelectedRuangan] = useState<Ruangan | null>(null)
  const [bentrokWarning, setBentrokWarning] = useState<string | null>(null)
  const [isCheckingBentrok, setIsCheckingBentrok] = useState(false)

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors },
  } = useForm<CreateBookingSchema>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: {
      tanggal: getMinDate(),
      jam_mulai: '08:00',
      jam_selesai: '09:00',
    },
  })

  const watchRuanganId = watch('ruangan_id')
  const watchTanggal = watch('tanggal')
  const watchJamMulai = watch('jam_mulai')
  const watchJamSelesai = watch('jam_selesai')

  useEffect(() => {
    getRuanganList().then(setRuanganList)
  }, [])

  useEffect(() => {
    if (watchRuanganId) {
      setSelectedRuangan(ruanganList.find(r => r.id === watchRuanganId) ?? null)
    }
  }, [watchRuanganId, ruanganList])

  // Cek bentrok realtime
  useEffect(() => {
    if (!watchRuanganId || !watchTanggal || !watchJamMulai || !watchJamSelesai) return
    if (watchJamSelesai <= watchJamMulai) return

    const timer = setTimeout(async () => {
      setIsCheckingBentrok(true)
      try {
        const bentrok = await cekBookingBentrok(watchRuanganId, watchTanggal, watchJamMulai, watchJamSelesai)
        setBentrokWarning(bentrok.length > 0 ? `Waktu ini bentrok dengan ${bentrok.length} booking lain` : null)
      } finally {
        setIsCheckingBentrok(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [watchRuanganId, watchTanggal, watchJamMulai, watchJamSelesai])

  const onSubmit = (data: CreateBookingSchema) => {
    if (bentrokWarning) {
      toast.error('Selesaikan konflik waktu terlebih dahulu')
      return
    }
    startTransition(async () => {
      const formData = new FormData()
      Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== null) formData.append(k, String(v)) })
      const result = await createBooking(formData)
      if (result.success) {
        toast.success('Booking berhasil diajukan! Menunggu persetujuan Admin.')
        router.push('/ruangan/riwayat')
      } else {
        toast.error(result.error ?? 'Gagal membuat booking')
      }
    })
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Booking Ruangan</h1>
        <p className="text-muted-foreground text-sm">Ajukan peminjaman ruangan (maks. {BOOKING_RULES.MAX_DAYS_AHEAD} hari ke depan)</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Pilih Ruangan */}
        <div className="space-y-2">
          <Label htmlFor="ruangan_id">Ruangan *</Label>
          <Select onValueChange={(v) => setValue('ruangan_id', v)}>
            <SelectTrigger id="ruangan_id">
              <SelectValue placeholder="Pilih ruangan..." />
            </SelectTrigger>
            <SelectContent>
              {ruanganList.map(r => (
                <SelectItem key={r.id} value={r.id}>
                  {r.nama_ruangan} — {r.lokasi_gedung} (kap. {r.kapasitas})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.ruangan_id && <p className="text-xs text-destructive">{errors.ruangan_id.message}</p>}
        </div>

        {/* Info Ruangan */}
        {selectedRuangan && (
          <Card className="bg-muted/30">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Kapasitas: {selectedRuangan.kapasitas} orang</Badge>
                {selectedRuangan.fasilitas.map(f => <Badge key={f} variant="outline" className="text-xs">{f}</Badge>)}
              </div>
              {selectedRuangan.keterangan && <p className="text-xs text-muted-foreground mt-2">{selectedRuangan.keterangan}</p>}
            </CardContent>
          </Card>
        )}

        {/* Tanggal */}
        <div className="space-y-2">
          <Label htmlFor="tanggal">Tanggal *</Label>
          <Input
            id="tanggal"
            type="date"
            min={getMinDate()}
            max={getMaxDate()}
            {...register('tanggal')}
          />
          {errors.tanggal && <p className="text-xs text-destructive">{errors.tanggal.message}</p>}
        </div>

        {/* Jam */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="jam_mulai">Jam Mulai *</Label>
            <Select defaultValue="08:00" onValueChange={(v) => setValue('jam_mulai', v)}>
              <SelectTrigger id="jam_mulai"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.jam_mulai && <p className="text-xs text-destructive">{errors.jam_mulai.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="jam_selesai">Jam Selesai *</Label>
            <Select defaultValue="09:00" onValueChange={(v) => setValue('jam_selesai', v)}>
              <SelectTrigger id="jam_selesai"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.jam_selesai && <p className="text-xs text-destructive">{errors.jam_selesai.message}</p>}
          </div>
        </div>

        {/* Indikator bentrok */}
        {isCheckingBentrok && (
          <p className="text-xs text-muted-foreground">Memeriksa ketersediaan...</p>
        )}
        {!isCheckingBentrok && bentrokWarning && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {bentrokWarning}. Pilih waktu lain.
          </div>
        )}
        {!isCheckingBentrok && !bentrokWarning && watchRuanganId && watchTanggal && watchJamMulai && watchJamSelesai && watchJamSelesai > watchJamMulai && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/10 px-3 py-2 rounded-lg">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            Waktu tersedia!
          </div>
        )}

        {/* Keperluan */}
        <div className="space-y-2">
          <Label htmlFor="keperluan">Keperluan / Tujuan * <span className="text-xs text-muted-foreground">(min. 10 karakter)</span></Label>
          <Textarea
            id="keperluan"
            placeholder="Jelaskan keperluan penggunaan ruangan..."
            rows={3}
            {...register('keperluan')}
          />
          {errors.keperluan && <p className="text-xs text-destructive">{errors.keperluan.message}</p>}
        </div>

        {/* Jumlah Peserta */}
        <div className="space-y-2">
          <Label htmlFor="jumlah_peserta">Jumlah Peserta <span className="text-xs text-muted-foreground">(opsional)</span></Label>
          <Input
            id="jumlah_peserta"
            type="number"
            min={1}
            max={selectedRuangan?.kapasitas}
            placeholder="Perkiraan jumlah peserta"
            {...register('jumlah_peserta', { valueAsNumber: true })}
          />
          {errors.jumlah_peserta && <p className="text-xs text-destructive">{errors.jumlah_peserta.message}</p>}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isPending || !!bentrokWarning} className="flex-1">
            <CalendarPlus className="h-4 w-4 mr-2" />
            {isPending ? 'Mengajukan...' : 'Ajukan Booking'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button>
        </div>
      </form>
    </div>
  )
}
