'use client'

// =============================================================================
// app/(dashboard)/ruangan/kelola/import-button.tsx
// Komponen Client untuk import data ruangan dari Excel
// =============================================================================

import { useRef, useState, useTransition } from 'react'
import * as XLSX from 'xlsx'
import { Upload, Download, X, CheckCircle2, AlertTriangle, FileSpreadsheet, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { importRuanganFromExcel, type ImportResult } from '@/lib/actions/import-ruangan-actions'
import { toast } from 'sonner'

interface PreviewRow {
  row: number
  nama_ruangan: string
  lokasi_gedung: string
  lantai: string
  kapasitas: string
  fasilitas: string
  status: string
  keterangan: string
}

// Nama-nama kolom yang boleh ada di Excel (case-insensitive)
const COL_MAP: Record<string, keyof PreviewRow> = {
  'nama ruangan':              'nama_ruangan',
  'nama_ruangan':              'nama_ruangan',
  'lokasi gedung':             'lokasi_gedung',
  'lokasi_gedung':             'lokasi_gedung',
  'gedung':                    'lokasi_gedung',
  'lantai':                    'lantai',
  'kapasitas':                 'kapasitas',
  'kapasitas (org)':           'kapasitas',
  'fasilitas':                 'fasilitas',
  'fasilitas (pisahkan koma)': 'fasilitas',
  'status':                    'status',
  'keterangan':                'keterangan',
  'catatan':                   'keterangan',
}

export function ImportRuanganButton() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [fileName, setFileName] = useState('')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setResult(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target!.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })

        // Cari sheet bernama "Data Ruangan" atau gunakan sheet pertama
        const sheetName = wb.SheetNames.includes('Data Ruangan')
          ? 'Data Ruangan'
          : wb.SheetNames[0]
        const ws = wb.Sheets[sheetName]

        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

        const mapped: PreviewRow[] = rawRows.map((r, idx) => {
          const norm: Partial<PreviewRow> = { row: idx + 2 }
          for (const [key, val] of Object.entries(r)) {
            const mappedKey = COL_MAP[key.toLowerCase().trim()]
            if (mappedKey) (norm as Record<string, unknown>)[mappedKey] = String(val ?? '')
          }
          return {
            row: norm.row!,
            nama_ruangan: norm.nama_ruangan ?? '',
            lokasi_gedung: norm.lokasi_gedung ?? '',
            lantai: norm.lantai ?? '',
            kapasitas: norm.kapasitas ?? '',
            fasilitas: norm.fasilitas ?? '',
            status: norm.status ?? 'tersedia',
            keterangan: norm.keterangan ?? '',
          }
        }).filter((r) => r.nama_ruangan.trim() !== '')

        setPreview(mapped)
        setOpen(true)
      } catch {
        toast.error('Gagal membaca file Excel. Pastikan format file benar.')
      }
    }
    reader.readAsArrayBuffer(file)
    // Reset input supaya file yang sama bisa di-upload ulang
    e.target.value = ''
  }

  function handleImport() {
    startTransition(async () => {
      const rows = preview.map((r) => ({
        nama_ruangan: r.nama_ruangan,
        lokasi_gedung: r.lokasi_gedung,
        lantai: r.lantai ? Number(r.lantai) : null,
        kapasitas: Number(r.kapasitas),
        fasilitas: r.fasilitas,
        status: r.status,
        keterangan: r.keterangan,
      }))

      const res = await importRuanganFromExcel(rows)
      setResult(res)

      if (res.imported > 0) {
        toast.success(`${res.imported} ruangan berhasil diimport!`)
      }
      if (res.skipped > 0 && res.imported === 0) {
        toast.error(`Semua data gagal diimport. Periksa pesan error di bawah.`)
      }
    })
  }

  function handleClose() {
    setOpen(false)
    setPreview([])
    setFileName('')
    setResult(null)
    if (result?.imported && result.imported > 0) {
      // Reload page agar tabel terupdate (sudah di-revalidate oleh server action)
      window.location.reload()
    }
  }

  return (
    <>
      {/* ── Trigger buttons ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Download template */}
        <Button variant="outline" size="sm" asChild>
          <a href="/api/ruangan/template" download>
            <Download className="h-4 w-4 mr-1.5" />
            Template Excel
          </a>
        </Button>

        {/* Upload Excel */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          id="btn-import-excel-ruangan"
        >
          <Upload className="h-4 w-4 mr-1.5" />
          Import Excel
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* ── Modal / Dialog Preview ──────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isPending && handleClose()}
          />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-5xl max-h-[90vh] flex flex-col bg-background border rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-base">Preview Import Ruangan</h2>
                  <p className="text-xs text-muted-foreground">{fileName} · {preview.length} baris ditemukan</p>
                </div>
              </div>
              <button
                onClick={() => !isPending && handleClose()}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                disabled={isPending}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Result banner */}
            {result && (
              <div className={`px-6 py-3 flex items-start gap-3 text-sm border-b ${
                result.skipped === 0
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200'
                  : 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200'
              }`}>
                {result.skipped === 0
                  ? <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  : <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                <div className="flex-1">
                  <p className="font-medium">
                    {result.imported} ruangan berhasil diimport
                    {result.skipped > 0 && `, ${result.skipped} baris dilewati`}
                  </p>
                  {result.errors.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5">
                      {result.errors.map((e, i) => (
                        <li key={i} className="text-xs opacity-80">Baris {e.row}: {e.message}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Table preview */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                  <tr>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-10">#</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Nama Ruangan</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Lokasi</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-16">Lantai</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-24">Kapasitas</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Fasilitas</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-28">Status</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {preview.map((row, i) => {
                    const isError = !row.nama_ruangan.trim() || !row.lokasi_gedung.trim() || !row.kapasitas
                    return (
                      <tr
                        key={i}
                        className={`transition-colors ${isError ? 'bg-red-50 dark:bg-red-950/20' : 'hover:bg-muted/30'}`}
                      >
                        <td className="px-3 py-2 text-muted-foreground text-xs">{row.row}</td>
                        <td className="px-3 py-2">
                          <span className={!row.nama_ruangan.trim() ? 'text-red-500 italic' : 'font-medium'}>
                            {row.nama_ruangan || '⚠ kosong'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          <span className={!row.lokasi_gedung.trim() ? 'text-red-500 italic' : ''}>
                            {row.lokasi_gedung || '⚠ kosong'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{row.lantai || '—'}</td>
                        <td className="px-3 py-2">
                          <span className={!row.kapasitas ? 'text-red-500 italic' : ''}>
                            {row.kapasitas ? `${row.kapasitas} org` : '⚠ kosong'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground text-xs max-w-[200px] truncate" title={row.fasilitas}>
                          {row.fasilitas || '—'}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            row.status === 'tersedia'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : row.status === 'maintenance'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {row.status || 'tersedia'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground text-xs max-w-[150px] truncate" title={row.keterangan}>
                          {row.keterangan || '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            {!result && (
              <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
                <p className="text-sm text-muted-foreground">
                  {preview.filter(r => r.nama_ruangan && r.lokasi_gedung && r.kapasitas).length} dari {preview.length} baris siap diimport
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleClose} disabled={isPending}>
                    Batal
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleImport}
                    disabled={isPending || preview.length === 0}
                    id="btn-confirm-import-ruangan"
                  >
                    {isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Mengimport...</>
                    ) : (
                      <><Upload className="h-4 w-4 mr-2" />Import {preview.length} Ruangan</>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {result && (
              <div className="flex justify-end px-6 py-4 border-t bg-muted/20">
                <Button size="sm" onClick={handleClose}>
                  Tutup & Perbarui Halaman
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
