'use client'

// =============================================================================
// app/(dashboard)/inventaris/peminjaman/actions-client.tsx
// Interaksi Peminjaman Barang:
//  - Sarana: klik card → popup detail + approve / reject / terima kembali
//  - Staff/User: tombol "Kembalikan" untuk status dipinjam/terlambat milik sendiri
// =============================================================================

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  CheckCircle, XCircle, RotateCcw, Eye, Package,
  User, Calendar, CalendarCheck, AlertTriangle, FileText, ArrowLeftRight,
} from 'lucide-react'
import {
  approvePeminjamanBarang,
  rejectPeminjamanBarang,
  konfirmasiPengembalian,
  ajukanPengembalian,
} from '@/lib/actions/peminjaman-barang-actions'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PEMINJAMAN_BARANG_STATUS } from '@/lib/constants'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import type { PeminjamanBarangWithRelations } from '@/lib/types'

interface Props {
  peminjaman: PeminjamanBarangWithRelations
  isSarana: boolean
  isAdmin: boolean
  currentUserId: string
}

// ─── Komponen Detail Popup (Sarana) ──────────────────────────────────────────

function PeminjamanDetailDialog({
  peminjaman,
  open,
  onClose,
}: {
  peminjaman: PeminjamanBarangWithRelations
  open: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [rejectDialog, setRejectDialog] = useState(false)
  const [returnDialog, setReturnDialog] = useState(false)
  const [catatan, setCatatan] = useState('')
  const [kondisiKembali, setKondisiKembali] = useState('baik')

  const statusConfig = PEMINJAMAN_BARANG_STATUS[peminjaman.status]
  const today = new Date().toISOString().split('T')[0]
  const isLate = peminjaman.status === 'dipinjam' && peminjaman.tanggal_kembali_estimasi < today

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approvePeminjamanBarang(peminjaman.id)
      if (result.success) {
        toast.success('Peminjaman disetujui!')
        onClose()
        router.refresh()
      } else {
        toast.error(result.error ?? 'Gagal menyetujui')
      }
    })
  }

  const handleReject = () => {
    startTransition(async () => {
      const result = await rejectPeminjamanBarang(peminjaman.id, catatan)
      if (result.success) {
        toast.success('Peminjaman ditolak')
        setRejectDialog(false)
        onClose()
        router.refresh()
      } else {
        toast.error(result.error ?? 'Gagal menolak')
      }
    })
  }

  const handleReturn = () => {
    startTransition(async () => {
      const result = await konfirmasiPengembalian(peminjaman.id, kondisiKembali, catatan || undefined)
      if (result.success) {
        toast.success('Pengembalian dikonfirmasi!')
        setReturnDialog(false)
        onClose()
        router.refresh()
      } else {
        toast.error(result.error ?? 'Gagal konfirmasi')
      }
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Detail Peminjaman Barang
            </DialogTitle>
            <DialogDescription>
              Informasi lengkap pengajuan peminjaman barang
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status badge */}
            <div className="flex items-center gap-2">
              <Badge
                style={{ background: statusConfig?.bgColor, color: statusConfig?.color, border: 'none' }}
                className="text-sm px-3 py-1"
              >
                {statusConfig?.label ?? peminjaman.status}
              </Badge>
              {isLate && (
                <Badge className="bg-red-100 text-red-700 border-0 text-sm">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Melewati estimasi
                </Badge>
              )}
            </div>

            <Separator />

            {/* Info Barang */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Informasi Barang</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Nama Barang</p>
                  <p className="font-medium">{peminjaman.inventaris?.nama_barang ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Kode Barang</p>
                  <p className="font-mono font-medium">{peminjaman.inventaris?.kode_barang ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Jumlah Dipinjam</p>
                  <p className="font-medium">{peminjaman.jumlah_dipinjam} {peminjaman.inventaris?.satuan}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Kondisi Barang</p>
                  <p className="font-medium capitalize">{peminjaman.inventaris?.kondisi?.replace('_', ' ') ?? '—'}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Info Peminjam */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <User className="h-3.5 w-3.5" />Peminjam
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Nama</p>
                  <p className="font-medium">{peminjaman.user?.full_name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Diajukan</p>
                  <p className="font-medium">
                    {format(new Date(peminjaman.created_at), 'd MMM yyyy, HH:mm', { locale: localeId })}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Info Waktu */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />Waktu Peminjaman
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Tanggal Pinjam</p>
                  <p className="font-medium">
                    {format(new Date(peminjaman.tanggal_pinjam), 'd MMMM yyyy', { locale: localeId })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Estimasi Kembali</p>
                  <p className={`font-medium ${isLate ? 'text-red-600' : ''}`}>
                    {format(new Date(peminjaman.tanggal_kembali_estimasi), 'd MMMM yyyy', { locale: localeId })}
                  </p>
                </div>
                {peminjaman.tanggal_dikembalikan_aktual && (
                  <div>
                    <p className="text-muted-foreground">Tanggal Kembali Aktual</p>
                    <p className="font-medium text-green-600">
                      {format(new Date(peminjaman.tanggal_dikembalikan_aktual), 'd MMMM yyyy', { locale: localeId })}
                    </p>
                  </div>
                )}
                {peminjaman.kondisi_saat_kembali && (
                  <div>
                    <p className="text-muted-foreground">Kondisi Saat Kembali</p>
                    <p className="font-medium capitalize">{peminjaman.kondisi_saat_kembali.replace('_', ' ')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Catatan Peminjam */}
            {peminjaman.catatan_peminjam && (
              <>
                <Separator />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />Catatan Peminjam
                  </p>
                  <p className="text-sm bg-muted/40 rounded-md p-3">{peminjaman.catatan_peminjam}</p>
                </div>
              </>
            )}

            {/* Catatan Sarana */}
            {peminjaman.catatan_sarana && (
              <>
                <Separator />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <CalendarCheck className="h-3.5 w-3.5" />Catatan Sarana
                  </p>
                  <p className="text-sm bg-muted/40 rounded-md p-3">{peminjaman.catatan_sarana}</p>
                </div>
              </>
            )}

            {/* Approver info */}
            {peminjaman.approver && (
              <>
                <Separator />
                <div className="text-sm">
                  <span className="text-muted-foreground">Diproses oleh: </span>
                  <span className="font-medium">{peminjaman.approver?.full_name}</span>
                  {peminjaman.approved_at && (
                    <span className="text-muted-foreground">
                      {' '}·{' '}{format(new Date(peminjaman.approved_at), 'd MMM yyyy, HH:mm', { locale: localeId })}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Action buttons di dalam dialog */}
          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="sm:mr-auto">Tutup</Button>
            {peminjaman.status === 'menunggu' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => { setCatatan(''); setRejectDialog(true) }}
                  disabled={isPending}
                >
                  <XCircle className="h-4 w-4 mr-1" />Tolak
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleApprove}
                  disabled={isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />Setujui
                </Button>
              </>
            )}
            {['dipinjam', 'terlambat'].includes(peminjaman.status) && (
              <Button
                variant="outline"
                onClick={() => { setCatatan(''); setKondisiKembali('baik'); setReturnDialog(true) }}
                disabled={isPending}
              >
                <RotateCcw className="h-4 w-4 mr-1" />Terima Kembali
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Reject (nested) */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Peminjaman</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan untuk peminjaman <strong>{peminjaman.inventaris?.nama_barang}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Alasan Penolakan *</Label>
            <Textarea value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Jelaskan alasan penolakan..." rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleReject} disabled={isPending || catatan.length < 5}>
              Tolak Peminjaman
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Terima Kembali (nested) */}
      <Dialog open={returnDialog} onOpenChange={setReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Pengembalian</DialogTitle>
            <DialogDescription>
              Konfirmasi barang <strong>{peminjaman.inventaris?.nama_barang}</strong> ({peminjaman.jumlah_dipinjam} {peminjaman.inventaris?.satuan}) telah dikembalikan.
            </DialogDescription>
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
            <Button onClick={handleReturn} disabled={isPending}>
              <ArrowLeftRight className="h-4 w-4 mr-1" />Konfirmasi Kembali
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Komponen Staff: Tombol Kembalikan ───────────────────────────────────────

function StaffReturnButton({ peminjaman }: { peminjaman: PeminjamanBarangWithRelations }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleReturn = () => {
    startTransition(async () => {
      const result = await ajukanPengembalian(peminjaman.id)
      if (result.success) {
        toast.success('Barang berhasil dilaporkan dikembalikan!')
        setConfirmOpen(false)
        router.refresh()
      } else {
        toast.error(result.error ?? 'Gagal melaporkan pengembalian')
      }
    })
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="border-green-500 text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
        onClick={() => setConfirmOpen(true)}
        disabled={isPending}
      >
        <RotateCcw className="h-4 w-4 mr-1" />Kembalikan
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Pengembalian</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin melaporkan bahwa <strong>{peminjaman.inventaris?.nama_barang}</strong> ({peminjaman.jumlah_dipinjam} {peminjaman.inventaris?.satuan}) sudah dikembalikan?
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Stok barang akan otomatis ditambah kembali. Sarana akan mengkonfirmasi kondisi barang.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Batal</Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleReturn}
              disabled={isPending}
            >
              <RotateCcw className="h-4 w-4 mr-1" />Ya, Sudah Dikembalikan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function PeminjamanBarangActions({ peminjaman, isSarana, currentUserId }: Props) {
  const [detailOpen, setDetailOpen] = useState(false)

  const isOwnRecord = peminjaman.user_id === currentUserId
  const canReturn = isOwnRecord && ['dipinjam', 'terlambat'].includes(peminjaman.status)

  // Sarana: tampilkan tombol "Lihat Detail" yang membuka popup
  if (isSarana) {
    return (
      <>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setDetailOpen(true)}
          className="flex-shrink-0"
        >
          <Eye className="h-4 w-4 mr-1" />Detail
        </Button>
        <PeminjamanDetailDialog
          peminjaman={peminjaman}
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
        />
      </>
    )
  }

  // Staff/User: tampilkan tombol kembalikan jika record milik sendiri dan status dipinjam/terlambat
  if (canReturn) {
    return <StaffReturnButton peminjaman={peminjaman} />
  }

  return null
}
