'use client'

// =============================================================================
// app/(dashboard)/ruangan/kelola/[id]/page.tsx
// Form edit ruangan — Admin only
// =============================================================================

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { updateRuanganSchema, type UpdateRuanganSchema } from '@/lib/validators/ruangan-schema'
import { updateRuangan, getRuanganById } from '@/lib/actions/ruangan-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FASILITAS_OPTIONS } from '@/lib/constants'
import { ArrowLeft, Loader2 } from 'lucide-react'
import type { Ruangan } from '@/lib/types'

interface Props { params: Promise<{ id: string }> }

export default function EditRuanganPage({ params }: Props) {
  const { id } = use(params)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)
  const [ruangan, setRuangan] = useState<Ruangan | null>(null)
  const [fasilitasSelected, setFasilitasSelected] = useState<string[]>([])

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<UpdateRuanganSchema>({
    resolver: zodResolver(updateRuanganSchema),
  })

  useEffect(() => {
    getRuanganById(id).then(data => {
      if (data) {
        setRuangan(data)
        setFasilitasSelected(data.fasilitas ?? [])
        reset({
          id,
          nama_ruangan: data.nama_ruangan,
          lokasi_gedung: data.lokasi_gedung,
          lantai: data.lantai ?? undefined,
          kapasitas: data.kapasitas,
          status: data.status,
          keterangan: data.keterangan ?? undefined,
          fasilitas: data.fasilitas ?? [],
        })
      }
      setIsLoading(false)
    })
  }, [id, reset])

  const toggleFasilitas = (val: string) => {
    setFasilitasSelected(prev => {
      const next = prev.includes(val) ? prev.filter(f => f !== val) : [...prev, val]
      setValue('fasilitas', next)
      return next
    })
  }

  const onSubmit = (data: UpdateRuanganSchema) => {
    startTransition(async () => {
      const formData = new FormData()
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          if (k === 'fasilitas') formData.append(k, JSON.stringify(v))
          else formData.append(k, String(v))
        }
      })
      const result = await updateRuangan(formData)
      if (result.success) {
        toast.success('Ruangan berhasil diperbarui!')
        router.push('/ruangan/kelola')
      } else {
        toast.error(result.error ?? 'Gagal memperbarui ruangan')
      }
    })
  }

  if (isLoading) return (
    <div className="flex items-center justify-center p-16">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )

  if (!ruangan) return (
    <div className="p-6 text-center text-muted-foreground">Ruangan tidak ditemukan</div>
  )

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Ruangan</h1>
          <p className="text-muted-foreground text-sm">{ruangan.nama_ruangan}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <input type="hidden" {...register('id')} />

        <Card>
          <CardHeader><CardTitle className="text-base">Informasi Dasar</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Ruangan *</Label>
              <Input {...register('nama_ruangan')} />
              {errors.nama_ruangan && <p className="text-xs text-destructive">{errors.nama_ruangan.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lokasi Gedung *</Label>
                <Input {...register('lokasi_gedung')} />
                {errors.lokasi_gedung && <p className="text-xs text-destructive">{errors.lokasi_gedung.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Lantai</Label>
                <Input type="number" {...register('lantai', { valueAsNumber: true })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kapasitas *</Label>
                <Input type="number" min={1} {...register('kapasitas', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select defaultValue={ruangan.status} onValueChange={(v) => setValue('status', v as 'tersedia')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tersedia">Tersedia</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="tidak_aktif">Tidak Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Fasilitas</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {FASILITAS_OPTIONS.map(f => (
                <div key={f.value} className="flex items-center gap-2">
                  <Checkbox id={`fas-${f.value}`} checked={fasilitasSelected.includes(f.value)} onCheckedChange={() => toggleFasilitas(f.value)} />
                  <label htmlFor={`fas-${f.value}`} className="text-sm cursor-pointer">{f.label}</label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Keterangan</CardTitle></CardHeader>
          <CardContent>
            <Textarea rows={3} {...register('keterangan')} />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending} className="flex-1">{isPending ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
          <Button type="button" variant="outline" onClick={() => router.push('/ruangan/kelola')}>Batal</Button>
        </div>
      </form>
    </div>
  )
}
