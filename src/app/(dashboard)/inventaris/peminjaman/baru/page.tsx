'use client'

// =============================================================================
// app/(dashboard)/inventaris/peminjaman/baru/page.tsx
// Form ajukan peminjaman barang
// =============================================================================

import { useState, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createPeminjamanBarangSchema, type CreatePeminjamanBarangSchema } from '@/lib/validators/inventaris-schema'
import { createPeminjamanBarang } from '@/lib/actions/peminjaman-barang-actions'
import { getInventarisList } from '@/lib/actions/inventaris-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import type { Inventaris } from '@/lib/types'
import { INVENTARIS_KONDISI } from '@/lib/constants'
import { PEMINJAMAN_BARANG_RULES } from '@/lib/constants'

function getMaxReturnDate() {
  const d = new Date()
  d.setDate(d.getDate() + PEMINJAMAN_BARANG_RULES.MAX_DURATION_DAYS)
  return d.toISOString().split('T')[0]
}

export default function PinjamBarangPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('barang')
  const [isPending, startTransition] = useTransition()
  const [barangList, setBarangList] = useState<Inventaris[]>([])
  const [selectedBarang, setSelectedBarang] = useState<Inventaris | null>(null)
  const today = new Date().toISOString().split('T')[0]

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreatePeminjamanBarangSchema>({
    resolver: zodResolver(createPeminjamanBarangSchema),
    defaultValues: { tanggal_pinjam: today, jumlah_dipinjam: 1 },
  })

  const watchInventarisId = watch('inventaris_id')
  const watchJumlah = watch('jumlah_dipinjam')

  useEffect(() => {
    getInventarisList().then(list => {
      setBarangList(list)
      if (preselectedId) {
        const item = list.find(i => i.id === preselectedId)
        if (item) { setValue('inventaris_id', preselectedId); setSelectedBarang(item) }
      }
    })
  }, [preselectedId, setValue])

  useEffect(() => {
    if (watchInventarisId) {
      setSelectedBarang(barangList.find(i => i.id === watchInventarisId) ?? null)
    }
  }, [watchInventarisId, barangList])

  const onSubmit = (data: CreatePeminjamanBarangSchema) => {
    startTransition(async () => {
      const formData = new FormData()
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== null) formData.append(k, String(v))
      })
      const result = await createPeminjamanBarang(formData)
      if (result.success) {
        toast.success('Permintaan peminjaman berhasil diajukan! Menunggu persetujuan Sarana.')
        router.push('/inventaris/peminjaman')
      } else {
        toast.error(result.error ?? 'Gagal mengajukan peminjaman')
      }
    })
  }

  const kondisi = selectedBarang ? INVENTARIS_KONDISI[selectedBarang.kondisi] : null

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">Pinjam Barang</h1>
          <p className="text-muted-foreground text-sm">Ajukan peminjaman barang inventaris</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Pilih Barang */}
        <div className="space-y-2">
          <Label htmlFor="inventaris_id">Pilih Barang *</Label>
          <Select
            value={watchInventarisId ?? ''}
            onValueChange={(v) => setValue('inventaris_id', v)}
          >
            <SelectTrigger id="inventaris_id">
              <SelectValue placeholder="Pilih barang yang ingin dipinjam..." />
            </SelectTrigger>
            <SelectContent>
              {barangList.map(b => (
                <SelectItem key={b.id} value={b.id}>
                  {b.nama_barang} — stok: {b.jumlah_stok} {b.satuan}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.inventaris_id && <p className="text-xs text-destructive">{errors.inventaris_id.message}</p>}
        </div>

        {/* Info barang terpilih */}
        {selectedBarang && (
          <Card className="bg-muted/30">
            <CardContent className="pt-4 pb-4 text-sm space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{selectedBarang.nama_barang}</span>
                <Badge variant="outline" className="text-xs font-mono">{selectedBarang.kode_barang}</Badge>
                {kondisi && <Badge style={{ background: kondisi.bgColor, color: kondisi.color, border: 'none' }}>{kondisi.label}</Badge>}
              </div>
              <p className="text-muted-foreground">Stok tersedia: <strong>{selectedBarang.jumlah_stok} {selectedBarang.satuan}</strong></p>
              <p className="text-muted-foreground">Lokasi: {selectedBarang.lokasi_penempatan}</p>
            </CardContent>
          </Card>
        )}

        {/* Jumlah */}
        <div className="space-y-2">
          <Label htmlFor="jumlah_dipinjam">Jumlah yang Dipinjam *</Label>
          <Input
            id="jumlah_dipinjam"
            type="number"
            min={1}
            max={selectedBarang?.jumlah_stok}
            {...register('jumlah_dipinjam', { valueAsNumber: true })}
          />
          {selectedBarang && watchJumlah > selectedBarang.jumlah_stok && (
            <p className="text-xs text-destructive">Melebihi stok tersedia ({selectedBarang.jumlah_stok} {selectedBarang.satuan})</p>
          )}
          {errors.jumlah_dipinjam && <p className="text-xs text-destructive">{errors.jumlah_dipinjam.message}</p>}
        </div>

        {/* Tanggal */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tanggal_pinjam">Tanggal Pinjam *</Label>
            <Input id="tanggal_pinjam" type="date" min={today} {...register('tanggal_pinjam')} />
            {errors.tanggal_pinjam && <p className="text-xs text-destructive">{errors.tanggal_pinjam.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="tanggal_kembali_estimasi">Estimasi Kembali *</Label>
            <Input id="tanggal_kembali_estimasi" type="date" min={today} max={getMaxReturnDate()} {...register('tanggal_kembali_estimasi')} />
            {errors.tanggal_kembali_estimasi && <p className="text-xs text-destructive">{errors.tanggal_kembali_estimasi.message}</p>}
          </div>
        </div>

        {/* Catatan */}
        <div className="space-y-2">
          <Label htmlFor="catatan_peminjam">Catatan / Keperluan <span className="text-muted-foreground text-xs">(opsional)</span></Label>
          <Textarea id="catatan_peminjam" placeholder="Jelaskan keperluan penggunaan barang..." rows={3} {...register('catatan_peminjam')} />
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending} className="flex-1">
            <ShoppingCart className="h-4 w-4 mr-2" />
            {isPending ? 'Mengajukan...' : 'Ajukan Peminjaman'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button>
        </div>
      </form>
    </div>
  )
}
