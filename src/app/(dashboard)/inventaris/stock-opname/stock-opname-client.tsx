'use client'

import { useState, useEffect, useTransition } from 'react'
import { toast } from 'sonner'
import { ClipboardCheck, Plus } from 'lucide-react'
import { getInventarisUntukOpname, submitStockOpname, getStockOpnameSesi } from '@/lib/actions/stock-opname-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Inventaris } from '@/lib/types'

interface OpnameItem { inventaris: Inventaris; jumlah_fisik: number; keterangan: string }

export function StockOpnameClient() {
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [opnameItems, setOpnameItems] = useState<OpnameItem[]>([])
  const [sesiList, setSesiList] = useState<{ sesi_id: string; tanggal_opname: string; user: { full_name: string }; total: number; tidak_sesuai: number }[]>([])
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    getStockOpnameSesi().then(r => setSesiList(r.data as never[]))
  }, [])

  const handleMulai = async () => {
    const list = await getInventarisUntukOpname()
    setOpnameItems(list.map(b => ({ inventaris: b, jumlah_fisik: b.jumlah_stok, keterangan: '' })))
    setShowForm(true)
  }

  const handleUpdate = (idx: number, field: 'jumlah_fisik' | 'keterangan', value: string | number) => {
    setOpnameItems(prev => {
      const next = [...prev]
      if (field === 'jumlah_fisik') {
        const n = Number(value)
        next[idx] = { ...next[idx], jumlah_fisik: Number.isNaN(n) ? 0 : Math.max(0, Math.floor(n)) }
      } else {
        next[idx] = { ...next[idx], [field]: value as string }
      }
      return next
    })
  }

  const handleSubmit = () => {
    for (const item of opnameItems) {
      if (!Number.isInteger(item.jumlah_fisik) || item.jumlah_fisik < 0) {
        toast.error('Jumlah fisik harus berupa angka bulat non-negatif')
        return
      }
    }
    const sesiId = `SO-${Date.now()}`
    startTransition(async () => {
      const result = await submitStockOpname(sesiId, tanggal, opnameItems.map(i => ({
        inventaris_id: i.inventaris.id, jumlah_fisik: i.jumlah_fisik, keterangan: i.keterangan || undefined
      })))
      if (result.success && result.data) {
        toast.success(`Selesai! ${result.data.tidak_sesuai} item tidak sesuai dari ${result.data.total}.`)
        setShowForm(false)
        getStockOpnameSesi().then(r => setSesiList(r.data as never[]))
      } else toast.error(result.error ?? 'Gagal submit')
    })
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Stock Opname</h1><p className="text-muted-foreground text-sm">Pencocokan stok fisik dengan sistem</p></div>
        <Button onClick={handleMulai}><Plus className="h-4 w-4 mr-2" />Mulai Opname</Button>
      </div>

      {sesiList.length === 0
        ? <div className="text-center py-16 text-muted-foreground"><ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>Belum ada riwayat opname</p></div>
        : <div className="space-y-3">
            {sesiList.map(s => (
              <Card key={s.sesi_id}><CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div><p className="font-medium text-sm">{s.tanggal_opname}</p><p className="text-xs text-muted-foreground">{s.user?.full_name} · {s.total} barang</p></div>
                  {s.tidak_sesuai > 0
                    ? <Badge className="bg-red-100 text-red-700 border-0">{s.tidak_sesuai} tidak sesuai</Badge>
                    : <Badge className="bg-green-100 text-green-700 border-0">Semua sesuai</Badge>}
                </div>
              </CardContent></Card>
            ))}
          </div>
      }

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Stock Opname Baru</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} max={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {opnameItems.map((item, idx) => {
                const selisih = item.jumlah_fisik - item.inventaris.jumlah_stok
                const ok = selisih === 0
                return (
                  <div key={item.inventaris.id} className={`border rounded-lg p-3 space-y-2 ${!ok ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/10' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div><p className="text-sm font-medium">{item.inventaris.nama_barang}</p><p className="text-xs text-muted-foreground">Sistem: {item.inventaris.jumlah_stok} {item.inventaris.satuan}{!ok && <span className={selisih > 0 ? ' text-green-600' : ' text-red-600'}> ({selisih > 0 ? '+' : ''}{selisih})</span>}</p></div>
                      <Badge variant={ok ? 'outline' : 'destructive'} className="text-xs">{ok ? 'Sesuai' : 'Tidak Sesuai'}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Label className="text-xs pt-2">Fisik:</Label>
                      <Input type="number" min={0} value={item.jumlah_fisik} onChange={e => handleUpdate(idx, 'jumlah_fisik', Number(e.target.value))} className="h-8 w-24" />
                      {!ok && <Input placeholder="Keterangan *" value={item.keterangan} onChange={e => handleUpdate(idx, 'keterangan', e.target.value)} className="h-8 flex-1" />}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-3 pt-2 border-t">
              <Button onClick={handleSubmit} disabled={isPending} className="flex-1">{isPending ? 'Menyimpan...' : 'Submit'}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
