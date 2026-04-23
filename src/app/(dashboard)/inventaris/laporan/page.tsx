'use client'

// =============================================================================
// app/(dashboard)/inventaris/laporan/page.tsx
// Laporan inventaris — export Excel / PDF
// =============================================================================

import { useState, useTransition } from 'react'
import { FileSpreadsheet, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { getInventaris } from '@/lib/actions/inventaris-actions'
import { getMutasi } from '@/lib/actions/mutasi-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { INVENTARIS_KATEGORI } from '@/lib/constants'

type ReportType = 'barang' | 'mutasi' | 'peminjaman'

export default function LaporanInventarisPage() {
  const [isPending, startTransition] = useTransition()
  const [reportType, setReportType] = useState<ReportType>('barang')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [kategori, setKategori] = useState('all')

  const handleExportCSV = () => {
    startTransition(async () => {
      try {
        let csvContent = ''
        const filename = `laporan_${reportType}_${dateTo}.csv`

        if (reportType === 'barang') {
          const { data } = await getInventaris({ kategori: kategori !== 'all' ? kategori as never : undefined }, 1, 10000)
          const headers = ['Kode Barang', 'Nama Barang', 'Kategori', 'Merk', 'Stok', 'Satuan', 'Kondisi', 'Lokasi', 'Tgl Perolehan', 'Nilai Perolehan']
          const rows = data.map(d => [
            d.kode_barang, d.nama_barang, d.kategori, d.merk ?? '', d.jumlah_stok, d.satuan,
            d.kondisi, d.lokasi_penempatan, d.tanggal_perolehan, d.nilai_perolehan ?? ''
          ])
          csvContent = [headers, ...rows].map(r => r.join(',')).join('\n')
        } else if (reportType === 'mutasi') {
          const { data } = await getMutasi({ date_from: dateFrom || undefined, date_to: dateTo }, 1, 10000)
          const headers = ['Tanggal', 'Kode Barang', 'Nama Barang', 'Jenis', 'Jumlah', 'Stok Sebelum', 'Stok Sesudah', 'Keterangan']
          const rows = data.map(d => [
            d.tanggal, d.inventaris?.kode_barang ?? '', d.inventaris?.nama_barang ?? '',
            d.jenis_mutasi, d.jumlah, d.stok_sebelum, d.stok_sesudah, `"${d.keterangan}"`
          ])
          csvContent = [headers, ...rows].map(r => r.join(',')).join('\n')
        }

        const bom = '\uFEFF'
        const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = filename
        link.click()
        URL.revokeObjectURL(link.href)
        toast.success('Laporan berhasil diunduh!')
      } catch {
        toast.error('Gagal membuat laporan')
      }
    })
  }

  const handleExportPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF({ orientation: 'landscape' })
      doc.setFontSize(14)
      doc.text('Laporan Inventaris — Yayasan Assakinah Sejahtera', 14, 14)
      doc.setFontSize(10)
      doc.text(`Tanggal: ${dateTo} | Jenis: ${reportType}`, 14, 21)

      if (reportType === 'barang') {
        const { data } = await getInventaris({ kategori: kategori !== 'all' ? kategori as never : undefined }, 1, 10000)
        autoTable(doc, {
          startY: 28,
          head: [['Kode', 'Nama Barang', 'Kategori', 'Stok', 'Satuan', 'Kondisi', 'Lokasi']],
          body: data.map(d => [d.kode_barang, d.nama_barang, d.kategori, d.jumlah_stok, d.satuan, d.kondisi, d.lokasi_penempatan]),
          styles: { fontSize: 8 },
        })
      } else if (reportType === 'mutasi') {
        const { data } = await getMutasi({ date_from: dateFrom || undefined, date_to: dateTo }, 1, 10000)
        autoTable(doc, {
          startY: 28,
          head: [['Tanggal', 'Barang', 'Jenis', 'Jumlah', 'Stok Sblm', 'Stok Ssdh', 'Keterangan']],
          body: data.map(d => [d.tanggal, d.inventaris?.nama_barang ?? '', d.jenis_mutasi, d.jumlah, d.stok_sebelum, d.stok_sesudah, d.keterangan.slice(0, 40)]),
          styles: { fontSize: 8 },
        })
      }

      doc.save(`laporan_${reportType}_${dateTo}.pdf`)
      toast.success('PDF berhasil diunduh!')
    } catch {
      toast.error('Gagal membuat PDF')
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Laporan Inventaris</h1>
        <p className="text-muted-foreground text-sm">Export data inventaris ke CSV atau PDF</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Konfigurasi Laporan</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Jenis Laporan</Label>
            <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="barang">Data Barang (semua inventaris)</SelectItem>
                <SelectItem value="mutasi">Mutasi Barang</SelectItem>
                <SelectItem value="peminjaman">Peminjaman Barang</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reportType === 'barang' && (
            <div className="space-y-2">
              <Label>Filter Kategori</Label>
              <Select value={kategori} onValueChange={setKategori}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {Object.entries(INVENTARIS_KATEGORI).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {reportType !== 'barang' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dari Tanggal</Label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Sampai Tanggal</Label>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" onClick={handleExportCSV} disabled={isPending} className="h-20 flex-col gap-2">
          <FileSpreadsheet className="h-6 w-6 text-green-600" />
          <span>Export CSV<br /><span className="text-xs text-muted-foreground">Excel Compatible</span></span>
        </Button>
        <Button variant="outline" onClick={handleExportPDF} disabled={isPending} className="h-20 flex-col gap-2">
          <FileText className="h-6 w-6 text-red-600" />
          <span>Export PDF<br /><span className="text-xs text-muted-foreground">Siap Cetak</span></span>
        </Button>
      </div>
    </div>
  )
}
