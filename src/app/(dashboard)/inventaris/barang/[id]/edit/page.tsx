'use client'

// =============================================================================
// app/(dashboard)/inventaris/barang/[id]/edit/page.tsx
// Form edit barang inventaris — Sarana only
// =============================================================================

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { updateInventarisSchema, type UpdateInventarisSchema } from '@/lib/validators/inventaris-schema'
import { updateInventaris, getInventarisById } from '@/lib/actions/inventaris-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { INVENTARIS_KATEGORI, INVENTARIS_KONDISI, SATUAN_OPTIONS } from '@/lib/constants'
import { ArrowLeft, Loader2 } from 'lucide-react'
import type { Inventaris } from '@/lib/types'

interface Props { params: Promise<{ id: string }> }

export default function EditBarangPage({ params }: Props) {
  const { id } = use(params)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)
  const [barang, setBarang] = useState<Inventaris | null>(null)

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<UpdateInventarisSchema>({
    resolver: zodResolver(updateInventarisSchema),
  })

  useEffect(() => {
    getInventarisById(id).then(data => {
      if (data) {
        setBarang(data)
        reset({
          id,
          nama_barang: data.nama_barang,
          kategori: data.kategori,
          merk: data.merk ?? undefined,
          tipe_model: data.tipe_model ?? undefined,
          jumlah_stok: data.jumlah_stok,
          satuan: data.satuan,
          kondisi: data.kondisi,
          lokasi_penempatan: data.lokasi_penempatan,
          tanggal_perolehan: data.tanggal_perolehan,
          sumber_dana: data.sumber_dana ?? undefined,
          nilai_perolehan: data.nilai_perolehan ?? undefined,
          catatan: data.catatan ?? undefined,
        })
      }
      setIsLoading(false)
    })
  }, [id, reset])

  const onSubmit = (data: UpdateInventarisSchema) => {
    startTransition(async () => {
      const formData = new FormData()
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== null) formData.append(k, String(v))
      })
      const result = await updateInventaris(formData)
      if (result.success) {
        toast.success('Barang berhasil diperbarui!')
        router.push(`/inventaris/barang/${id}`)
      } else {
        toast.error(result.error ?? 'Gagal memperbarui barang')
      }
    })
  }

  if (isLoading) return <div className="flex items-center justify-center p-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  if (!barang) return <div className="p-6 text-center text-muted-foreground">Barang tidak ditemukan</div>

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Barang</h1>
          <p className="text-muted-foreground text-sm font-mono">{barang.kode_barang}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <input type="hidden" {...register('id')} />

        <Card>
          <CardHeader><CardTitle className="text-base">Identitas</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Kategori *</Label>
              <Select defaultValue={barang.kategori} onValueChange={(v) => setValue('kategori', v as never)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(INVENTARIS_KATEGORI).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nama Barang *</Label>
              <Input {...register('nama_barang')} />
              {errors.nama_barang && <p className="text-xs text-destructive">{errors.nama_barang.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Merk</Label><Input {...register('merk')} /></div>
              <div className="space-y-2"><Label>Tipe/Model</Label><Input {...register('tipe_model')} /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Stok & Kondisi</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Jumlah Stok *</Label>
                <Input type="number" min={0} {...register('jumlah_stok', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Satuan *</Label>
                <Select defaultValue={barang.satuan} onValueChange={(v) => setValue('satuan', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SATUAN_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kondisi *</Label>
                <Select defaultValue={barang.kondisi} onValueChange={(v) => setValue('kondisi', v as never)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(INVENTARIS_KONDISI).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Lokasi Penempatan *</Label>
              <Input {...register('lokasi_penempatan')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Perolehan</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Tanggal Perolehan *</Label><Input type="date" {...register('tanggal_perolehan')} /></div>
              <div className="space-y-2"><Label>Sumber Dana</Label><Input {...register('sumber_dana')} /></div>
            </div>
            <div className="space-y-2"><Label>Nilai Perolehan (Rp)</Label><Input type="number" min={0} {...register('nilai_perolehan', { valueAsNumber: true })} /></div>
            <div className="space-y-2"><Label>Catatan</Label><Textarea rows={3} {...register('catatan')} /></div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending} className="flex-1">{isPending ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
          <Button type="button" variant="outline" onClick={() => router.push(`/inventaris/barang/${id}`)}>Batal</Button>
        </div>
      </form>
    </div>
  )
}
