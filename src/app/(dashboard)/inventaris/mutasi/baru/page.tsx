'use client'

// =============================================================================
// app/(dashboard)/inventaris/mutasi/baru/page.tsx
// Form tambah mutasi barang — Sarana & Admin
// =============================================================================

import { useState, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createMutasiSchema, type CreateMutasiSchema } from '@/lib/validators/inventaris-schema'
import { createMutasi } from '@/lib/actions/mutasi-actions'
import { getInventarisList, getInventarisById } from '@/lib/actions/inventaris-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import type { Inventaris } from '@/lib/types'
import { JENIS_MUTASI } from '@/lib/constants'

export default function TambahMutasiPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('barang')
  const [isPending, startTransition] = useTransition()
  const [barangList, setBarangList] = useState<Inventaris[]>([])
  const [selectedBarang, setSelectedBarang] = useState<Inventaris | null>(null)
  const today = new Date().toISOString().split('T')[0]

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreateMutasiSchema>({
    resolver: zodResolver(createMutasiSchema),
    defaultValues: { tanggal: today, jumlah: 1 },
  })

  const watchInventarisId = watch('inventaris_id')
  const watchJenisMutasi = watch('jenis_mutasi')

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
      const item = barangList.find(i => i.id === watchInventarisId)
      setSelectedBarang(item ?? null)
    }
  }, [watchInventarisId, barangList])

  const showLokasi = watchJenisMutasi === 'pindah_lokasi'

  const onSubmit = (data: CreateMutasiSchema) => {
    startTransition(async () => {
      const formData = new FormData()
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== null) formData.append(k, String(v))
      })
      const result = await createMutasi(formData)
      if (result.success) {
        toast.success('Mutasi barang berhasil dicatat!')
        router.push('/inventaris/mutasi')
      } else {
        toast.error(result.error ?? 'Gagal mencatat mutasi')
      }
    })
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">Tambah Mutasi Barang</h1>
          <p className="text-muted-foreground text-sm">Catat perubahan stok atau kondisi barang</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Pilih Barang */}
        <div className="space-y-2">
          <Label>Barang *</Label>
          <Select value={watchInventarisId ?? ''} onValueChange={(v) => setValue('inventaris_id', v)}>
            <SelectTrigger><SelectValue placeholder="Pilih barang..." /></SelectTrigger>
            <SelectContent>
              {barangList.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.nama_barang} — {b.jumlah_stok} {b.satuan}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.inventaris_id && <p className="text-xs text-destructive">{errors.inventaris_id.message}</p>}
        </div>

        {selectedBarang && (
          <Card className="bg-muted/30">
            <CardContent className="pt-4 pb-4 text-sm">
              <p><strong>{selectedBarang.nama_barang}</strong> · {selectedBarang.kode_barang}</p>
              <p className="text-muted-foreground">Stok saat ini: {selectedBarang.jumlah_stok} {selectedBarang.satuan} · {selectedBarang.lokasi_penempatan}</p>
            </CardContent>
          </Card>
        )}

        {/* Jenis Mutasi */}
        <div className="space-y-2">
          <Label>Jenis Mutasi *</Label>
          <Select onValueChange={(v) => setValue('jenis_mutasi', v as never)}>
            <SelectTrigger><SelectValue placeholder="Pilih jenis mutasi..." /></SelectTrigger>
            <SelectContent>
              {Object.entries(JENIS_MUTASI).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.jenis_mutasi && <p className="text-xs text-destructive">{errors.jenis_mutasi.message}</p>}
        </div>

        {/* Jumlah & Tanggal */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Jumlah *</Label>
            <Input type="number" min={1} {...register('jumlah', { valueAsNumber: true })} />
            {errors.jumlah && <p className="text-xs text-destructive">{errors.jumlah.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Tanggal *</Label>
            <Input type="date" max={today} {...register('tanggal')} />
            {errors.tanggal && <p className="text-xs text-destructive">{errors.tanggal.message}</p>}
          </div>
        </div>

        {/* Lokasi (hanya muncul jika pindah_lokasi) */}
        {showLokasi && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dari Lokasi</Label>
              <Input placeholder={selectedBarang?.lokasi_penempatan ?? 'Lokasi asal...'} {...register('dari_lokasi')} />
            </div>
            <div className="space-y-2">
              <Label>Ke Lokasi *</Label>
              <Input placeholder="Lokasi tujuan..." {...register('ke_lokasi')} />
            </div>
          </div>
        )}

        {/* Keterangan */}
        <div className="space-y-2">
          <Label>Keterangan * <span className="text-muted-foreground text-xs">(min. 5 karakter)</span></Label>
          <Textarea placeholder="Jelaskan alasan/konteks mutasi ini..." rows={3} {...register('keterangan')} />
          {errors.keterangan && <p className="text-xs text-destructive">{errors.keterangan.message}</p>}
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending} className="flex-1">
            {isPending ? 'Menyimpan...' : 'Simpan Mutasi'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button>
        </div>
      </form>
    </div>
  )
}
