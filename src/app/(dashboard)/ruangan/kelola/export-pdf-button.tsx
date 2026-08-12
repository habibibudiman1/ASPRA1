'use client'

// =============================================================================
// app/(dashboard)/ruangan/kelola/export-pdf-button.tsx
// Export laporan Data Ruangan ke PDF — template laporan premium
// =============================================================================

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAllRuanganForExport } from '@/lib/actions/export-ruangan-actions'
import { toast } from 'sonner'

const BRAND_COLOR        = [30, 58, 47]   as [number, number, number]  // #1E3A2F
const ACCENT_TERSEDIA    = [22, 163, 74]   as [number, number, number]  // green-600
const ACCENT_MAINTENANCE = [217, 119, 6]   as [number, number, number]  // amber-600
const ACCENT_TIDAK_AKTIF = [107, 114, 128] as [number, number, number]  // gray-500
const TEXT_DARK          = [17, 24, 39]    as [number, number, number]  // gray-900
const TEXT_MID           = [75, 85, 99]    as [number, number, number]  // gray-600
const TEXT_LIGHT         = [156, 163, 175] as [number, number, number]  // gray-400
const WHITE              = [255, 255, 255] as [number, number, number]
const ROW_ALT            = [248, 250, 252] as [number, number, number]  // slate-50

function statusColor(status: string): [number, number, number] {
  if (status === 'tersedia')    return ACCENT_TERSEDIA
  if (status === 'maintenance') return ACCENT_MAINTENANCE
  return ACCENT_TIDAK_AKTIF
}

function statusLabel(status: string) {
  if (status === 'tersedia')    return 'Tersedia'
  if (status === 'maintenance') return 'Maintenance'
  if (status === 'tidak_aktif') return 'Tidak Aktif'
  return status
}

export function ExportPDFButton() {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      // 1. Ambil semua data ruangan dari server
      const ruanganList = await getAllRuanganForExport()
      if (!ruanganList.length) {
        toast.warning('Tidak ada data ruangan untuk diekspor.')
        return
      }

      // 2. Dynamic import jsPDF (agar tidak bloat SSR bundle)
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const PW = doc.internal.pageSize.getWidth()   // 297
      const PH = doc.internal.pageSize.getHeight()  // 210

      // ── Hitung statistik ──────────────────────────────────────────────────
      const total      = ruanganList.length
      const tersedia   = ruanganList.filter(r => r.status === 'tersedia').length
      const maint      = ruanganList.filter(r => r.status === 'maintenance').length
      const nonaktif   = ruanganList.filter(r => r.status === 'tidak_aktif').length
      const totalKap   = ruanganList.reduce((s, r) => s + (r.kapasitas || 0), 0)
      const now        = new Date()
      const dateStr    = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      const timeStr    = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

      // ════════════════════════════════════════════════════════════════════
      // HALAMAN 1
      // ════════════════════════════════════════════════════════════════════

      // ── Background header bar ─────────────────────────────────────────
      doc.setFillColor(...BRAND_COLOR)
      doc.rect(0, 0, PW, 42, 'F')

      // ── Logo placeholder (inisial) ────────────────────────────────────
      doc.setFillColor(...WHITE)
      doc.roundedRect(10, 7, 28, 28, 4, 4, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(...BRAND_COLOR)
      doc.text('ASPRA', 24, 24.5, { align: 'center' })

      // ── Judul organisasi ──────────────────────────────────────────────
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(...WHITE)
      doc.text('LAPORAN DATA RUANGAN', 48, 18)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(200, 230, 210)
      doc.text('Yayasan Assakinah Sejahtera  ·  Sistem Informasi ASPRA', 48, 26)
      doc.text(`Dicetak: ${dateStr}, pukul ${timeStr}`, 48, 33)

      // Garis dekoratif hijau muda di bawah header
      doc.setFillColor(...ACCENT_TERSEDIA)
      doc.rect(0, 42, PW, 2, 'F')

      // ── Kartu statistik ringkasan ─────────────────────────────────────
      const cards = [
        { label: 'Total Ruangan',   value: String(total),   color: BRAND_COLOR,        icon: '■' },
        { label: 'Tersedia',        value: String(tersedia), color: ACCENT_TERSEDIA,    icon: '●' },
        { label: 'Maintenance',     value: String(maint),    color: ACCENT_MAINTENANCE, icon: '▲' },
        { label: 'Tidak Aktif',     value: String(nonaktif), color: ACCENT_TIDAK_AKTIF, icon: '◆' },
        { label: 'Total Kapasitas', value: `${totalKap.toLocaleString('id-ID')} org`, color: [37, 99, 235] as [number,number,number], icon: '▶' },
      ]

      const cardW   = (PW - 20) / cards.length
      const cardTop = 48

      cards.forEach(({ label, value, color }, i) => {
        const x = 10 + i * cardW
        // Shadow / background card
        doc.setFillColor(245, 247, 250)
        doc.roundedRect(x + 0.5, cardTop + 0.5, cardW - 4, 22, 3, 3, 'F')
        doc.setFillColor(...WHITE)
        doc.roundedRect(x, cardTop, cardW - 4, 22, 3, 3, 'F')
        // Aksen warna kiri
        doc.setFillColor(...color)
        doc.roundedRect(x, cardTop, 3, 22, 1.5, 1.5, 'F')

        // Nilai
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(18)
        doc.setTextColor(...color)
        doc.text(value, x + (cardW - 4) / 2 + 1, cardTop + 11, { align: 'center' })

        // Label
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(...TEXT_MID)
        doc.text(label.toUpperCase(), x + (cardW - 4) / 2 + 1, cardTop + 17.5, { align: 'center' })
      })

      // ── Subjudul tabel ────────────────────────────────────────────────
      const tableTop = cardTop + 28
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...TEXT_DARK)
      doc.text('DAFTAR LENGKAP RUANGAN', 10, tableTop - 3)

      // Garis bawah judul tabel
      doc.setDrawColor(...BRAND_COLOR)
      doc.setLineWidth(0.5)
      doc.line(10, tableTop - 1.5, 80, tableTop - 1.5)

      // ── Tabel utama ───────────────────────────────────────────────────
      const tableBody = ruanganList.map((r, idx) => {
        const fasilitas: string[] = Array.isArray(r.fasilitas)
          ? r.fasilitas
          : (() => { try { return JSON.parse(r.fasilitas as string) } catch { return [] } })()
        return [
          String(idx + 1),
          r.nama_ruangan,
          r.lokasi_gedung + (r.lantai ? `\nLt. ${r.lantai}` : ''),
          `${r.kapasitas} org`,
          fasilitas.join(', ') || '—',
          statusLabel(r.status),
          r.keterangan || '—',
        ]
      })

      autoTable(doc, {
        startY: tableTop,
        head: [['No', 'Nama Ruangan', 'Lokasi / Lantai', 'Kapasitas', 'Fasilitas', 'Status', 'Keterangan']],
        body: tableBody,
        theme: 'plain',
        styles: {
          font: 'helvetica',
          fontSize: 8.5,
          cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
          textColor: TEXT_DARK,
          lineColor: [226, 232, 240],
          lineWidth: 0.3,
          overflow: 'linebreak',
          minCellHeight: 10,
        },
        headStyles: {
          fillColor: BRAND_COLOR,
          textColor: WHITE,
          fontStyle: 'bold',
          fontSize: 8,
          cellPadding: { top: 4, right: 4, bottom: 4, left: 4 },
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10,  textColor: TEXT_LIGHT },
          1: { cellWidth: 48,  fontStyle: 'bold' },
          2: { cellWidth: 36 },
          3: { halign: 'center', cellWidth: 22 },
          4: { cellWidth: 68,  textColor: TEXT_MID, fontSize: 7.5 },
          5: { halign: 'center', cellWidth: 26 },
          6: { cellWidth: 'auto', textColor: TEXT_MID, fontSize: 7.5 },
        },
        alternateRowStyles: { fillColor: ROW_ALT },
        // Warnai kolom Status secara dinamis
        didParseCell(data: any) {
          if (data.section === 'body' && data.column.index === 5) {
            const raw = ruanganList[data.row.index]?.status ?? ''
            const col = statusColor(raw)
            data.cell.styles.textColor = col
            data.cell.styles.fontStyle = 'bold'
          }
        },
        // Tambah latar belakang ringan pada baris maintenance
        willDrawCell(data: any) {
          if (data.section === 'body') {
            const raw = ruanganList[data.row.index]?.status ?? ''
            if (raw === 'maintenance') {
              doc.setFillColor(255, 251, 235)  // amber-50
              doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F')
            }
          }
        },
        margin: { left: 10, right: 10 },
      })

      // ── Footer tiap halaman ───────────────────────────────────────────
      const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
      for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p)
        // Garis footer
        doc.setDrawColor(...BRAND_COLOR)
        doc.setLineWidth(0.4)
        doc.line(10, PH - 14, PW - 10, PH - 14)

        // Teks kiri
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(7)
        doc.setTextColor(...TEXT_LIGHT)
        doc.text('ASPRA — Sistem Informasi Yayasan Assakinah Sejahtera  |  Dokumen ini dicetak secara otomatis', 10, PH - 9)

        // Teks kanan — nomor halaman
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7.5)
        doc.setTextColor(...TEXT_MID)
        doc.text(`Hal. ${p} / ${pageCount}`, PW - 10, PH - 9, { align: 'right' })

        // Watermark tipis di tengah bawah
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(6.5)
        doc.setTextColor(200, 210, 200)
        doc.text('KONFIDENSIAL — HANYA UNTUK PENGGUNAAN INTERNAL', PW / 2, PH - 5, { align: 'center' })
      }

      // ── Simpan PDF ────────────────────────────────────────────────────
      const filename = `Laporan_Ruangan_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}.pdf`
      doc.save(filename)
      toast.success('Laporan PDF berhasil diunduh!')
    } catch (err) {
      console.error(err)
      toast.error('Gagal membuat laporan PDF.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={loading}
      id="btn-export-pdf-ruangan"
    >
      {loading
        ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Membuat PDF...</>
        : <><FileDown className="h-4 w-4 mr-1.5" />Export PDF</>
      }
    </Button>
  )
}
