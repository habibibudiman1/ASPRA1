// =============================================================================
// app/api/inventaris/template/route.ts
// Template Excel untuk import data barang inventaris
// =============================================================================

import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  // ── Contoh data ────────────────────────────────────────────────────────────
  const contoh = [
    {
      'Nama Barang':         'Laptop HP Pavilion',
      'Kategori':            'elektronik',
      'Jumlah Stok':         5,
      'Satuan':              'unit',
      'Kondisi':             'baik',
      'Lokasi Penempatan':   'Ruang IT',
      'Merk':                'HP',
      'Tipe / Model':        'Pavilion 15',
      'Tanggal Perolehan':   '2024-01-15',
      'Nilai Perolehan (Rp)': 8500000,
      'Sumber Dana':         'DIPA',
      'Catatan':             '',
    },
    {
      'Nama Barang':         'Kursi Kantor Ergonomis',
      'Kategori':            'furniture',
      'Jumlah Stok':         20,
      'Satuan':              'buah',
      'Kondisi':             'baik',
      'Lokasi Penempatan':   'Ruang Rapat Utama',
      'Merk':                '',
      'Tipe / Model':        '',
      'Tanggal Perolehan':   '2023-06-01',
      'Nilai Perolehan (Rp)': 750000,
      'Sumber Dana':         'Anggaran Yayasan',
      'Catatan':             '',
    },
    {
      'Nama Barang':         'Kertas HVS A4 80 gsm',
      'Kategori':            'atk',
      'Jumlah Stok':         50,
      'Satuan':              'rim',
      'Kondisi':             'baik',
      'Lokasi Penempatan':   'Gudang ATK',
      'Merk':                'PaperOne',
      'Tipe / Model':        '',
      'Tanggal Perolehan':   '2024-03-01',
      'Nilai Perolehan (Rp)': 45000,
      'Sumber Dana':         '',
      'Catatan':             'Stok cadangan',
    },
  ]

  const ws = XLSX.utils.json_to_sheet(contoh)
  ws['!cols'] = [
    { wch: 30 }, // Nama Barang
    { wch: 16 }, // Kategori
    { wch: 14 }, // Jumlah Stok
    { wch: 10 }, // Satuan
    { wch: 14 }, // Kondisi
    { wch: 26 }, // Lokasi
    { wch: 16 }, // Merk
    { wch: 18 }, // Tipe/Model
    { wch: 20 }, // Tanggal
    { wch: 22 }, // Nilai
    { wch: 20 }, // Sumber Dana
    { wch: 24 }, // Catatan
  ]

  // ── Sheet Panduan ──────────────────────────────────────────────────────────
  const panduan = [
    { Kolom: 'Nama Barang',          Wajib: 'Ya',  Keterangan: 'Nama barang inventaris',                                      Contoh: 'Laptop HP Pavilion' },
    { Kolom: 'Kategori',             Wajib: 'Ya',  Keterangan: 'elektronik | furniture | atk | kendaraan | alat_olahraga | alat_lab | lainnya', Contoh: 'elektronik' },
    { Kolom: 'Jumlah Stok',          Wajib: 'Ya',  Keterangan: 'Angka ≥ 0',                                                  Contoh: '5' },
    { Kolom: 'Satuan',               Wajib: 'Ya',  Keterangan: 'unit | buah | set | lembar | rim | pack | lusin | box | roll | meter | liter | kg | pasang', Contoh: 'unit' },
    { Kolom: 'Kondisi',              Wajib: 'Tidak', Keterangan: 'baik | rusak_ringan | rusak_berat  (default: baik)',        Contoh: 'baik' },
    { Kolom: 'Lokasi Penempatan',    Wajib: 'Ya',  Keterangan: 'Nama lokasi / ruangan tempat barang disimpan',               Contoh: 'Ruang IT' },
    { Kolom: 'Merk',                 Wajib: 'Tidak', Keterangan: 'Nama merk / brand',                                       Contoh: 'HP' },
    { Kolom: 'Tipe / Model',         Wajib: 'Tidak', Keterangan: 'Tipe atau seri model',                                    Contoh: 'Pavilion 15' },
    { Kolom: 'Tanggal Perolehan',    Wajib: 'Tidak', Keterangan: 'Format YYYY-MM-DD  (default: tanggal hari ini)',           Contoh: '2024-01-15' },
    { Kolom: 'Nilai Perolehan (Rp)', Wajib: 'Tidak', Keterangan: 'Angka, tanpa titik/koma pemisah ribuan',                  Contoh: '8500000' },
    { Kolom: 'Sumber Dana',          Wajib: 'Tidak', Keterangan: 'Asal sumber dana pembelian',                              Contoh: 'DIPA' },
    { Kolom: 'Catatan',              Wajib: 'Tidak', Keterangan: 'Catatan tambahan',                                         Contoh: 'Stok cadangan' },
  ]
  const wsPanduan = XLSX.utils.json_to_sheet(panduan)
  wsPanduan['!cols'] = [{ wch: 24 }, { wch: 8 }, { wch: 74 }, { wch: 22 }]

  // ── Workbook ───────────────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Data Barang')
  XLSX.utils.book_append_sheet(wb, wsPanduan, 'Panduan')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template_import_barang.xlsx"',
    },
  })
}
