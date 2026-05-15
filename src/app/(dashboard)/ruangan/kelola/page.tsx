// =============================================================================
// app/(dashboard)/ruangan/kelola/page.tsx
// Manajemen CRUD ruangan — Sarana & Admin
// =============================================================================

import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, Pencil, Building2, AlertTriangle } from 'lucide-react'
import { getRuangan } from '@/lib/actions/ruangan-actions'
import { getCurrentUser } from '@/lib/actions/user-actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RUANGAN_STATUS } from '@/lib/constants'
import { DeleteRuanganButton } from './delete-button'
import { ImportRuanganButton } from './import-button'
import { ExportPDFButton } from './export-pdf-button'
import type { PaginatedResult, Ruangan } from '@/lib/types'

export const metadata: Metadata = { title: 'Data Ruangan | ASPRA' }
export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>
}

export default async function KelolaRuanganPage({ searchParams }: Props) {
  const profile = await getCurrentUser()
  if (!profile || (profile.role !== 'sarana' && profile.role !== 'admin')) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          <h2 className="font-bold text-lg mb-2">Akses Ditolak</h2>
          <p>Halaman ini khusus untuk Sarana atau Admin.</p>
          <p className="mt-2 text-sm font-mono bg-red-100 p-2 rounded">
            Role terdeteksi: {profile?.role || 'null'}
          </p>
        </div>
      </div>
    )
  }


  const params = await searchParams
  const page = Number(params.page ?? 1)

  let result: PaginatedResult<Ruangan>
  let fetchError: string | null = null

  try {
    result = await getRuangan({ page, search: params.search, status: params.status })
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Gagal memuat data ruangan'
    result = { data: [], pagination: { page: 1, per_page: 20, total: 0, total_pages: 0 } }
  }

  const { data: ruanganList, pagination } = result

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Data Ruangan</h1>
          <p className="text-muted-foreground text-sm">{pagination.total} ruangan terdaftar</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          <ExportPDFButton />
          <ImportRuanganButton />
          <Button asChild>
            <Link href="/ruangan/kelola/baru"><Plus className="h-4 w-4 mr-2" />Tambah Ruangan</Link>
          </Button>
        </div>
      </div>

      {fetchError && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">Error: {fetchError}</p>
        </div>
      )}

      {ruanganList.length === 0 && !fetchError ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Belum ada ruangan terdaftar</p>
          <Button asChild className="mt-4"><Link href="/ruangan/kelola/baru">Tambah Ruangan Pertama</Link></Button>
        </div>
      ) : (
        <>
          {/* Desktop: tabel */}
          <div className="hidden md:block rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nama Ruangan</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Lokasi</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kapasitas</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fasilitas</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ruanganList.map(r => {
                    const statusConfig = RUANGAN_STATUS[r.status] ?? { label: r.status, color: '#000', bgColor: '#eee' }
                    const fasilitas: string[] = Array.isArray(r.fasilitas)
                      ? r.fasilitas
                      : typeof r.fasilitas === 'string'
                        ? (() => { try { return JSON.parse(r.fasilitas) } catch { return [] } })()
                        : []
                    return (
                      <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{r.nama_ruangan}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.lokasi_gedung}{r.lantai ? ` Lt. ${r.lantai}` : ''}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.kapasitas} org</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {fasilitas.slice(0, 3).map((f: string) => (
                              <Badge key={f} variant="outline" className="text-[10px]">{f}</Badge>
                            ))}
                            {fasilitas.length > 3 && (
                              <Badge variant="outline" className="text-[10px]">+{fasilitas.length - 3}</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge style={{ background: statusConfig.bgColor, color: statusConfig.color, border: 'none' }}>
                            {statusConfig.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/ruangan/kelola/${r.id}`}><Pencil className="h-3.5 w-3.5" /></Link>
                            </Button>
                            <DeleteRuanganButton id={r.id} nama={r.nama_ruangan} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile: kartu */}
          <div className="md:hidden space-y-3">
            {ruanganList.map(r => {
              const statusConfig = RUANGAN_STATUS[r.status] ?? { label: r.status, color: '#000', bgColor: '#eee' }
              const fasilitas: string[] = Array.isArray(r.fasilitas)
                ? r.fasilitas
                : typeof r.fasilitas === 'string'
                  ? (() => { try { return JSON.parse(r.fasilitas) } catch { return [] } })()
                  : []
              return (
                <div key={r.id} className="border rounded-xl p-4 bg-card space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-tight">{r.nama_ruangan}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.lokasi_gedung}{r.lantai ? ` · Lt. ${r.lantai}` : ''} · {r.kapasitas} org
                      </p>
                    </div>
                    <Badge style={{ background: statusConfig.bgColor, color: statusConfig.color, border: 'none' }} className="shrink-0 text-xs">
                      {statusConfig.label}
                    </Badge>
                  </div>
                  {fasilitas.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {fasilitas.slice(0, 4).map((f: string) => (
                        <Badge key={f} variant="outline" className="text-[10px]">{f}</Badge>
                      ))}
                      {fasilitas.length > 4 && (
                        <Badge variant="outline" className="text-[10px]">+{fasilitas.length - 4}</Badge>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2 pt-1 border-t">
                    <Button size="sm" variant="outline" asChild className="flex-1">
                      <Link href={`/ruangan/kelola/${r.id}`}>
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />Edit
                      </Link>
                    </Button>
                    <DeleteRuanganButton id={r.id} nama={r.nama_ruangan} />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">Halaman {pagination.page} dari {pagination.total_pages}</p>
          <div className="flex gap-2">
            {pagination.page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/ruangan/kelola?page=${pagination.page - 1}`}>‹ Sebelumnya</Link>
              </Button>
            )}
            {pagination.page < pagination.total_pages && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/ruangan/kelola?page=${pagination.page + 1}`}>Berikutnya ›</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
