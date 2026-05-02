// =============================================================================
// app/(dashboard)/inventaris/lokasi/[lokasi]/page.tsx
// Drilldown: semua barang di satu lokasi, dikelompokkan per nama
// =============================================================================

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Package } from 'lucide-react'
import { getInventarisGroupedByNama } from '@/lib/actions/inventaris-actions'
import { getCurrentUser } from '@/lib/actions/user-actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { INVENTARIS_KATEGORI, INVENTARIS_KONDISI } from '@/lib/constants'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ lokasi: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lokasi } = await params
  return { title: `${decodeURIComponent(lokasi)} | Lokasi Inventaris` }
}

export default async function DrilldownLokasiPage({ params }: Props) {
  const { lokasi } = await params
  const lokasiDecoded = decodeURIComponent(lokasi)

  const [groupedNama, profile] = await Promise.all([
    getInventarisGroupedByNama({ lokasi: lokasiDecoded }),
    getCurrentUser(),
  ])

  if (groupedNama.length === 0) notFound()

  const isSarana = profile?.role === 'sarana'
  const isAdmin = profile?.role === 'admin'

  const totalJenis = groupedNama.length
  const totalUnit = groupedNama.reduce((s, g) => s + g.total_unit, 0)

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/inventaris/barang?view=lokasi"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {lokasiDecoded}
          </h1>
          <p className="text-sm text-muted-foreground">
            {totalJenis} nama barang · {totalUnit} total unit
          </p>
        </div>
      </div>

      {/* Card Grid per Nama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {groupedNama.map((group) => {
          const kat = INVENTARIS_KATEGORI[group.kategori]
          const kon = INVENTARIS_KONDISI[group.kondisi_utama]
          return (
            <Link
              key={group.nama_barang}
              href={`/inventaris/barang/nama/${encodeURIComponent(group.nama_barang)}?lokasi=${encodeURIComponent(lokasiDecoded)}`}
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
                <Badge
                  style={{ background: (kat?.color ?? '#888') + '20', color: kat?.color ?? '#888', border: 'none' }}
                  className="text-xs"
                >
                  {kat?.label ?? group.kategori}
                </Badge>
              </div>

              {/* Nama */}
              <div>
                <p className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {group.nama_barang}
                </p>
                {group.total_jenis > 1 && (
                  <p className="text-xs text-muted-foreground mt-0.5">{group.total_jenis} variasi</p>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold ${group.total_unit < 5 ? 'text-amber-600' : 'text-foreground'}`}>
                  {group.total_unit} unit
                </span>
                <Badge
                  style={{ background: kon?.bgColor, color: kon?.color, border: 'none' }}
                  className="text-xs"
                >
                  {kon?.label ?? group.kondisi_utama}
                </Badge>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Tambah barang di lokasi ini (sarana/admin) */}
      {(isSarana || isAdmin) && (
        <div className="pt-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/inventaris/barang/baru?lokasi=${encodeURIComponent(lokasiDecoded)}`}>
              <Package className="h-4 w-4 mr-2" />
              Tambah Barang di Lokasi Ini
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
