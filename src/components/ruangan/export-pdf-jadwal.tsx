'use client'

// =============================================================================
// components/ruangan/export-pdf-jadwal.tsx
// Export PDF jadwal booking ruangan — sesuai style export-pdf-barang.tsx
// =============================================================================

import { useState, useRef, useEffect } from 'react'
import { FileDown, Loader2, ChevronDown, CalendarDays, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAllBookingForExport } from '@/lib/actions/export-booking-actions'
import { toast } from 'sonner'
import type { PeminjamanRuanganWithRelations, Ruangan } from '@/lib/types'

// ─── Warna brand (sama dengan export-pdf-barang) ─────────────────────────────
const C = {
  brand:   [30, 58, 47]    as [number,number,number],
  white:   [255,255,255]   as [number,number,number],
  dark:    [17, 24, 39]    as [number,number,number],
  mid:     [75, 85, 99]    as [number,number,number],
  light:   [156,163,175]   as [number,number,number],
  green:   [22, 163, 74]   as [number,number,number],
  amber:   [217,119,6]     as [number,number,number],
  red:     [220, 38, 38]   as [number,number,number],
  blue:    [37, 99, 235]   as [number,number,number],
  rowAlt:  [248,250,252]   as [number,number,number],
  brandLt: [232,245,233]   as [number,number,number],
}

const STATUS_LABEL: Record<string,string> = {
  menunggu: 'Menunggu', disetujui: 'Disetujui', ditolak: 'Ditolak',
  selesai: 'Selesai', dibatalkan: 'Dibatalkan',
}
const STATUS_COLOR: Record<string,[number,number,number]> = {
  menunggu: C.amber, disetujui: C.green, ditolak: C.red,
  selesai: C.mid, dibatalkan: C.light,
}

interface PDFDocHelper {
  internal: {
    pageSize: { getWidth: () => number; getHeight: () => number }
  }
  getNumberOfPages: () => number
  setFillColor: (...args: number[]) => void
  rect: (x: number, y: number, w: number, h: number, style?: string) => void
  roundedRect: (x: number, y: number, w: number, h: number, rx: number, ry: number, style?: string) => void
  setFont: (fontName: string, fontStyle?: string) => void
  setFontSize: (size: number) => void
  setTextColor: (...args: number[]) => void
  text: (text: string, x: number, y: number, options?: { align?: string }) => void
  setPage: (pageNumber: number) => void
  setDrawColor: (...args: number[]) => void
  setLineWidth: (width: number) => void
  line: (x1: number, y1: number, x2: number, y2: number) => void
}

interface AutoTableData {
  section: string
  column: { index: number }
  row: { index: number }
  cell: {
    styles: {
      textColor?: [number, number, number] | number[] | string
      fontStyle?: string
    }
  }
}

function drawHeaderAndFooter(doc: unknown, title: string, subtitle?: string) {
  const pdf = doc as PDFDocHelper
  const PW = pdf.internal.pageSize.getWidth()
  const PH = pdf.internal.pageSize.getHeight()
  const now = new Date()
  const dateStr = now.toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' })

  // ── Header ──
  pdf.setFillColor(...C.brand)
  pdf.rect(0, 0, PW, 42, 'F')
  pdf.setFillColor(...C.white)
  pdf.roundedRect(10, 7, 28, 28, 4, 4, 'F')
  pdf.setFont('helvetica','bold')
  pdf.setFontSize(12)
  pdf.setTextColor(...C.brand)
  pdf.text('ASPRA', 24, 24.5, { align:'center' })
  pdf.setFont('helvetica','bold')
  pdf.setFontSize(15)
  pdf.setTextColor(...C.white)
  pdf.text(title, 48, 18)
  pdf.setFont('helvetica','normal')
  pdf.setFontSize(8.5)
  pdf.setTextColor(200,230,210)
  pdf.text('Yayasan Assakinah Sejahtera  ·  Sistem Informasi ASPRA', 48, 26)
  pdf.text(`Dicetak: ${dateStr}, pukul ${now.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}`, 48, 33)

  if (subtitle) {
    pdf.setFontSize(8)
    pdf.text(subtitle, PW - 15, 33, { align: 'right' })
  }

  pdf.setFillColor(...C.green)
  pdf.rect(0, 42, PW, 2, 'F')

  // ── Footer ──
  const pages = pdf.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    pdf.setPage(p)
    pdf.setDrawColor(...C.brand); pdf.setLineWidth(0.4)
    pdf.line(10, PH-14, PW-10, PH-14)
    pdf.setFont('helvetica','italic'); pdf.setFontSize(7); pdf.setTextColor(...C.light)
    pdf.text('ASPRA — Sistem Informasi Yayasan Assakinah Sejahtera  |  Dokumen dicetak otomatis', 10, PH-9)
    pdf.setFont('helvetica','bold'); pdf.setFontSize(7.5); pdf.setTextColor(...C.mid)
    pdf.text(`Hal. ${p} / ${pages}`, PW-10, PH-9, { align:'right' })
    pdf.setFont('helvetica','normal'); pdf.setFontSize(6.5); pdf.setTextColor(200,210,200)
    pdf.text('KONFIDENSIAL — HANYA UNTUK PENGGUNAAN INTERNAL', PW/2, PH-5, { align:'center' })
  }
}

function formatTanggal(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })
}

// ─── Generator PDF: Semua Booking (landscape) ───────────────────────────────
async function generatePDFSemua(data: PeminjamanRuanganWithRelations[], ruanganNama?: string) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const PW = doc.internal.pageSize.getWidth()

  const total      = data.length
  const disetujui  = data.filter(r => r.status === 'disetujui').length
  const menunggu   = data.filter(r => r.status === 'menunggu').length
  const ditolak    = data.filter(r => r.status === 'ditolak').length
  const selesai    = data.filter(r => r.status === 'selesai').length

  // Kartu Statistik
  const cards = [
    { label:'Total Booking',   value: String(total),     color: C.brand },
    { label:'Disetujui',       value: String(disetujui),  color: C.green },
    { label:'Menunggu',        value: String(menunggu),    color: C.amber },
    { label:'Ditolak',         value: String(ditolak),     color: C.red },
    { label:'Selesai',         value: String(selesai),     color: C.mid },
  ]
  const cW = (PW - 20) / cards.length
  cards.forEach(({ label, value, color }, i) => {
    const x = 10 + i * cW
    doc.setFillColor(245,247,250); doc.roundedRect(x+0.5,48.5,cW-4,22,3,3,'F')
    doc.setFillColor(...C.white);  doc.roundedRect(x,48,cW-4,22,3,3,'F')
    doc.setFillColor(...color);    doc.roundedRect(x,48,3,22,1.5,1.5,'F')
    doc.setFont('helvetica','bold'); doc.setFontSize(16)
    doc.setTextColor(...color)
    doc.text(value, x+(cW-4)/2+1, 59, { align:'center' })
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...C.mid)
    doc.text(label.toUpperCase(), x+(cW-4)/2+1, 65.5, { align:'center' })
  })

  const tableTop = 78
  doc.setFont('helvetica','bold'); doc.setFontSize(9.5); doc.setTextColor(...C.dark)
  doc.text('DAFTAR BOOKING RUANGAN', 10, tableTop - 3)
  doc.setDrawColor(...C.brand); doc.setLineWidth(0.5)
  doc.line(10, tableTop - 1.5, 70, tableTop - 1.5)

  autoTable(doc, {
    startY: tableTop,
    head: [['No','Tanggal','Jam','Ruangan','Pemohon','Keperluan','Peserta','Status']],
    body: data.map((r, i) => [
      String(i + 1),
      formatTanggal(r.tanggal),
      `${r.jam_mulai.slice(0,5)} – ${r.jam_selesai.slice(0,5)}`,
      (r.ruangan as Ruangan)?.nama_ruangan ?? '—',
      (r.user as { full_name: string })?.full_name ?? '—',
      r.keperluan.length > 40 ? r.keperluan.slice(0, 40) + '…' : r.keperluan,
      r.jumlah_peserta ? String(r.jumlah_peserta) : '—',
      STATUS_LABEL[r.status] ?? r.status,
    ]),
    theme: 'plain',
    styles: { font:'helvetica', fontSize:7.5, cellPadding:{top:2.5,right:3,bottom:2.5,left:3}, textColor:C.dark, lineColor:[226,232,240], lineWidth:0.3 },
    headStyles: { fillColor:C.brand, textColor:C.white, fontStyle:'bold', fontSize:7.5 },
    columnStyles: {
      0: { halign:'center', cellWidth:8, textColor:C.light },
      1: { cellWidth:26 },
      2: { cellWidth:28, fontSize:7, textColor:C.mid },
      3: { cellWidth:34, fontStyle:'bold' },
      4: { cellWidth:36 },
      5: { cellWidth:'auto', textColor:C.mid, fontSize:7 },
      6: { halign:'center', cellWidth:16 },
      7: { halign:'center', cellWidth:22 },
    },
    alternateRowStyles: { fillColor:C.rowAlt },
    didParseCell(d: AutoTableData) {
      if (d.section === 'body' && d.column.index === 7) {
        const raw = data[d.row.index]?.status ?? 'menunggu'
        d.cell.styles.textColor = STATUS_COLOR[raw] ?? C.dark
        d.cell.styles.fontStyle = 'bold'
      }
    },
    margin: { left:10, right:10 },
  })

  const subtitle = ruanganNama ? `Ruangan: ${ruanganNama}` : undefined
  drawHeaderAndFooter(doc, 'LAPORAN JADWAL BOOKING RUANGAN', subtitle)

  const now = new Date()
  const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
  doc.save(`Laporan_Booking_Ruangan_${ts}.pdf`)
}

// ─── Generator PDF: Per Ruangan (landscape, grouped) ─────────────────────────
async function generatePDFPerRuangan(data: PeminjamanRuanganWithRelations[]) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // Grouping data by ruangan
  const grouped: Record<string, { nama: string; items: PeminjamanRuanganWithRelations[] }> = {}
  data.forEach(item => {
    const ruangan = item.ruangan as Ruangan
    const key = ruangan?.id ?? 'unknown'
    if (!grouped[key]) grouped[key] = { nama: ruangan?.nama_ruangan ?? 'Tanpa Ruangan', items: [] }
    grouped[key].items.push(item)
  })

  const sortedKeys = Object.keys(grouped).sort((a,b) => grouped[a].nama.localeCompare(grouped[b].nama))
  let currentY = 50

  sortedKeys.forEach((key, index) => {
    const group = grouped[key]
    const groupDisetujui = group.items.filter(r => r.status === 'disetujui').length
    const groupMenunggu  = group.items.filter(r => r.status === 'menunggu').length

    if (currentY > doc.internal.pageSize.getHeight() - 40 && index > 0) {
      doc.addPage()
      currentY = 50
    }

    doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...C.brand)
    doc.text(`Ruangan: ${group.nama}`, 10, currentY)
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...C.mid)
    doc.text(`${group.items.length} booking | ${groupDisetujui} disetujui | ${groupMenunggu} menunggu`, 10, currentY + 4)

    currentY += 8

    autoTable(doc, {
      startY: currentY,
      head: [['No','Tanggal','Jam','Pemohon','Keperluan','Peserta','Status']],
      body: group.items.map((r, i) => [
        String(i + 1),
        formatTanggal(r.tanggal),
        `${r.jam_mulai.slice(0,5)} – ${r.jam_selesai.slice(0,5)}`,
        (r.user as { full_name: string })?.full_name ?? '—',
        r.keperluan.length > 50 ? r.keperluan.slice(0, 50) + '…' : r.keperluan,
        r.jumlah_peserta ? String(r.jumlah_peserta) : '—',
        STATUS_LABEL[r.status] ?? r.status,
      ]),
      theme: 'plain',
      styles: { font:'helvetica', fontSize:7.5, cellPadding:{top:2.5,right:3,bottom:2.5,left:3}, textColor:C.dark, lineColor:[226,232,240], lineWidth:0.3 },
      headStyles: { fillColor:C.brand, textColor:C.white, fontStyle:'bold', fontSize:7.5 },
      columnStyles: {
        0: { halign:'center', cellWidth:8, textColor:C.light },
        1: { cellWidth:26 },
        2: { cellWidth:30, fontSize:7, textColor:C.mid },
        3: { cellWidth:40, fontStyle:'bold' },
        4: { cellWidth:'auto', textColor:C.mid, fontSize:7 },
        5: { halign:'center', cellWidth:18 },
        6: { halign:'center', cellWidth:24 },
      },
      alternateRowStyles: { fillColor:C.rowAlt },
      didParseCell(d: AutoTableData) {
        if (d.section === 'body' && d.column.index === 6) {
          const raw = group.items[d.row.index]?.status ?? 'menunggu'
          d.cell.styles.textColor = STATUS_COLOR[raw] ?? C.dark
          d.cell.styles.fontStyle = 'bold'
        }
      },
      margin: { left:10, right:10 },
    })

    currentY = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY) + 15
  })

  drawHeaderAndFooter(doc, 'LAPORAN BOOKING PER RUANGAN')

  const now = new Date()
  const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
  doc.save(`Laporan_Booking_Per_Ruangan_${ts}.pdf`)
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  /** Ruangan ID yang sedang dipilih di kalender */
  selectedRuanganId?: string
  /** Nama ruangan yang sedang dipilih */
  selectedRuanganNama?: string
}

// ─── Komponen ─────────────────────────────────────────────────────────────────
export function ExportPDFJadwal({ selectedRuanganId, selectedRuanganNama }: Props) {
  const [open, setOpen]     = useState(false)
  const [loading, setLoading] = useState<'all'|'ruangan'|'selected'|null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function handleAll() {
    setOpen(false); setLoading('all')
    toast.info('Menyiapkan laporan semua booking...')
    try {
      const data = await getAllBookingForExport()
      if (!data.length) { toast.warning('Tidak ada data booking.'); return }
      await generatePDFSemua(data)
      toast.success('Laporan PDF berhasil diunduh!')
    } catch (e) { console.error(e); toast.error('Gagal membuat PDF.') }
    finally { setLoading(null) }
  }

  async function handlePerRuangan() {
    setOpen(false); setLoading('ruangan')
    toast.info('Menyiapkan laporan per ruangan...')
    try {
      const data = await getAllBookingForExport()
      if (!data.length) { toast.warning('Tidak ada data booking.'); return }
      await generatePDFPerRuangan(data)
      toast.success('Laporan PDF berhasil diunduh!')
    } catch (e) { console.error(e); toast.error('Gagal membuat PDF.') }
    finally { setLoading(null) }
  }

  async function handleSelected() {
    if (!selectedRuanganId) return
    setOpen(false); setLoading('selected')
    toast.info(`Menyiapkan laporan "${selectedRuanganNama}"...`)
    try {
      const data = await getAllBookingForExport({ ruangan_id: selectedRuanganId })
      if (!data.length) { toast.warning('Tidak ada data booking untuk ruangan ini.'); return }
      await generatePDFSemua(data, selectedRuanganNama)
      toast.success('Laporan PDF berhasil diunduh!')
    } catch (e) { console.error(e); toast.error('Gagal membuat PDF.') }
    finally { setLoading(null) }
  }

  const busy = loading !== null

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((v: boolean) => !v)}
        disabled={busy}
        id="btn-export-pdf-jadwal"
      >
        {busy
          ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          : <FileDown className="h-4 w-4 mr-1.5" />}
        Export PDF
        <ChevronDown className={`h-3.5 w-3.5 ml-1 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-background border rounded-xl shadow-xl z-50 overflow-hidden py-1">
          <button
            onClick={handleAll}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
              <CalendarDays className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-medium">Semua Booking</p>
              <p className="text-xs text-muted-foreground">Laporan daftar lengkap</p>
            </div>
          </button>

          <button
            onClick={handlePerRuangan}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
              <Building2 className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-medium">Per Ruangan</p>
              <p className="text-xs text-muted-foreground">Dikelompokkan ruangan</p>
            </div>
          </button>

          {selectedRuanganId && (
            <>
              <div className="border-t mx-3 my-1" />
              <button
                onClick={handleSelected}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <CalendarDays className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">Ruangan Ini</p>
                  <p className="text-xs text-muted-foreground truncate max-w-32.5">{selectedRuanganNama}</p>
                </div>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
