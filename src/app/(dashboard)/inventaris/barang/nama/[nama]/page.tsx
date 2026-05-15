// =============================================================================
// app/(dashboard)/inventaris/barang/nama/[nama]/page.tsx
// Drilldown: semua item dengan nama barang tertentu
// =============================================================================

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Package } from 'lucide-react'
import { getInventarisByNama } from '@/lib/actions/inventaris-actions'
import { getCurrentUser } from '@/lib/actions/user-actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { INVENTARIS_KATEGORI, INVENTARIS_KONDISI } from '@/lib/constants'
import { formatRupiah } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ nama: string }>
  searchParams: Promise<{ page?: string; lokasi?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nama } = await params
  return { title: `${decodeURIComponent(nama)} | Inventaris` }
}

export default async function DrilldownNamaPage({ params, searchParams }: Props) {
  const { nama } = await params
  const sp = await searchParams
  const namaDecoded = decodeURIComponent(nama)
  const page = Number(sp.page ?? 1)
  const lokasiFilter = sp.lokasi ? decodeURIComponent(sp.lokasi) : undefined

  const { data: items, pagination } = await getInventarisByNama(namaDecoded, page, 20, lokasiFilter)
  const profile = await getCurrentUser()
  const isSarana = profile?.role === 'sarana'

  if (items.length === 0 && page === 1) notFound()


  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={lokasiFilter ? `/inventaris/lokasi/${encodeURIComponent(lokasiFilter)}` : '/inventaris/barang'}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {namaDecoded}
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            {lokasiFilter && (
              <>
                <MapPin className="h-3.5 w-3.5" />
                <span>{lokasiFilter}</span>
                <span>·</span>
              </>
            )}
            {pagination.total} item
          </p>
        </div>
      </div>

      {/* Tabel */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kode</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Merk / Model</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stok</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kondisi</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Lokasi</th>
                {(isSarana || profile?.role === 'admin') && (
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nilai</th>
                )}
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => {
                const kat = INVENTARIS_KATEGORI[item.kategori]
                const kon = INVENTARIS_KONDISI[item.kondisi]
                return (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.kode_barang}</td>
                    <td className="px-4 py-3">
                      <div>
                        {item.merk
                          ? <p className="font-medium">{item.merk} {item.tipe_model}</p>
                          : <p className="text-muted-foreground">—</p>
                        }
                        <Badge className="mt-1" style={{ background: kat?.color + '20', color: kat?.color, border: 'none' }}>
                          {kat?.label ?? item.kategori}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={item.jumlah_stok < 5 ? 'text-amber-600 font-semibold' : ''}>
                        {item.jumlah_stok} {item.satuan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge style={{ background: kon?.bgColor, color: kon?.color, border: 'none' }}>
                        {kon?.label ?? item.kondisi}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{item.lokasi_penempatan}</td>
                    {(isSarana || profile?.role === 'admin') && (
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {item.nilai_perolehan ? formatRupiah(item.nilai_perolehan) : '—'}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/inventaris/barang/${item.id}`}>Detail</Link>
                        </Button>
                        {isSarana && (
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/inventaris/barang/${item.id}/edit`}>Edit</Link>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Halaman {pagination.page} dari {pagination.total_pages} ({pagination.total} total)
          </p>
          <div className="flex gap-2">
            {pagination.page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/inventaris/barang/nama/${nama}?page=${pagination.page - 1}${lokasiFilter ? `&lokasi=${encodeURIComponent(lokasiFilter)}` : ''}`}>‹ Sebelumnya</Link>
              </Button>
            )}
            {pagination.page < pagination.total_pages && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/inventaris/barang/nama/${nama}?page=${pagination.page + 1}${lokasiFilter ? `&lokasi=${encodeURIComponent(lokasiFilter)}` : ''}`}>Berikutnya ›</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
