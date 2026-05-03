// =============================================================================
// app/(dashboard)/inventaris/barang/page.tsx
// Data Barang — pilih view: Flat List | Per Nama | Per Lokasi
// =============================================================================

import type { Metadata } from 'next'
import Link from 'next/link'
import { Package, Plus, Search, MapPin, List, LayoutGrid } from 'lucide-react'
import { getCurrentUser } from '@/lib/actions/user-actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { INVENTARIS_KATEGORI, INVENTARIS_KONDISI } from '@/lib/constants'
import { ImportBarang } from '@/components/inventaris/import-barang'
import {
  getInventaris,
  getInventarisGroupedByNama,
  getInventarisGroupedByLokasi,
} from '@/lib/actions/inventaris-actions'
import { formatRupiah } from '@/lib/utils'
import { ExportPDFButton } from '@/components/shared/export-pdf-button'

export const metadata: Metadata = { title: 'Data Barang | ASPRA' }
export const dynamic = 'force-dynamic'

type ViewMode = 'flat' | 'nama' | 'lokasi'

interface Props {
  searchParams: Promise<{
    page?: string
    search?: string
    kategori?: string
    kondisi?: string
    view?: string
  }>
}

export default async function DataBarangPage({ searchParams }: Props) {
  const params = await searchParams
  const profile = await getCurrentUser()
  const isSarana = profile?.role === 'sarana'
  const page = Number(params.page ?? 1)
  const view: ViewMode = (params.view as ViewMode) ?? 'nama'

  // Fetch sesuai view
  const [flatResult, groupedNama, groupedLokasi] = await Promise.all([
    view === 'flat'
      ? getInventaris(
          { search: params.search, kategori: params.kategori as never, kondisi: params.kondisi as never },
          page,
          20
        )
      : Promise.resolve({ data: [], pagination: { page: 1, per_page: 20, total: 0, total_pages: 0 } }),

    view === 'nama'
      ? getInventarisGroupedByNama({
          search: params.search,
          kategori: params.kategori as never,
          kondisi: params.kondisi,
        })
      : Promise.resolve([]),

    view === 'lokasi'
      ? getInventarisGroupedByLokasi({ search: params.search })
      : Promise.resolve([]),
  ])

  const buildUrl = (overrides: Record<string, string>) => {
    const p = { search: params.search ?? '', kategori: params.kategori ?? '', kondisi: params.kondisi ?? '', view, ...overrides }
    const qs = Object.entries(p)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&')
    return `/inventaris/barang${qs ? '?' + qs : ''}`
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Data Barang</h1>
          <p className="text-muted-foreground text-sm">
            {view === 'flat' && `${flatResult.pagination.total} item terdaftar`}
            {view === 'nama' && `${groupedNama.length} nama barang`}
            {view === 'lokasi' && `${groupedLokasi.length} lokasi`}
          </p>
        </div>
        {(isSarana || profile?.role === 'admin') && (
          <div className="flex gap-2">
            <ExportPDFButton type="inventaris" filters={{ search: params.search, kategori: params.kategori, kondisi: params.kondisi }} />
            <ImportBarang />
            <Button asChild>
              <Link href="/inventaris/barang/baru">
                <Plus className="h-4 w-4 mr-2" />Tambah Barang
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        <Link
          href={buildUrl({ view: 'nama', page: '1' })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            view === 'nama' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <LayoutGrid className="h-3.5 w-3.5" /> Per Nama
        </Link>
        <Link
          href={buildUrl({ view: 'lokasi', page: '1' })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            view === 'lokasi' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MapPin className="h-3.5 w-3.5" /> Per Lokasi
        </Link>
        <Link
          href={buildUrl({ view: 'flat', page: '1' })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            view === 'flat' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <List className="h-3.5 w-3.5" /> Semua Item
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2 flex-wrap items-center">
        <form method="GET" className="flex gap-2 flex-1 min-w-[200px]">
          <input type="hidden" name="view" value={view} />
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="search"
              placeholder={view === 'lokasi' ? 'Cari lokasi...' : 'Cari nama barang...'}
              defaultValue={params.search}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">Cari</Button>
          {params.search && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={buildUrl({ search: '', page: '1' })}>Reset</Link>
            </Button>
          )}
        </form>
      </div>

      {/* Filter Kategori & Kondisi — hanya untuk flat & nama */}
      {view !== 'lokasi' && (
        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant={!params.kategori ? 'default' : 'outline'} asChild>
              <Link href={buildUrl({ kategori: '', page: '1' })}>Semua Kategori</Link>
            </Button>
            {Object.entries(INVENTARIS_KATEGORI).map(([k, v]) => (
              <Button key={k} size="sm" variant={params.kategori === k ? 'default' : 'outline'} asChild>
                <Link href={buildUrl({ kategori: k, page: '1' })}>{v.label}</Link>
              </Button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant={!params.kondisi ? 'secondary' : 'outline'} asChild>
              <Link href={buildUrl({ kondisi: '', page: '1' })}>Semua Kondisi</Link>
            </Button>
            {Object.entries(INVENTARIS_KONDISI).map(([k, v]) => (
              <Button key={k} size="sm" variant={params.kondisi === k ? 'secondary' : 'outline'} asChild>
                <Link href={buildUrl({ kondisi: k, page: '1' })}>{v.label}</Link>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================
          VIEW: PER NAMA — Card Grid
          ================================================================ */}
      {view === 'nama' && (
        <>
          {groupedNama.length === 0 ? (
            <EmptyState isSarana={isSarana} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {groupedNama.map((group) => {
                const kat = INVENTARIS_KATEGORI[group.kategori]
                const kon = INVENTARIS_KONDISI[group.kondisi_utama]
                return (
                  <Link
                    key={group.nama_barang}
                    href={`/inventaris/barang/nama/${encodeURIComponent(group.nama_barang)}`}
                    className="group block rounded-lg border bg-card hover:shadow-md hover:border-primary/50 transition-all p-4 space-y-3"
                  >
                    {/* Icon + Kategori */}
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
                        style={{ background: (kat?.color ?? '#888') + '20' }}
                      >
                        <Package className="h-5 w-5" style={{ color: kat?.color ?? '#888' }} />
                      </div>
                      <Badge style={{ background: (kat?.color ?? '#888') + '20', color: kat?.color ?? '#888', border: 'none' }} className="text-xs">
                        {kat?.label ?? group.kategori}
                      </Badge>
                    </div>

                    {/* Nama */}
                    <div>
                      <p className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {group.nama_barang}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {group.total_jenis} variasi
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold ${group.total_unit < 5 ? 'text-amber-600' : 'text-foreground'}`}>
                        {group.total_unit} unit
                      </span>
                      <Badge style={{ background: kon?.bgColor, color: kon?.color, border: 'none' }} className="text-xs">
                        {kon?.label ?? group.kondisi_utama}
                      </Badge>
                    </div>

                    {/* Lokasi */}
                    <p className="text-xs text-muted-foreground truncate">
                      {group.lokasi_list.slice(0, 2).join(' · ')}
                      {group.lokasi_list.length > 2 && ` +${group.lokasi_list.length - 2} lokasi`}
                    </p>
                  </Link>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ================================================================
          VIEW: PER LOKASI
          ================================================================ */}
      {view === 'lokasi' && (
        <>
          {groupedLokasi.length === 0 ? (
            <EmptyState isSarana={isSarana} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedLokasi.map((loc) => (
                <Link
                  key={loc.lokasi}
                  href={`/inventaris/lokasi/${encodeURIComponent(loc.lokasi)}`}
                  className="group block rounded-lg border bg-card hover:shadow-md hover:border-primary/50 transition-all p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{loc.lokasi}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {loc.total_jenis} jenis · {loc.total_unit} unit
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {loc.kategori_list.slice(0, 3).map(k => {
                          const kat = INVENTARIS_KATEGORI[k]
                          return (
                            <span
                              key={k}
                              className="text-xs px-1.5 py-0.5 rounded"
                              style={{ background: kat?.color + '20', color: kat?.color }}
                            >
                              {kat?.label ?? k}
                            </span>
                          )
                        })}
                        {loc.kategori_list.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{loc.kategori_list.length - 3}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* ================================================================
          VIEW: FLAT LIST (Semua Item)
          ================================================================ */}
      {view === 'flat' && (
        <>
          {flatResult.data.length === 0 ? (
            <EmptyState isSarana={isSarana} />
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
                    {flatResult.data.map((item) => {
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
                              {(isSarana || profile?.role === 'admin') && (
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

          {/* Pagination (flat only) */}
          {flatResult.pagination.total_pages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Halaman {flatResult.pagination.page} dari {flatResult.pagination.total_pages}
              </p>
              <div className="flex gap-2">
                {flatResult.pagination.page > 1 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={buildUrl({ page: String(flatResult.pagination.page - 1) })}>‹ Sebelumnya</Link>
                  </Button>
                )}
                {flatResult.pagination.page < flatResult.pagination.total_pages && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={buildUrl({ page: String(flatResult.pagination.page + 1) })}>Berikutnya ›</Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function EmptyState({ isSarana }: { isSarana: boolean }) {
  return (
    <div className="text-center py-16 text-muted-foreground">
      <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
      <p>Tidak ada barang ditemukan</p>
      {isSarana && (
        <Button className="mt-4" asChild>
          <Link href="/inventaris/barang/baru">Tambah Barang</Link>
        </Button>
      )}
    </div>
  )
}
