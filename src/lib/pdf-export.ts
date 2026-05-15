import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatRupiah, formatDate } from './utils'
import type { Inventaris, TicketWithRelations } from './types'

// =============================================================================
// lib/pdf-export.ts
// Utilitas untuk export data ke PDF menggunakan jsPDF + autoTable
// =============================================================================

export function exportInventarisToPDF(data: Inventaris[], title: string) {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(18)
  doc.setTextColor(22, 163, 74) // Primary green
  doc.text('ASSYIFA IT INVENTORY REPORT', 14, 22)

  doc.setFontSize(11)
  doc.setTextColor(100)
  doc.text(title, 14, 30)
  doc.text(`Tanggal Export: ${formatDate(new Date().toISOString())}`, 14, 36)

  // Tabel Data
  const tableColumn = ["Kode", "Nama Barang", "Kategori", "Stok", "Lokasi", "Kondisi", "Nilai"]
  const tableRows: (string | number)[][] = []

  let totalNilai = 0

  data.forEach(item => {
    const rowData: (string | number)[] = [
      item.kode_barang,
      item.nama_barang,
      item.kategori,
      `${item.jumlah_stok} ${item.satuan}`,
      item.lokasi_penempatan,
      item.kondisi,
      item.nilai_perolehan ? formatRupiah(item.nilai_perolehan) : '-',
    ]
    totalNilai += item.nilai_perolehan ?? 0
    tableRows.push(rowData)
  })

  // Tambahkan baris total
  tableRows.push([
    '', '', '', '', '', 'Total Nilai Aset:', formatRupiah(totalNilai)
  ])

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 45,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    willDrawCell: (data) => {
      // Bold baris total
      if (data.row.index === tableRows.length - 1) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.textColor = [22, 163, 74]
      }
    }
  })

  // Footer
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
  doc.setFontSize(8)
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.text(
      `Halaman ${i} dari ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    )
  }

  doc.save(`Inventaris_${new Date().getTime()}.pdf`)
}

export function exportTicketsToPDF(data: TicketWithRelations[]) {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(18)
  doc.setTextColor(22, 163, 74)
  doc.text('ASSYIFA IT TICKET REPORT', 14, 22)

  doc.setFontSize(11)
  doc.setTextColor(100)
  doc.text(`Tanggal Export: ${formatDate(new Date().toISOString())}`, 14, 30)

  // Tabel Data
  const tableColumn = ["Tiket ID", "Judul", "Status", "Prioritas", "Kategori", "Dibuat Oleh", "Tanggal"]
  const tableRows: (string | number)[][] = []

  data.forEach(ticket => {
    const judul = ticket.title.length > 30 ? ticket.title.substring(0, 30) + '...' : ticket.title
    const rowData: (string | number)[] = [
      ticket.ticket_number,
      judul,
      ticket.status,
      ticket.priority,
      ticket.category?.name ?? '-',
      ticket.reporter?.full_name ?? '-',
      formatDate(ticket.created_at),
    ]
    tableRows.push(rowData)
  })

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 40,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] }
  })

  doc.save(`Tickets_${new Date().getTime()}.pdf`)
}
