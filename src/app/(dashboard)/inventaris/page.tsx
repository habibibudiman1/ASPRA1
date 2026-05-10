// =============================================================================
// app/(dashboard)/inventaris/page.tsx
// Dashboard Inventaris — Sarana & Admin
// =============================================================================

import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Package, TrendingUp, AlertTriangle, ShoppingCart,
  BarChart3, Clock, PackageCheck
} from 'lucide-react'
import { getDashboardInventaris } from '@/lib/actions/inventaris-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { INVENTARIS_KATEGORI, INVENTARIS_KONDISI } from '@/lib/constants'
import { formatRupiah } from '@/lib/utils'
import { DashboardInventarisCharts } from './charts-client'

export const metadata: Metadata = { title: 'Dashboard Inventaris | ASPRA' }
export const dynamic = 'force-dynamic'

function StatCard({ title, value, sub, icon: Icon, color, href }: {
  title: string; value: string | number; sub?: string; icon: React.ElementType; color: string; href?: string
}) {
  const inner = (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
  return href ? <Link href={href} className="block">{inner}</Link> : inner
}

export default async function DashboardInventarisPage() {
  const data = await getDashboardInventaris()

  const byKategoriWithLabel = data.byKategori.map(k => ({
    ...k,
    label: INVENTARIS_KATEGORI[k.kategori]?.label ?? k.kategori,
    color: INVENTARIS_KATEGORI[k.kategori]?.color ?? '#6b7280',
  }))

  const byKondisiWithLabel = data.byKondisi.map(k => ({
    ...k,
    label: INVENTARIS_KONDISI[k.kondisi]?.label ?? k.kondisi,
    color: INVENTARIS_KONDISI[k.kondisi]?.color ?? '#6b7280',
  }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Inventaris</h1>
          <p className="text-muted-foreground text-sm">Ringkasan aset dan peminjaman barang yayasan</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href="/inventaris/barang">Data Barang</Link></Button>
          <Button asChild><Link href="/inventaris/peminjaman/baru">Pinjam Barang</Link></Button>
        </div>
      </div>

      {/* Stats Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Jenis Barang" value={data.total_jenis_barang}
          icon={Package} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          href="/inventaris/barang" />
        <StatCard title="Total Unit" value={data.total_unit.toLocaleString('id-ID')}
          icon={BarChart3} color="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" />
        <StatCard title="Sedang Dipinjam" value={data.sedang_dipinjam_item}
          sub={`${data.sedang_dipinjam_unit} unit`}
          icon={ShoppingCart} color="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
          href="/inventaris/peminjaman" />
        <StatCard title="Total Nilai Aset"
          value={data.total_nilai_aset > 0 ? formatRupiah(data.total_nilai_aset) : '—'}
          icon={TrendingUp} color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" />
      </div>

      {/* Alerts */}
      {data.terlambat_count > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {data.terlambat_count} peminjaman terlambat dikembalikan
            </p>
          </div>
          <Button size="sm" variant="outline" className="border-red-300 text-red-700" asChild>
            <Link href="/inventaris/peminjaman?status=terlambat">Lihat</Link>
          </Button>
        </div>
      )}

      {data.stok_rendah_count > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            {data.stok_rendah_count}{' '}barang stok rendah (&lt;5 unit)
          </p>
        </div>
      )}

      {/* Charts */}
      <DashboardInventarisCharts byKategori={byKategoriWithLabel} byKondisi={byKondisiWithLabel} />

      {/* Terlambat list */}
      {data.terlambat.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-red-500" />
              Peminjaman Terlambat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.terlambat.slice(0, 5).map(({ peminjaman, daysLate }) => {
                const p = peminjaman as { id: string; inventaris: { nama_barang: string; satuan: string }; user: { full_name: string }; jumlah_dipinjam: number; tanggal_kembali_estimasi: string }
                return (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{p.inventaris.nama_barang}</p>
                      <p className="text-xs text-muted-foreground">{p.user.full_name} · {p.jumlah_dipinjam} {p.inventaris.satuan}</p>
                    </div>
                    <Badge className="bg-red-100 text-red-700 border-0">{daysLate} hari terlambat</Badge>
                  </div>
                )
              })}
            </div>
            {data.terlambat.length > 5 && (
              <Button variant="link" size="sm" asChild className="mt-2 px-0">
                <Link href="/inventaris/peminjaman?status=terlambat">Lihat semua ({data.terlambat.length})</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stok Rendah — grouped by nama_barang */}
      {data.stokRendah.length > 0 && (() => {
        const grouped = new Map<string, { kategori: string; satuan: string; totalStok: number; count: number }>()
        for (const item of data.stokRendah) {
          const existing = grouped.get(item.nama_barang)
          if (existing) {
            existing.totalStok += item.jumlah_stok
            existing.count += 1
          } else {
            grouped.set(item.nama_barang, { kategori: item.kategori, satuan: item.satuan, totalStok: item.jumlah_stok, count: 1 })
          }
        }
        const rows = Array.from(grouped.entries())
          .sort((a, b) => a[1].totalStok - b[1].totalStok)
          .slice(0, 8)

        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-amber-500" />
                Barang Stok Rendah
                <span className="ml-auto text-xs font-normal text-muted-foreground">{grouped.size} jenis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {rows.map(([nama, g]) => {
                  const kat = INVENTARIS_KATEGORI[g.kategori as keyof typeof INVENTARIS_KATEGORI]
                  return (
                    <div key={nama} className="flex items-center justify-between py-2.5 border-b last:border-0 gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: kat?.color ?? '#9ca3af' }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{nama}</p>
                          <p className="text-xs text-muted-foreground">{kat?.label ?? g.kategori}{g.count > 1 ? ` · ${g.count} lokasi` : ''}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-amber-700 border-amber-300 flex-shrink-0">
                        {g.totalStok} {g.satuan}
                      </Badge>
                    </div>
                  )
                })}
              </div>
              {grouped.size > 8 && (
                <Button variant="link" size="sm" asChild className="mt-2 px-0">
                  <Link href="/inventaris/barang">Lihat semua ({grouped.size} jenis)</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )
      })()}
    </div>
  )
}
