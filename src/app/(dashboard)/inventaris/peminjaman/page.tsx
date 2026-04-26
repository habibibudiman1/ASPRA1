// =============================================================================
// app/(dashboard)/inventaris/peminjaman/page.tsx
// Daftar peminjaman barang — role-aware (Sarana bisa approve)
// =============================================================================

import type { Metadata } from 'next'
import Link from 'next/link'
import { ShoppingCart, Plus, Clock } from 'lucide-react'
import { getPeminjamanBarang } from '@/lib/actions/peminjaman-barang-actions'
import { getCurrentUser } from '@/lib/actions/user-actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PEMINJAMAN_BARANG_STATUS } from '@/lib/constants'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { PeminjamanBarangActions } from './actions-client'

export const metadata: Metadata = { title: 'Peminjaman Barang | ASPRA' }
export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ status?: string; page?: string }>
}

export default async function PeminjamanBarangPage({ searchParams }: Props) {
  const params = await searchParams
  const profile = await getCurrentUser()
  const isSarana = profile?.role === 'sarana'
  const isAdmin = profile?.role === 'it_admin' || profile?.role === 'admin'
  const page = Number(params.page ?? 1)

  const { data: peminjaman, pagination } = await getPeminjamanBarang(
    { status: params.status as never },
    page,
    20
  )

  const now = new Date()
  const today = now.toISOString().split('T')[0]

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Peminjaman Barang</h1>
          <p className="text-muted-foreground text-sm">
            {isSarana || isAdmin ? 'Semua peminjaman barang' : 'Peminjaman barang milik Anda'}
          </p>
        </div>
        <Button asChild>
          <Link href="/inventaris/peminjaman/baru"><Plus className="h-4 w-4 mr-2" />Pinjam Barang</Link>
        </Button>
      </div>

      {/* Filter status */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'menunggu', 'dipinjam', 'terlambat', 'dikembalikan'].map(s => (
          <Button key={s} size="sm" variant={params.status === s || (!params.status && s === 'all') ? 'default' : 'outline'} asChild>
            <Link href={`/inventaris/peminjaman?status=${s}`}>
              {s === 'all' ? 'Semua' : PEMINJAMAN_BARANG_STATUS[s as keyof typeof PEMINJAMAN_BARANG_STATUS]?.label ?? s}
            </Link>
          </Button>
        ))}
      </div>

      {peminjaman.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Tidak ada peminjaman</p>
          <Button className="mt-4" asChild><Link href="/inventaris/peminjaman/baru">Pinjam Barang</Link></Button>
        </div>
      ) : (
        <div className="space-y-3">
          {peminjaman.map((p) => {
            const statusConfig = PEMINJAMAN_BARANG_STATUS[p.status]
            const isLate = p.status === 'dipinjam' && p.tanggal_kembali_estimasi < today
            const daysLate = isLate
              ? Math.floor((now.getTime() - new Date(p.tanggal_kembali_estimasi).getTime()) / 86400000)
              : 0

            return (
              <Card key={p.id} className={p.status === 'terlambat' || isLate ? 'border-red-200 dark:border-red-800' : ''}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{p.inventaris?.nama_barang ?? '—'}</h3>
                        <Badge variant="outline" className="text-xs font-mono">{p.inventaris?.kode_barang}</Badge>
                        <Badge style={{ background: statusConfig?.bgColor, color: statusConfig?.color, border: 'none' }}>
                          {statusConfig?.label ?? p.status}
                        </Badge>
                        {isLate && daysLate > 0 && (
                          <Badge className="bg-red-100 text-red-700 border-0">{daysLate}h terlambat</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {p.jumlah_dipinjam} {p.inventaris?.satuan} · dipinjam {format(new Date(p.tanggal_pinjam), 'd MMM yyyy', { locale: id })}
                      </p>
                      <p className="text-sm flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                        Kembali estimasi: {format(new Date(p.tanggal_kembali_estimasi), 'd MMM yyyy', { locale: id })}
                      </p>
                      {(isSarana || isAdmin) && (
                        <p className="text-xs text-muted-foreground">Oleh: {p.user?.full_name}</p>
                      )}
                      {p.catatan_peminjam && (
                        <p className="text-xs text-muted-foreground">Catatan: {p.catatan_peminjam}</p>
                      )}
                      {p.catatan_sarana && (
                        <p className="text-xs bg-muted/50 px-2 py-1 rounded">📝 Sarana: {p.catatan_sarana}</p>
                      )}
                    </div>

                    {/* Actions — client component */}
                    <PeminjamanBarangActions peminjaman={p} isSarana={isSarana} isAdmin={isAdmin} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">Halaman {pagination.page} dari {pagination.total_pages}</p>
          <div className="flex gap-2">
            {pagination.page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/inventaris/peminjaman?status=${params.status ?? 'all'}&page=${pagination.page - 1}`}>‹ Sebelumnya</Link>
              </Button>
            )}
            {pagination.page < pagination.total_pages && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/inventaris/peminjaman?status=${params.status ?? 'all'}&page=${pagination.page + 1}`}>Berikutnya ›</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
