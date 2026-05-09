// =============================================================================
// app/api/ruangan/template/route.ts
// API route untuk download template Excel import ruangan
// =============================================================================

import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  // ── Data contoh (2 baris) ────────────────────────────────────────────────
  const contohData = [
    {
      'Nama Ruangan': 'Aula Serbaguna',
      'Lokasi Gedung': 'Gedung A',
      'Lantai': 1,
      'Kapasitas (org)': 100,
      'Fasilitas (pisahkan koma)': 'proyektor, AC, sound_system, whiteboard',
      'Status': 'tersedia',
      'Keterangan': 'Ruangan serbaguna utama',
    },
    {
      'Nama Ruangan': 'Ruang Rapat B',
      'Lokasi Gedung': 'Gedung B',
      'Lantai': 2,
      'Kapasitas (org)': 20,
      'Fasilitas (pisahkan koma)': 'proyektor, AC, whiteboard',
      'Status': 'tersedia',
      'Keterangan': '',
    },
  ]

  // ── Worksheet utama ───────────────────────────────────────────────────────
  const ws = XLSX.utils.json_to_sheet(contohData)

  // Lebar kolom
  ws['!cols'] = [
    { wch: 28 }, // Nama Ruangan
    { wch: 20 }, // Lokasi Gedung
    { wch: 10 }, // Lantai
    { wch: 16 }, // Kapasitas
    { wch: 42 }, // Fasilitas
    { wch: 14 }, // Status
    { wch: 30 }, // Keterangan
  ]

  // ── Sheet panduan ─────────────────────────────────────────────────────────
  const panduanData = [
    { Kolom: 'Nama Ruangan',                Keterangan: 'Wajib. Nama unik ruangan.',                         Contoh: 'Aula Serbaguna' },
    { Kolom: 'Lokasi Gedung',               Keterangan: 'Wajib. Nama gedung / area.',                        Contoh: 'Gedung A' },
    { Kolom: 'Lantai',                      Keterangan: 'Opsional. Angka. Kosongkan jika tidak ada lantai.', Contoh: '2' },
    { Kolom: 'Kapasitas (org)',             Keterangan: 'Wajib. Angka positif.',                             Contoh: '50' },
    { Kolom: 'Fasilitas (pisahkan koma)',   Keterangan: 'Opsional. Nilai valid: proyektor, AC, whiteboard, sound_system, wifi, komputer, panggung, tv, printer', Contoh: 'proyektor, AC, wifi' },
    { Kolom: 'Status',                      Keterangan: 'Opsional. Default: tersedia. Nilai valid: tersedia, maintenance, tidak_aktif', Contoh: 'tersedia' },
    { Kolom: 'Keterangan',                  Keterangan: 'Opsional. Catatan tambahan.',                       Contoh: 'Ruangan VIP' },
  ]
  const wsPanduan = XLSX.utils.json_to_sheet(panduanData)
  wsPanduan['!cols'] = [{ wch: 28 }, { wch: 70 }, { wch: 25 }]

  // ── Workbook ──────────────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Data Ruangan')
  XLSX.utils.book_append_sheet(wb, wsPanduan, 'Panduan')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template_import_ruangan.xlsx"',
    },
  })
}
