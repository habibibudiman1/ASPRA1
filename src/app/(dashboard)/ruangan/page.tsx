// =============================================================================
// app/(dashboard)/ruangan/page.tsx
// Dashboard Ruangan — realtime status semua ruangan
// =============================================================================

import type { Metadata } from 'next'
import { Building2, CalendarDays, CheckCircle2, Wrench, Clock, Users } from 'lucide-react'
import { getDashboardRuangan } from '@/lib/actions/ruangan-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard Ruangan | Assakinah IT' }

export const dynamic = 'force-dynamic'

function StatCard({ title, value, icon: Icon, color }: {
  title: string; value: number; icon: React.ElementType; color: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', color)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function DashboardRuanganPage() {
  const stats = await getDashboardRuangan()

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Ruangan</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Status ruangan realtime — {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link href="/ruangan/jadwal"><CalendarDays className="h-4 w-4 mr-1 sm:mr-2" /><span className="hidden sm:inline">Lihat </span>Jadwal</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/ruangan/booking"><span className="hidden sm:inline">Booking </span>Ruangan</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Ruangan"     value={stats.total_ruangan}     icon={Building2}     color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
        <StatCard title="Tersedia"           value={stats.tersedia}           icon={CheckCircle2}  color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" />
        <StatCard title="Sedang Dipakai"     value={stats.sedang_dipakai}     icon={Users}         color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" />
        <StatCard title="Maintenance"        value={stats.maintenance}        icon={Wrench}        color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
      </div>

      {/* Alert booking menunggu */}
      {stats.booking_menunggu > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800">
          <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {stats.booking_menunggu} booking menunggu persetujuan Sarana
            </p>
          </div>
          <Button size="sm" variant="outline" asChild className="border-amber-300 text-amber-700 hover:bg-amber-100">
            <Link href="/ruangan/approval">Lihat</Link>
          </Button>
        </div>
      )}

      {/* Daftar status ruangan */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Status Ruangan Saat Ini</h2>
        <div className="grid gap-3">
          {stats.ruanganStatus.map(({ ruangan, booking_aktif, booking_berikutnya }) => {
            const isActive = !!booking_aktif
            const isMaintenace = ruangan.status === 'maintenance'

            return (
              <Card key={ruangan.id} className={cn(
                'transition-all',
                isActive && 'border-red-200 dark:border-red-800',
                isMaintenace && 'border-amber-200 dark:border-amber-800 opacity-75'
              )}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{ruangan.nama_ruangan}</h3>
                        <Badge variant="outline" className="text-xs">
                          {ruangan.lokasi_gedung}{ruangan.lantai ? ` Lt.${ruangan.lantai}` : ''}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {ruangan.kapasitas} org
                        </Badge>
                      </div>

                      {isMaintenace ? (
                        <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">🔧 Sedang maintenance</p>
                      ) : isActive ? (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                          🔴 Dipakai oleh <strong>{(booking_aktif.user as { full_name: string }).full_name}</strong> — {booking_aktif.keperluan.slice(0, 50)} (s/d {booking_aktif.jam_selesai.slice(0, 5)})
                        </p>
                      ) : (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">🟢 Tersedia</p>
                      )}

                      {booking_berikutnya && !isActive && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Berikutnya: {booking_berikutnya.jam_mulai.slice(0, 5)} — {(booking_berikutnya.user as { full_name: string }).full_name}
                        </p>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      {isMaintenace ? (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">Maintenance</Badge>
                      ) : isActive ? (
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">Terpakai</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">Tersedia</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
