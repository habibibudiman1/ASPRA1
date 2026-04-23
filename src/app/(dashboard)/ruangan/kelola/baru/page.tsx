'use client'

// =============================================================================
// app/(dashboard)/ruangan/kelola/baru/page.tsx
// Form tambah ruangan baru — Admin only
// =============================================================================

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createRuanganSchema, type CreateRuanganSchema } from '@/lib/validators/ruangan-schema'
import { createRuangan } from '@/lib/actions/ruangan-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FASILITAS_OPTIONS } from '@/lib/constants'
import { ArrowLeft } from 'lucide-react'

export default function TambahRuanganPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [fasilitasSelected, setFasilitasSelected] = useState<string[]>([])

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreateRuanganSchema>({
    resolver: zodResolver(createRuanganSchema),
    defaultValues: { status: 'tersedia' as const, fasilitas: [] },
  })

  const toggleFasilitas = (val: string) => {
    setFasilitasSelected(prev => {
      const next = prev.includes(val) ? prev.filter(f => f !== val) : [...prev, val]
      setValue('fasilitas', next)
      return next
    })
  }

  const onSubmit = (data: CreateRuanganSchema) => {
    startTransition(async () => {
      const formData = new FormData()
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          if (k === 'fasilitas') formData.append(k, JSON.stringify(v))
          else formData.append(k, String(v))
        }
      })
      const result = await createRuangan(formData)
      if (result.success) {
        toast.success('Ruangan berhasil ditambahkan!')
        router.push('/ruangan/kelola')
      } else {
        toast.error(result.error ?? 'Gagal menambahkan ruangan')
      }
    })
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Tambah Ruangan</h1>
          <p className="text-muted-foreground text-sm">Isi detail ruangan baru</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Card>
          <CardHeader><CardTitle className="text-base">Informasi Dasar</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama_ruangan">Nama Ruangan *</Label>
              <Input id="nama_ruangan" placeholder="contoh: Ruang Rapat Utama" {...register('nama_ruangan')} />
              {errors.nama_ruangan && <p className="text-xs text-destructive">{errors.nama_ruangan.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lokasi_gedung">Lokasi Gedung *</Label>
                <Input id="lokasi_gedung" placeholder="contoh: Gedung A" {...register('lokasi_gedung')} />
                {errors.lokasi_gedung && <p className="text-xs text-destructive">{errors.lokasi_gedung.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lantai">Lantai</Label>
                <Input id="lantai" type="number" placeholder="1" {...register('lantai', { valueAsNumber: true })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kapasitas">Kapasitas (orang) *</Label>
                <Input id="kapasitas" type="number" min={1} {...register('kapasitas', { valueAsNumber: true })} />
                {errors.kapasitas && <p className="text-xs text-destructive">{errors.kapasitas.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select defaultValue="tersedia" onValueChange={(v) => setValue('status', v as 'tersedia')}>
                  <SelectTrigger id="status"><SelectValue /></SelectTrigger>
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
                  <Checkbox
                    id={`fas-${f.value}`}
                    checked={fasilitasSelected.includes(f.value)}
                    onCheckedChange={() => toggleFasilitas(f.value)}
                  />
                  <label htmlFor={`fas-${f.value}`} className="text-sm cursor-pointer">{f.label}</label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Keterangan</CardTitle></CardHeader>
          <CardContent>
            <Textarea id="keterangan" placeholder="Catatan tambahan (opsional)" rows={3} {...register('keterangan')} />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending} className="flex-1">
            {isPending ? 'Menyimpan...' : 'Simpan Ruangan'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/ruangan/kelola')}>Batal</Button>
        </div>
      </form>
    </div>
  )
}
