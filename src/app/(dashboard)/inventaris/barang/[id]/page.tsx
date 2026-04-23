// =============================================================================
// app/(dashboard)/inventaris/barang/[id]/page.tsx
// Detail barang inventaris dengan riwayat mutasi
// =============================================================================

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Package, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { getInventarisById } from '@/lib/actions/inventaris-actions'
import { getMutasiByInventaris } from '@/lib/actions/mutasi-actions'
import { getCurrentUser } from '@/lib/actions/user-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { INVENTARIS_KATEGORI, INVENTARIS_KONDISI, JENIS_MUTASI } from '@/lib/constants'
import { formatRupiah, formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const item = await getInventarisById(id)
  return { title: item ? `${item.nama_barang} | Inventaris` : 'Barang Tidak Ditemukan' }
}

export default async function DetailBarangPage({ params }: Props) {
  const { id } = await params
  const [item, mutasi, profile] = await Promise.all([
    getInventarisById(id),
    getMutasiByInventaris(id),
    getCurrentUser(),
  ])

  if (!item) notFound()

  const isSarana = profile?.role === 'sarana'
  const kat = INVENTARIS_KATEGORI[item.kategori]
  const kon = INVENTARIS_KONDISI[item.kondisi]

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link href="/inventaris/barang"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div>
            <h1 className="text-xl font-bold">{item.nama_barang}</h1>
            <p className="text-sm text-muted-foreground font-mono">{item.kode_barang}</p>
          </div>
        </div>
        {isSarana && (
          <Button variant="outline" asChild><Link href={`/inventaris/barang/${id}/edit`}><Pencil className="h-4 w-4 mr-2" />Edit</Link></Button>
        )}
      </div>

      {/* Detail Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Informasi Barang</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Kategori">
              <Badge style={{ background: kat?.color + '20', color: kat?.color, border: 'none' }}>{kat?.label ?? item.kategori}</Badge>
            </Row>
            <Row label="Merk / Model">{item.merk ? `${item.merk} ${item.tipe_model ?? ''}`.trim() : '—'}</Row>
            <Row label="Lokasi">{item.lokasi_penempatan}</Row>
            <Row label="Kondisi">
              <Badge style={{ background: kon?.bgColor, color: kon?.color, border: 'none' }}>{kon?.label ?? item.kondisi}</Badge>
            </Row>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Stok & Nilai</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Jumlah Stok">
              <span className={item.jumlah_stok < 5 ? 'text-amber-600 font-semibold' : 'font-semibold'}>
                {item.jumlah_stok} {item.satuan}
              </span>
            </Row>
            {(isSarana || profile?.role === 'it_admin') && (
              <>
                <Row label="Nilai Perolehan">{item.nilai_perolehan ? formatRupiah(item.nilai_perolehan) : '—'}</Row>
                <Row label="Sumber Dana">{item.sumber_dana ?? '—'}</Row>
              </>
            )}
            <Row label="Tgl Perolehan">{formatDate(item.tanggal_perolehan).split(',')[0]}</Row>
          </CardContent>
        </Card>
      </div>

      {item.catatan && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{item.catatan}</p>
          </CardContent>
        </Card>
      )}

      {/* Riwayat Mutasi */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Riwayat Mutasi</CardTitle>
          {isSarana && (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/inventaris/mutasi/baru?barang=${id}`}>+ Mutasi</Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {mutasi.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Belum ada mutasi tercatat</p>
          ) : (
            <div className="space-y-2">
              {mutasi.slice(0, 10).map(m => {
                const jenis = JENIS_MUTASI[m.jenis_mutasi]
                const isIn = ['masuk', 'perbaikan'].includes(m.jenis_mutasi)
                return (
                  <div key={m.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isIn ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {isIn ? <ArrowDownCircle className="h-3.5 w-3.5" /> : <ArrowUpCircle className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{jenis?.label ?? m.jenis_mutasi}</span>
                        <span className="text-xs text-muted-foreground">{m.jumlah} {item.satuan}</span>
                        <span className="text-xs text-muted-foreground">({m.stok_sebelum} → {m.stok_sesudah})</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{m.keterangan}</p>
                      <p className="text-xs text-muted-foreground">{m.tanggal}</p>
                    </div>
                  </div>
                )
              })}
              {mutasi.length > 10 && (
                <Button variant="link" size="sm" asChild className="px-0">
                  <Link href={`/inventaris/mutasi?barang=${id}`}>Lihat semua ({mutasi.length})</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button asChild className="flex-1">
          <Link href={`/inventaris/peminjaman/baru?barang=${id}`}><Package className="h-4 w-4 mr-2" />Pinjam Barang Ini</Link>
        </Button>
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  )
}
