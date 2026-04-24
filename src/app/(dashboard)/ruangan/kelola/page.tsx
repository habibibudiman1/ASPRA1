// =============================================================================
// app/(dashboard)/ruangan/kelola/page.tsx
// Manajemen CRUD ruangan — Admin only
// =============================================================================

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, Pencil, Building2 } from 'lucide-react'
import { getRuangan } from '@/lib/actions/ruangan-actions'
import { getCurrentUser } from '@/lib/actions/user-actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { RUANGAN_STATUS } from '@/lib/constants'
import { DeleteRuanganButton } from './delete-button'

export const metadata: Metadata = { title: 'Kelola Ruangan | Assakinah IT' }
export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>
}

export default async function KelolaRuanganPage({ searchParams }: Props) {
  const profile = await getCurrentUser()
  if (!profile || profile.role !== 'admin') redirect('/ruangan')

  const params = await searchParams
  const page = Number(params.page ?? 1)

  const { data: ruanganList, pagination } = await getRuangan({
    page,
    search: params.search,
    status: params.status,
  })

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Kelola Ruangan</h1>
          <p className="text-muted-foreground text-sm">{pagination.total} ruangan terdaftar</p>
        </div>
        <Button asChild className="flex-shrink-0">
          <Link href="/ruangan/kelola/baru"><Plus className="h-4 w-4 mr-2" />Tambah Ruangan</Link>
        </Button>
      </div>

      {ruanganList.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Belum ada ruangan terdaftar</p>
          <Button asChild className="mt-4"><Link href="/ruangan/kelola/baru">Tambah Ruangan Pertama</Link></Button>
        </div>
      ) : (
        <div className="space-y-3">
          {ruanganList.map(r => {
            const statusConfig = RUANGAN_STATUS[r.status]
            return (
              <Card key={r.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{r.nama_ruangan}</h3>
                        <Badge style={{ background: statusConfig.bgColor, color: statusConfig.color, border: 'none' }}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {r.lokasi_gedung}{r.lantai ? ` · Lantai ${r.lantai}` : ''} · Kapasitas {r.kapasitas} orang
                      </p>
                      <div className="flex gap-1.5 flex-wrap">
                        {r.fasilitas.slice(0, 4).map(f => (
                          <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                        ))}
                        {r.fasilitas.length > 4 && (
                          <Badge variant="outline" className="text-xs">+{r.fasilitas.length - 4}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/ruangan/kelola/${r.id}`}><Pencil className="h-3.5 w-3.5" /></Link>
                      </Button>
                      <DeleteRuanganButton id={r.id} nama={r.nama_ruangan} />
                    </div>
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
