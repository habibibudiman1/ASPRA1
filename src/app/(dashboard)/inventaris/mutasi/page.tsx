// =============================================================================
// app/(dashboard)/inventaris/mutasi/page.tsx
// Riwayat mutasi barang — audit trail
// =============================================================================

import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { getMutasi } from '@/lib/actions/mutasi-actions'
import { getCurrentUser } from '@/lib/actions/user-actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { JENIS_MUTASI } from '@/lib/constants'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export const metadata: Metadata = { title: 'Mutasi Barang | ASPRA' }
export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ page?: string; jenis?: string }>
}

export default async function MutasiBarangPage({ searchParams }: Props) {
  const params = await searchParams
  const profile = await getCurrentUser()
  const isSarana = profile?.role === 'sarana'
  const page = Number(params.page ?? 1)

  const { data: mutasiList, pagination } = await getMutasi(
    { jenis_mutasi: params.jenis as never },
    page,
    30
  )

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mutasi Barang</h1>
          <p className="text-muted-foreground text-sm">Riwayat perubahan stok &amp; kondisi barang</p>
        </div>
        {isSarana && (
          <Button asChild><Link href="/inventaris/mutasi/baru"><Plus className="h-4 w-4 mr-2" />Tambah Mutasi</Link></Button>
        )}
      </div>

      {/* Filter jenis */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={!params.jenis ? 'default' : 'outline'} asChild><Link href="/inventaris/mutasi">Semua</Link></Button>
        {Object.entries(JENIS_MUTASI).map(([k, v]) => (
          <Button key={k} size="sm" variant={params.jenis === k ? 'default' : 'outline'} asChild>
            <Link href={`/inventaris/mutasi?jenis=${k}`}>{v.label}</Link>
          </Button>
        ))}
      </div>

      {mutasiList.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>Belum ada riwayat mutasi</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tanggal</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Barang</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Jenis</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Jumlah</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stok</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Keterangan</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Oleh</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {mutasiList.map(m => {
                  const jenis = JENIS_MUTASI[m.jenis_mutasi]
                  const isIn = ['masuk', 'perbaikan'].includes(m.jenis_mutasi)
                  return (
                    <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(m.tanggal), 'd MMM yyyy', { locale: id })}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{m.inventaris?.nama_barang ?? '—'}</p>
                        <p className="text-xs text-muted-foreground font-mono">{m.inventaris?.kode_barang}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {isIn
                            ? <ArrowDownCircle className="h-3.5 w-3.5 text-green-500" />
                            : <ArrowUpCircle className="h-3.5 w-3.5 text-red-500" />
                          }
                          <span style={{ color: jenis?.color }} className="text-sm">{jenis?.label ?? m.jenis_mutasi}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        <span className={isIn ? 'text-green-600' : 'text-red-600'}>
                          {isIn ? '+' : '-'}{m.jumlah}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {m.stok_sebelum} → {m.stok_sesudah}
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="text-sm truncate" title={m.keterangan}>{m.keterangan}</p>
                        {m.dari_lokasi && <p className="text-xs text-muted-foreground">{m.dari_lokasi} → {m.ke_lokasi}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{(m.user as { full_name: string } | undefined)?.full_name ?? '—'}</td>
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
          <p className="text-sm text-muted-foreground">Halaman {pagination.page} dari {pagination.total_pages} ({pagination.total} total)</p>
          <div className="flex gap-2">
            {pagination.page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/inventaris/mutasi?jenis=${params.jenis ?? ''}&page=${pagination.page - 1}`}>‹ Sebelumnya</Link>
              </Button>
            )}
            {pagination.page < pagination.total_pages && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/inventaris/mutasi?jenis=${params.jenis ?? ''}&page=${pagination.page + 1}`}>Berikutnya ›</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
