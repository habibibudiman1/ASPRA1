'use client'

// =============================================================================
// components/inventaris/export-pdf-barang.tsx
// Export PDF barang: Semua barang, Per Lokasi, atau per nama barang (1 item)
// =============================================================================

import { useState, useRef, useEffect } from 'react'
import { FileDown, Loader2, ChevronDown, Package, LayoutList, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  getAllInventarisForExport,
  getInventarisByNamaForExport,
} from '@/lib/actions/export-inventaris-actions'
import { toast } from 'sonner'
import type { Inventaris } from '@/lib/types'

// ─── Warna brand ─────────────────────────────────────────────────────────────
const C = {
  brand:   [30, 58, 47]    as [number,number,number],
  white:   [255,255,255]   as [number,number,number],
  dark:    [17, 24, 39]    as [number,number,number],
  mid:     [75, 85, 99]    as [number,number,number],
  light:   [156,163,175]   as [number,number,number],
  green:   [22, 163, 74]   as [number,number,number],
  amber:   [217,119,6]     as [number,number,number],
  red:     [220, 38, 38]   as [number,number,number],
  rowAlt:  [248,250,252]   as [number,number,number],
  brandLt: [232,245,233]   as [number,number,number],
}

const KAT_LABEL: Record<string,string> = {
  elektronik:'Elektronik', furniture:'Furniture', atk:'ATK',
  kendaraan:'Kendaraan', alat_olahraga:'Alat Olahraga', alat_lab:'Alat Lab', lainnya:'Lainnya',
}
const KON_LABEL: Record<string,string> = { baik:'Baik', rusak_ringan:'Rusak Ringan', rusak_berat:'Rusak Berat' }
const KON_COLOR: Record<string,[number,number,number]> = {
  baik: C.green, rusak_ringan: C.amber, rusak_berat: C.red,
}

function rupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
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

type FilterParams = { kategori?: string; search?: string; kondisi?: string }

function drawHeaderAndFooter(doc: unknown, title: string, filters?: FilterParams) {
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
  
  if (filters?.kategori && filters.kategori !== 'all') pdf.text(`Filter Kategori: ${KAT_LABEL[filters.kategori] ?? filters.kategori}`, PW - 80, 26)
  if (filters?.search) pdf.text(`Pencarian: "${filters.search}"`, PW - 80, 33)

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

// ─── Generator PDF: Semua Barang (landscape) ──────────────────────────────────
async function generatePDFSemua(data: Inventaris[], filters: FilterParams) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const PW = doc.internal.pageSize.getWidth()

  const total     = data.length
  const totalUnit = data.reduce((s,r) => s + r.jumlah_stok, 0)
  const totalNilai= data.reduce((s,r) => s + (r.nilai_perolehan ?? 0) * r.jumlah_stok, 0)
  const baik      = data.filter(r => r.kondisi === 'baik').length
  const rusak     = data.filter(r => r.kondisi !== 'baik').length

  // Kartu Statistik
  const cards = [
    { label:'Total Jenis', value: String(total),                       color: C.brand },
    { label:'Total Unit',  value: String(totalUnit),                    color: [37,99,235] as [number,number,number] },
    { label:'Kondisi Baik',value: String(baik),                         color: C.green },
    { label:'Perlu Perhatian', value: String(rusak),                   color: C.amber },
    { label:'Est. Total Nilai', value: totalNilai > 0 ? rupiah(totalNilai) : '—', color: [139,92,246] as [number,number,number] },
  ]
  const cW = (PW - 20) / cards.length
  cards.forEach(({ label, value, color }, i) => {
    const x = 10 + i * cW
    doc.setFillColor(245,247,250); doc.roundedRect(x+0.5,48.5,cW-4,22,3,3,'F')
    doc.setFillColor(...C.white);  doc.roundedRect(x,48,cW-4,22,3,3,'F')
    doc.setFillColor(...color);    doc.roundedRect(x,48,3,22,1.5,1.5,'F')
    doc.setFont('helvetica','bold'); doc.setFontSize(value.length > 12 ? 9 : 16)
    doc.setTextColor(...color)
    doc.text(value, x+(cW-4)/2+1, 59, { align:'center' })
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...C.mid)
    doc.text(label.toUpperCase(), x+(cW-4)/2+1, 65.5, { align:'center' })
  })

  const tableTop = 78
  doc.setFont('helvetica','bold'); doc.setFontSize(9.5); doc.setTextColor(...C.dark)
  doc.text('DAFTAR LENGKAP BARANG', 10, tableTop - 3)
  doc.setDrawColor(...C.brand); doc.setLineWidth(0.5)
  doc.line(10, tableTop - 1.5, 70, tableTop - 1.5)

  autoTable(doc, {
    startY: tableTop,
    head: [['No','Kode','Nama Barang','Kategori','Merk / Tipe','Stok','Kondisi','Lokasi','Nilai Perolehan']],
    body: data.map((r, i) => [
      String(i + 1),
      r.kode_barang,
      r.nama_barang,
      KAT_LABEL[r.kategori] ?? r.kategori,
      [r.merk, r.tipe_model].filter(Boolean).join(' / ') || '—',
      `${r.jumlah_stok} ${r.satuan}`,
      KON_LABEL[r.kondisi] ?? r.kondisi,
      r.lokasi_penempatan,
      r.nilai_perolehan ? rupiah(r.nilai_perolehan) : '—',
    ]),
    theme: 'plain',
    styles: { font:'helvetica', fontSize:7.5, cellPadding:{top:2.5,right:3,bottom:2.5,left:3}, textColor:C.dark, lineColor:[226,232,240], lineWidth:0.3 },
    headStyles: { fillColor:C.brand, textColor:C.white, fontStyle:'bold', fontSize:7.5 },
    columnStyles: {
      0: { halign:'center', cellWidth:8, textColor:C.light },
      1: { cellWidth:24, fontSize:7, textColor:C.mid },
      2: { cellWidth:44, fontStyle:'bold' },
      3: { cellWidth:22 },
      4: { cellWidth:30, textColor:C.mid, fontSize:7 },
      5: { halign:'center', cellWidth:18 },
      6: { halign:'center', cellWidth:22 },
      7: { cellWidth:32, textColor:C.mid, fontSize:7 },
      8: { halign:'right', cellWidth:'auto', textColor:C.mid, fontSize:7 },
    },
    alternateRowStyles: { fillColor:C.rowAlt },
    didParseCell(d: AutoTableData) {
      if (d.section === 'body' && d.column.index === 6) {
        const raw = data[d.row.index]?.kondisi ?? 'baik'
        d.cell.styles.textColor = KON_COLOR[raw] ?? C.dark
        d.cell.styles.fontStyle = 'bold'
      }
    },
    foot: [[
      '', '', '', '', '',
      `${totalUnit} unit`, '', '',
      totalNilai > 0 ? rupiah(totalNilai) : '',
    ]],
    footStyles: { fillColor:C.brandLt, textColor:C.brand, fontStyle:'bold', fontSize:8 },
    margin: { left:10, right:10 },
  })

  drawHeaderAndFooter(doc, 'LAPORAN DATA BARANG INVENTARIS', filters)
  
  const now = new Date()
  const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
  doc.save(`Laporan_Barang_${ts}.pdf`)
}

// ─── Generator PDF: Per Lokasi (landscape, grouped) ──────────────────────────────────
async function generatePDFPerLokasi(data: Inventaris[], filters: FilterParams) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  
  // Grouping data by location
  const grouped: Record<string, Inventaris[]> = {}
  data.forEach(item => {
    const loc = item.lokasi_penempatan || 'Tanpa Lokasi'
    if (!grouped[loc]) grouped[loc] = []
    grouped[loc].push(item)
  })

  const sortedLocations = Object.keys(grouped).sort((a,b) => a.localeCompare(b))
  let currentY = 50

  sortedLocations.forEach((loc, index) => {
    const locData = grouped[loc]
    const locTotalUnit = locData.reduce((s,r) => s + r.jumlah_stok, 0)
    const locTotalNilai= locData.reduce((s,r) => s + (r.nilai_perolehan ?? 0) * r.jumlah_stok, 0)

    // Check if we need a new page for the title
    if (currentY > doc.internal.pageSize.getHeight() - 40 && index > 0) {
      doc.addPage()
      currentY = 50
    }

    doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...C.brand)
    doc.text(`Lokasi: ${loc}`, 10, currentY)
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...C.mid)
    doc.text(`${locData.length} jenis barang | ${locTotalUnit} total unit`, 10, currentY + 4)
    
    currentY += 8

    autoTable(doc, {
      startY: currentY,
      head: [['No','Kode','Nama Barang','Kategori','Merk / Tipe','Stok','Kondisi','Nilai Perolehan']],
      body: locData.map((r, i) => [
        String(i + 1),
        r.kode_barang,
        r.nama_barang,
        KAT_LABEL[r.kategori] ?? r.kategori,
        [r.merk, r.tipe_model].filter(Boolean).join(' / ') || '—',
        `${r.jumlah_stok} ${r.satuan}`,
        KON_LABEL[r.kondisi] ?? r.kondisi,
        r.nilai_perolehan ? rupiah(r.nilai_perolehan) : '—',
      ]),
      theme: 'plain',
      styles: { font:'helvetica', fontSize:7.5, cellPadding:{top:2.5,right:3,bottom:2.5,left:3}, textColor:C.dark, lineColor:[226,232,240], lineWidth:0.3 },
      headStyles: { fillColor:C.brand, textColor:C.white, fontStyle:'bold', fontSize:7.5 },
      columnStyles: {
        0: { halign:'center', cellWidth:8, textColor:C.light },
        1: { cellWidth:24, fontSize:7, textColor:C.mid },
        2: { cellWidth:60, fontStyle:'bold' },
        3: { cellWidth:26 },
        4: { cellWidth:36, textColor:C.mid, fontSize:7 },
        5: { halign:'center', cellWidth:20 },
        6: { halign:'center', cellWidth:26 },
        7: { halign:'right', cellWidth:'auto', textColor:C.mid, fontSize:7 },
      },
      alternateRowStyles: { fillColor:C.rowAlt },
      didParseCell(d: AutoTableData) {
        if (d.section === 'body' && d.column.index === 6) {
          const raw = locData[d.row.index]?.kondisi ?? 'baik'
          d.cell.styles.textColor = KON_COLOR[raw] ?? C.dark
          d.cell.styles.fontStyle = 'bold'
        }
      },
      foot: [[
        '', '', '', '', '',
        `${locTotalUnit} unit`, '',
        locTotalNilai > 0 ? rupiah(locTotalNilai) : '',
      ]],
      footStyles: { fillColor:C.brandLt, textColor:C.brand, fontStyle:'bold', fontSize:8 },
      margin: { left:10, right:10 },
    })
    
    currentY = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY) + 15
  })

  drawHeaderAndFooter(doc, 'LAPORAN BARANG PER LOKASI', filters)
  
  const now = new Date()
  const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
  doc.save(`Laporan_Barang_Per_Lokasi_${ts}.pdf`)
}

// ─── Generator PDF: Per Nama Barang (portrait, detail card) ──────────────────
async function generatePDFPerNama(namaBarang: string, data: Inventaris[]) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit:'mm', format:'a4' })
  const PW = doc.internal.pageSize.getWidth()
  
  const totalUnit  = data.reduce((s,r) => s + r.jumlah_stok, 0)
  const totalNilai = data.reduce((s,r) => s + (r.nilai_perolehan ?? 0) * r.jumlah_stok, 0)
  const katLabel   = KAT_LABEL[data[0]?.kategori ?? ''] ?? '—'

  // ── Info Card Barang ──
  doc.setFillColor(...C.brandLt); doc.roundedRect(10,48,PW-20,32,4,4,'F')
  doc.setDrawColor(...C.brand); doc.setLineWidth(0.4); doc.roundedRect(10,48,PW-20,32,4,4,'S')
  doc.setFillColor(...C.brand); doc.roundedRect(10,48,4,32,2,2,'F')

  doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(...C.brand)
  doc.text(namaBarang.toUpperCase(), 20, 59)
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...C.mid)
  doc.text(`Kategori: ${katLabel}`, 20, 67)
  doc.text(`${data.length} unit di ${new Set(data.map(r=>r.lokasi_penempatan)).size} lokasi`, 20, 74)

  // Mini stats
  const mStats = [
    { label:'Total Unit', value: String(totalUnit) },
    { label:'Kondisi Baik', value: String(data.filter(r=>r.kondisi==='baik').length) },
    { label:'Lokasi', value: String(new Set(data.map(r=>r.lokasi_penempatan)).size) },
    { label:'Total Nilai', value: totalNilai > 0 ? rupiah(totalNilai) : '—' },
  ]
  mStats.forEach(({ label, value }, i) => {
    const x = PW - 120 + i * 27
    doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(...C.brand)
    doc.text(value.length > 8 ? value.slice(0,8)+'…' : value, x, 60, { align:'center' })
    doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(...C.mid)
    doc.text(label.toUpperCase(), x, 66, { align:'center' })
  })

  // ── Tabel detail unit ──
  doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...C.dark)
  doc.text('DETAIL UNIT / LOT BARANG', 10, 88)
  doc.setDrawColor(...C.brand); doc.setLineWidth(0.4); doc.line(10,90,80,90)

  autoTable(doc, {
    startY: 92,
    head: [['No','Kode Barang','Merk / Tipe','Stok','Satuan','Kondisi','Lokasi','Tgl Perolehan','Nilai (Rp)','Catatan']],
    body: data.map((r,i) => [
      String(i+1),
      r.kode_barang,
      [r.merk, r.tipe_model].filter(Boolean).join(' / ') || '—',
      String(r.jumlah_stok),
      r.satuan,
      KON_LABEL[r.kondisi] ?? r.kondisi,
      r.lokasi_penempatan,
      r.tanggal_perolehan ? r.tanggal_perolehan.slice(0,10) : '—',
      r.nilai_perolehan ? `Rp ${r.nilai_perolehan.toLocaleString('id-ID')}` : '—',
      r.catatan || '—',
    ]),
    foot: [['','','','','Total','','','', totalNilai > 0 ? rupiah(totalNilai) : '', '']],
    theme: 'plain',
    styles: { font:'helvetica', fontSize:8, cellPadding:{top:3,right:3,bottom:3,left:3}, textColor:C.dark, lineColor:[226,232,240], lineWidth:0.3 },
    headStyles: { fillColor:C.brand, textColor:C.white, fontStyle:'bold', fontSize:7.5 },
    columnStyles: {
      0: { halign:'center', cellWidth:8, textColor:C.light },
      1: { cellWidth:26, fontSize:7.5, textColor:C.mid },
      2: { cellWidth:28, textColor:C.mid, fontSize:7.5 },
      3: { halign:'center', cellWidth:10 },
      4: { halign:'center', cellWidth:13 },
      5: { halign:'center', cellWidth:22 },
      6: { cellWidth:28, fontSize:7.5, textColor:C.mid },
      7: { halign:'center', cellWidth:22, textColor:C.mid, fontSize:7.5 },
      8: { halign:'right', cellWidth:24, textColor:C.mid, fontSize:7.5 },
      9: { cellWidth:'auto', textColor:C.light, fontSize:7 },
    },
    alternateRowStyles: { fillColor:C.rowAlt },
    footStyles: { fillColor:C.brandLt, textColor:C.brand, fontStyle:'bold', fontSize:8 },
    didParseCell(d: AutoTableData) {
      if (d.section === 'body' && d.column.index === 5) {
        const raw = data[d.row.index]?.kondisi ?? 'baik'
        d.cell.styles.textColor = KON_COLOR[raw] ?? C.dark
        d.cell.styles.fontStyle = 'bold'
      }
    },
    margin: { left:10, right:10 },
  })

  drawHeaderAndFooter(doc, 'LAPORAN DETAIL BARANG')

  const safeName = namaBarang.replace(/[^a-zA-Z0-9]/g, '_').slice(0,30)
  doc.save(`Barang_${safeName}.pdf`)
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  /** Nama barang jika mode "per barang" (dari halaman detail) */
  namaBarang?: string
  /** Filter saat ini di halaman Data Barang */
  filters?: { search?:string; kategori?:string; kondisi?:string }
}

// ─── Komponen ─────────────────────────────────────────────────────────────────
export function ExportPDFBarang({ namaBarang, filters }: Props) {
  const [open, setOpen]     = useState(false)
  const [loading, setLoading] = useState<'all'|'lokasi'|'unit'|null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function handleAll() {
    setOpen(false); setLoading('all')
    toast.info('Menyiapkan laporan semua barang...')
    try {
      const data = await getAllInventarisForExport(filters)
      if (!data.length) { toast.warning('Tidak ada data.'); return }
      await generatePDFSemua(data, filters ?? {})
      toast.success('Laporan PDF berhasil diunduh!')
    } catch (e) { console.error(e); toast.error('Gagal membuat PDF.') }
    finally { setLoading(null) }
  }

  async function handleLokasi() {
    setOpen(false); setLoading('lokasi')
    toast.info('Menyiapkan laporan per lokasi...')
    try {
      const data = await getAllInventarisForExport(filters)
      if (!data.length) { toast.warning('Tidak ada data.'); return }
      await generatePDFPerLokasi(data, filters ?? {})
      toast.success('Laporan PDF berhasil diunduh!')
    } catch (e) { console.error(e); toast.error('Gagal membuat PDF.') }
    finally { setLoading(null) }
  }

  async function handleUnit() {
    if (!namaBarang) return
    setOpen(false); setLoading('unit')
    toast.info(`Menyiapkan laporan "${namaBarang}"...`)
    try {
      const data = await getInventarisByNamaForExport(namaBarang)
      if (!data.length) { toast.warning('Tidak ada data.'); return }
      await generatePDFPerNama(namaBarang, data)
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
        onClick={() => setOpen(v => !v)}
        disabled={busy}
        id="btn-export-pdf-barang"
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
              <LayoutList className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-medium">Semua Barang</p>
              <p className="text-xs text-muted-foreground">Laporan daftar lengkap</p>
            </div>
          </button>

          <button
            onClick={handleLokasi}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
              <MapPin className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-medium">Per Lokasi</p>
              <p className="text-xs text-muted-foreground">Dikelompokkan lokasi</p>
            </div>
          </button>

          {namaBarang && (
            <>
              <div className="border-t mx-3 my-1" />
              <button
                onClick={handleUnit}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Package className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">Barang Ini Saja</p>
                  <p className="text-xs text-muted-foreground truncate max-w-32.5">{namaBarang}</p>
                </div>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
