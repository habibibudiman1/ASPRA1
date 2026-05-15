'use client'

// =============================================================================
// app/(dashboard)/inventaris/barang/baru/page.tsx
// Form tambah barang inventaris baru — Sarana only
// =============================================================================

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createInventarisSchema, type CreateInventarisSchema } from '@/lib/validators/inventaris-schema'
import { createInventaris, generateKodeBarang } from '@/lib/actions/inventaris-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { INVENTARIS_KATEGORI, INVENTARIS_KONDISI, SATUAN_OPTIONS } from '@/lib/constants'
import { ArrowLeft, RefreshCw } from 'lucide-react'

export default function TambahBarangPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [kodePreview, setKodePreview] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [pcComponents, setPcComponents] = useState({ os: '', processor: '', mb: '', ram: '', storage: '', pengguna: '', lainnya: '' })

  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<CreateInventarisSchema>({
    resolver: zodResolver(createInventarisSchema),
    defaultValues: { kondisi: 'baik' as const, jumlah_stok: 1, satuan: 'unit' },
  })

  const kategoriWatch = useWatch({ control, name: 'kategori' })
  const namaBarangWatch = useWatch({ control, name: 'nama_barang' }) || ''
  const isPC = namaBarangWatch.toLowerCase().includes('pc')

  const handleGenerateKode = async () => {
    if (!kategoriWatch) { toast.error('Pilih kategori terlebih dahulu'); return }
    setIsGenerating(true)
    const kode = await generateKodeBarang(kategoriWatch)
    setKodePreview(kode)
    setIsGenerating(false)
  }

  const onSubmit = (data: CreateInventarisSchema) => {
    startTransition(async () => {
      const formData = new FormData()
      Object.entries(data).forEach(([k, v]) => {
        if (isPC && (k === 'merk' || k === 'tipe_model')) return // Skip
        if (v !== undefined && v !== null) formData.append(k, String(v))
      })
      if (isPC) {
        formData.append('tipe_model', JSON.stringify({
          OS: pcComponents.os,
          Processor: pcComponents.processor,
          Motherboard: pcComponents.mb,
          RAM: pcComponents.ram,
          Storage: pcComponents.storage,
          Pengguna: pcComponents.pengguna,
          Lainnya: pcComponents.lainnya
        }))
        formData.append('merk', 'PC Rakitan')
      }
      const result = await createInventaris(formData)
      if (result.success) {
        toast.success(`Barang "${data.nama_barang}" berhasil ditambahkan!`)
        router.push('/inventaris/barang')
      } else {
        toast.error(result.error ?? 'Gagal menambahkan barang')
      }
    })
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">Tambah Barang</h1>
          <p className="text-muted-foreground text-sm">Input data barang inventaris baru</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Identitas Barang */}
        <Card>
          <CardHeader><CardTitle className="text-base">Identitas Barang</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kategori">Kategori *</Label>
                <Select onValueChange={(v) => { setValue('kategori', v as never); setKodePreview('') }}>
                  <SelectTrigger id="kategori"><SelectValue placeholder="Pilih kategori..." /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(INVENTARIS_KATEGORI).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.kategori && <p className="text-xs text-destructive">{errors.kategori.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="kode_barang">Kode Barang</Label>
                <div className="flex gap-2">
                  <Input
                    id="kode_barang"
                    value={kodePreview}
                    onChange={e => setKodePreview(e.target.value)}
                    placeholder="Auto-generate atau isi manual"
                    className="font-mono"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={handleGenerateKode} disabled={isGenerating}>
                    <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Klik ↻ untuk generate otomatis berdasarkan kategori</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nama_barang">Nama Barang *</Label>
              <Input id="nama_barang" placeholder="contoh: Laptop Lenovo IdeaPad" {...register('nama_barang')} />
              {errors.nama_barang && <p className="text-xs text-destructive">{errors.nama_barang.message}</p>}
            </div>

            {isPC ? (
              <div className="space-y-4 col-span-2 mt-4 p-4 border rounded-md bg-muted/20">
                <h4 className="text-sm font-medium">Spesifikasi Komponen PC</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>OS</Label><Input value={pcComponents.os} onChange={e => setPcComponents({...pcComponents, os: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Processor</Label><Input value={pcComponents.processor} onChange={e => setPcComponents({...pcComponents, processor: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Motherboard</Label><Input value={pcComponents.mb} onChange={e => setPcComponents({...pcComponents, mb: e.target.value})} /></div>
                  <div className="space-y-2"><Label>RAM</Label><Input value={pcComponents.ram} onChange={e => setPcComponents({...pcComponents, ram: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Storage (HDD/SSD)</Label><Input value={pcComponents.storage} onChange={e => setPcComponents({...pcComponents, storage: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Pengguna / Pemakai</Label><Input value={pcComponents.pengguna} onChange={e => setPcComponents({...pcComponents, pengguna: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Lainnya / Serial</Label><Input value={pcComponents.lainnya} onChange={e => setPcComponents({...pcComponents, lainnya: e.target.value})} /></div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="merk">Merk / Brand</Label>
                  <Input id="merk" placeholder="contoh: Lenovo" {...register('merk')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipe_model">Tipe / Model</Label>
                  <Input id="tipe_model" placeholder="contoh: IdeaPad 3 15ITL6" {...register('tipe_model')} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stok & Kondisi */}
        <Card>
          <CardHeader><CardTitle className="text-base">Stok & Kondisi</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jumlah_stok">Jumlah Stok *</Label>
                <Input id="jumlah_stok" type="number" min={0} {...register('jumlah_stok', { valueAsNumber: true })} />
                {errors.jumlah_stok && <p className="text-xs text-destructive">{errors.jumlah_stok.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="satuan">Satuan *</Label>
                <Select defaultValue="unit" onValueChange={(v) => setValue('satuan', v)}>
                  <SelectTrigger id="satuan"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SATUAN_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="kondisi">Kondisi *</Label>
                <Select defaultValue="baik" onValueChange={(v) => setValue('kondisi', v as never)}>
                  <SelectTrigger id="kondisi"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(INVENTARIS_KONDISI).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lokasi_penempatan">Lokasi Penempatan *</Label>
              <Input id="lokasi_penempatan" placeholder="contoh: Gudang A, Ruang Guru Lt.2" {...register('lokasi_penempatan')} />
              {errors.lokasi_penempatan && <p className="text-xs text-destructive">{errors.lokasi_penempatan.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Perolehan */}
        <Card>
          <CardHeader><CardTitle className="text-base">Data Perolehan</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tanggal_perolehan">Tanggal Perolehan *</Label>
                <Input id="tanggal_perolehan" type="date" {...register('tanggal_perolehan')} />
                {errors.tanggal_perolehan && <p className="text-xs text-destructive">{errors.tanggal_perolehan.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sumber_dana">Sumber Dana</Label>
                <Input id="sumber_dana" placeholder="contoh: Dana BOS, APBD, Sumbangan" {...register('sumber_dana')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nilai_perolehan">Nilai Perolehan (Rp)</Label>
              <Input id="nilai_perolehan" type="number" min={0} placeholder="0" {...register('nilai_perolehan', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="catatan">Catatan</Label>
              <Textarea id="catatan" placeholder="Catatan tambahan tentang barang ini..." rows={3} {...register('catatan')} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending} className="flex-1">
            {isPending ? 'Menyimpan...' : 'Simpan Barang'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/inventaris/barang')}>Batal</Button>
        </div>
      </form>
    </div>
  )
}
