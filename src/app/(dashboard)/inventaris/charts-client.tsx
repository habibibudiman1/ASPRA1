'use client'

// =============================================================================
// app/(dashboard)/inventaris/charts-client.tsx
// Client component untuk chart di dashboard inventaris
// =============================================================================

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  byKategori: Array<{ kategori: string; label: string; color: string; jumlah_jenis: number; jumlah_unit: number }>
  byKondisi: Array<{ kondisi: string; label: string; color: string; jumlah: number }>
}

export function DashboardInventarisCharts({ byKategori, byKondisi }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Pie chart kondisi */}
      <Card>
        <CardHeader><CardTitle className="text-base">Kondisi Barang</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={byKondisi} dataKey="jumlah" nameKey="label" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                {byKondisi.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bar chart kategori */}
      <Card>
        <CardHeader><CardTitle className="text-base">Barang per Kategori</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byKategori} margin={{ left: -10, right: 10 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="jumlah_unit" name="Unit" radius={[4, 4, 0, 0]}>
                {byKategori.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
