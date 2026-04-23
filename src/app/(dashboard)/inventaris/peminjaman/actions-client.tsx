'use client'

// =============================================================================
// app/(dashboard)/inventaris/peminjaman/actions-client.tsx
// Approve/reject/konfirmasi pengembalian — Sarana only
// =============================================================================

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react'
import { approvePeminjamanBarang, rejectPeminjamanBarang, konfirmasiPengembalian } from '@/lib/actions/peminjaman-barang-actions'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { PeminjamanBarangWithRelations } from '@/lib/types'

interface Props {
  peminjaman: PeminjamanBarangWithRelations
  isSarana: boolean
  isAdmin: boolean
}

export function PeminjamanBarangActions({ peminjaman, isSarana }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [rejectDialog, setRejectDialog] = useState(false)
  const [returnDialog, setReturnDialog] = useState(false)
  const [catatan, setCatatan] = useState('')
  const [kondisiKembali, setKondisiKembali] = useState('baik')

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approvePeminjamanBarang(peminjaman.id)
      if (result.success) { toast.success('Peminjaman disetujui!'); router.refresh() }
      else toast.error(result.error ?? 'Gagal menyetujui')
    })
  }

  const handleReject = () => {
    startTransition(async () => {
      const result = await rejectPeminjamanBarang(peminjaman.id, catatan)
      if (result.success) { toast.success('Peminjaman ditolak'); setRejectDialog(false); router.refresh() }
      else toast.error(result.error ?? 'Gagal menolak')
    })
  }

  const handleReturn = () => {
    startTransition(async () => {
      const result = await konfirmasiPengembalian(peminjaman.id, kondisiKembali, catatan || undefined)
      if (result.success) { toast.success('Pengembalian dikonfirmasi!'); setReturnDialog(false); router.refresh() }
      else toast.error(result.error ?? 'Gagal konfirmasi')
    })
  }

  if (!isSarana) return null

  return (
    <>
      <div className="flex gap-2 flex-shrink-0 flex-col sm:flex-row">
        {peminjaman.status === 'menunggu' && (
          <>
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleApprove} disabled={isPending}>
              <CheckCircle className="h-4 w-4 mr-1" />Setujui
            </Button>
            <Button size="sm" variant="destructive" onClick={() => { setCatatan(''); setRejectDialog(true) }} disabled={isPending}>
              <XCircle className="h-4 w-4 mr-1" />Tolak
            </Button>
          </>
        )}
        {['dipinjam', 'terlambat'].includes(peminjaman.status) && (
          <Button size="sm" variant="outline" onClick={() => { setCatatan(''); setKondisiKembali('baik'); setReturnDialog(true) }} disabled={isPending}>
            <RotateCcw className="h-4 w-4 mr-1" />Terima Kembali
          </Button>
        )}
      </div>

      {/* Dialog Reject */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Peminjaman</DialogTitle>
            <DialogDescription>Berikan alasan penolakan untuk peminjaman {peminjaman.inventaris?.nama_barang}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Alasan Penolakan *</Label>
            <Textarea value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Jelaskan alasan..." rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleReject} disabled={isPending}>Tolak</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Kembali */}
      <Dialog open={returnDialog} onOpenChange={setReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Pengembalian</DialogTitle>
            <DialogDescription>Konfirmasi barang {peminjaman.inventaris?.nama_barang} telah dikembalikan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Kondisi Saat Kembali *</Label>
              <Select defaultValue="baik" onValueChange={setKondisiKembali}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baik">Baik</SelectItem>
                  <SelectItem value="rusak_ringan">Rusak Ringan</SelectItem>
                  <SelectItem value="rusak_berat">Rusak Berat</SelectItem>
                  <SelectItem value="hilang">Hilang</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Catatan (Opsional)</Label>
              <Textarea value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Catatan kondisi barang..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialog(false)}>Batal</Button>
            <Button onClick={handleReturn} disabled={isPending}>Konfirmasi Kembali</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
