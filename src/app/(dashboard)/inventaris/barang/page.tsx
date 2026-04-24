// =============================================================================
// app/(dashboard)/inventaris/barang/page.tsx
// Daftar barang inventaris dengan search, filter, pagination
// =============================================================================

import type { Metadata } from 'next'
import Link from 'next/link'
import { Package, Plus, Search } from 'lucide-react'
import { getInventaris } from '@/lib/actions/inventaris-actions'
import { getCurrentUser } from '@/lib/actions/user-actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { INVENTARIS_KATEGORI, INVENTARIS_KONDISI } from '@/lib/constants'
import { formatRupiah } from '@/lib/utils'

export const metadata: Metadata = { title: 'Data Barang | Assakinah IT' }
export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ page?: string; search?: string; kategori?: string; kondisi?: string }>
}

export default async function DataBarangPage({ searchParams }: Props) {
  const params = await searchParams
  const profile = await getCurrentUser()
  const isSarana = profile?.role === 'sarana'
  const page = Number(params.page ?? 1)

  const { data: items, pagination } = await getInventaris(
    { search: params.search, kategori: params.kategori as never, kondisi: params.kondisi as never },
    page,
    20
  )

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Data Barang</h1>
          <p className="text-muted-foreground text-sm">{pagination.total} jenis barang terdaftar</p>
        </div>
        {isSarana && (
          <Button asChild><Link href="/inventaris/barang/baru"><Plus className="h-4 w-4 mr-2" />Tambah Barang</Link></Button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex gap-2 flex-wrap items-center">
        <form method="GET" className="flex gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input name="search" placeholder="Cari nama atau kode barang..." defaultValue={params.search} className="pl-9" />
          </div>
          <Button type="submit" variant="outline" size="sm">Cari</Button>
          {params.search && <Button variant="ghost" size="sm" asChild><Link href="/inventaris/barang">Reset</Link></Button>}
        </form>
      </div>

      {/* Filter kategori */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={!params.kategori ? 'default' : 'outline'} asChild>
          <Link href="/inventaris/barang">Semua</Link>
        </Button>
        {Object.entries(INVENTARIS_KATEGORI).map(([k, v]) => (
          <Button key={k} size="sm" variant={params.kategori === k ? 'default' : 'outline'} asChild>
            <Link href={`/inventaris/barang?kategori=${k}`}>{v.label}</Link>
          </Button>
        ))}
      </div>

      {/* Tabel */}
      {items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Tidak ada barang ditemukan</p>
          {isSarana && <Button className="mt-4" asChild><Link href="/inventaris/barang/baru">Tambah Barang</Link></Button>}
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kode</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nama Barang</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kategori</th>
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
                          <p className="font-medium">{item.nama_barang}</p>
                          {item.merk && <p className="text-xs text-muted-foreground">{item.merk} {item.tipe_model}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge style={{ background: kat?.color + '20', color: kat?.color, border: 'none' }}>
                          {kat?.label ?? item.kategori}
                        </Badge>
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
                      <td className="px-4 py-3 text-muted-foreground text-xs">{item.lokasi_penempatan}</td>
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
      )}

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">Halaman {pagination.page} dari {pagination.total_pages}</p>
          <div className="flex gap-2">
            {pagination.page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/inventaris/barang?page=${pagination.page - 1}&search=${params.search ?? ''}&kategori=${params.kategori ?? ''}`}>‹ Sebelumnya</Link>
              </Button>
            )}
            {pagination.page < pagination.total_pages && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/inventaris/barang?page=${pagination.page + 1}&search=${params.search ?? ''}&kategori=${params.kategori ?? ''}`}>Berikutnya ›</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
