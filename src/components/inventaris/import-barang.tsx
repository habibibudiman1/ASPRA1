'use client'

// =============================================================================
// components/inventaris/import-barang.tsx
// Import data barang dari file Excel (.xlsx/.xls)  — menggantikan CSV
// =============================================================================

import { useState, useRef, useTransition } from 'react'
import * as XLSX from 'xlsx'
import { Upload, Download, CheckCircle2, X, AlertCircle, FileSpreadsheet, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { importInventarisFromCSV } from '@/lib/actions/inventaris-actions'

const VALID_KATEGORI = ['elektronik', 'furniture', 'atk', 'kendaraan', 'alat_olahraga', 'alat_lab', 'lainnya']
const VALID_KONDISI  = ['baik', 'rusak_ringan', 'rusak_berat']
const VALID_SATUAN   = ['unit', 'buah', 'set', 'lembar', 'rim', 'pack', 'lusin', 'box', 'roll', 'meter', 'liter', 'kg', 'pasang']

// Mapping nama kolom Excel → field internal
const COL_MAP: Record<string, string> = {
  'nama barang':          'nama_barang',
  'nama_barang':          'nama_barang',
  'kategori':             'kategori',
  'jumlah stok':          'jumlah_stok',
  'jumlah_stok':          'jumlah_stok',
  'stok':                 'jumlah_stok',
  'satuan':               'satuan',
  'kondisi':              'kondisi',
  'lokasi penempatan':    'lokasi_penempatan',
  'lokasi_penempatan':    'lokasi_penempatan',
  'lokasi':               'lokasi_penempatan',
  'merk':                 'merk',
  'brand':                'merk',
  'tipe / model':         'tipe_model',
  'tipe/model':           'tipe_model',
  'tipe_model':           'tipe_model',
  'model':                'tipe_model',
  'tanggal perolehan':    'tanggal_perolehan',
  'tanggal_perolehan':    'tanggal_perolehan',
  'nilai perolehan (rp)': 'nilai_perolehan',
  'nilai perolehan':      'nilai_perolehan',
  'nilai_perolehan':      'nilai_perolehan',
  'harga':                'nilai_perolehan',
  'sumber dana':          'sumber_dana',
  'sumber_dana':          'sumber_dana',
  'catatan':              'catatan',
  'keterangan':           'catatan',
}

type ParsedRow = {
  _rowNum: number
  _valid: boolean
  _error?: string
  nama_barang: string
  kategori: string
  jumlah_stok: number
  satuan: string
  kondisi: string
  lokasi_penempatan: string
  merk?: string
  tipe_model?: string
  tanggal_perolehan?: string
  nilai_perolehan?: number
  sumber_dana?: string
  catatan?: string
}

function parseExcelDate(val: unknown): string | undefined {
  if (!val) return undefined
  // Excel serial number
  if (typeof val === 'number') {
    const d = XLSX.SSF.parse_date_code(val)
    if (d) return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`
  }
  // String ISO
  const s = String(val).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  return undefined
}

export function ImportBarang() {
  const [open, setOpen]         = useState(false)
  const [preview, setPreview]   = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState('')
  const [result, setResult]     = useState<{ imported: number; errors: string[] } | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    setFileName(file.name)
    setResult(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb   = XLSX.read(data, { type: 'array', cellDates: false })
        const sheetName = wb.SheetNames.includes('Data Barang') ? 'Data Barang' : wb.SheetNames[0]
        const ws   = wb.Sheets[sheetName]
        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

        if (rawRows.length === 0) { toast.error('File kosong'); return }

        const parsed: ParsedRow[] = rawRows.map((raw, i) => {
          // Normalisasi key
          const norm: Record<string, unknown> = {}
          for (const [k, v] of Object.entries(raw)) {
            const mapped = COL_MAP[k.toLowerCase().trim()]
            if (mapped) norm[mapped] = v
          }

          const row: ParsedRow = {
            _rowNum:           i + 2,
            _valid:            true,
            nama_barang:       String(norm.nama_barang ?? '').trim(),
            kategori:          String(norm.kategori ?? '').toLowerCase().trim(),
            jumlah_stok:       Number(norm.jumlah_stok) || 0,
            satuan:            String(norm.satuan ?? '').toLowerCase().trim(),
            kondisi:           String(norm.kondisi ?? '').toLowerCase().trim() || 'baik',
            lokasi_penempatan: String(norm.lokasi_penempatan ?? '').trim(),
            merk:              String(norm.merk ?? '').trim() || undefined,
            tipe_model:        String(norm.tipe_model ?? '').trim() || undefined,
            tanggal_perolehan: parseExcelDate(norm.tanggal_perolehan),
            nilai_perolehan:   norm.nilai_perolehan ? Number(norm.nilai_perolehan) : undefined,
            sumber_dana:       String(norm.sumber_dana ?? '').trim() || undefined,
            catatan:           String(norm.catatan ?? '').trim() || undefined,
          }

          // Validasi
          if (!row.nama_barang)                               { row._valid = false; row._error = 'Nama Barang kosong' }
          else if (!VALID_KATEGORI.includes(row.kategori))   { row._valid = false; row._error = `Kategori "${row.kategori}" tidak valid` }
          else if (!row.satuan)                              { row._valid = false; row._error = 'Satuan kosong' }
          else if (!row.lokasi_penempatan)                   { row._valid = false; row._error = 'Lokasi Penempatan kosong' }
          else if (!VALID_KONDISI.includes(row.kondisi))     { row.kondisi = 'baik' }

          return row
        }).filter(r => r.nama_barang || !r._valid)

        setPreview(parsed)
        setOpen(true)
      } catch (err) {
        console.error(err)
        toast.error('Gagal membaca file Excel. Pastikan format sesuai template.')
      }
    }
    reader.readAsArrayBuffer(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleImport() {
    const valid = preview.filter(r => r._valid)
    if (valid.length === 0) return
    startTransition(async () => {
      const res = await importInventarisFromCSV(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        valid.map(({ _rowNum: _r, _valid: _v, _error: _e, ...row }) => row)
      )
      if (res.success && res.data) {
        setResult(res.data)
        toast.success(`${res.data.imported} barang berhasil diimport!`)
        if (res.data.errors.length > 0) toast.warning(`${res.data.errors.length} baris gagal`)
      } else {
        toast.error(res.error ?? 'Import gagal')
      }
    })
  }

  function handleClose() {
    setOpen(false); setPreview([]); setFileName(''); setResult(null)
    if (result && result.imported > 0) window.location.reload()
  }

  const validCount   = preview.filter(r => r._valid).length
  const invalidCount = preview.filter(r => !r._valid).length

  const KONDISI_LABEL: Record<string, string> = { baik: 'Baik', rusak_ringan: 'Rusak Ringan', rusak_berat: 'Rusak Berat' }
  const KAT_LABEL: Record<string, string> = {
    elektronik: 'Elektronik', furniture: 'Furniture', atk: 'ATK',
    kendaraan: 'Kendaraan', alat_olahraga: 'Alat Olahraga', alat_lab: 'Alat Lab', lainnya: 'Lainnya',
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} id="btn-import-excel-barang">
        <Upload className="h-4 w-4 mr-2" />
        Import Excel
      </Button>
      <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />

      {/* ── Modal ─────────────────────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !isPending && handleClose()} />

          <div className="relative z-10 w-full max-w-5xl max-h-[90vh] flex flex-col bg-background border rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-base">Preview Import Barang</h2>
                  <p className="text-xs text-muted-foreground">
                    {fileName} · {preview.length} baris
                    {validCount > 0 && <span className="text-emerald-600 ml-2">✓ {validCount} valid</span>}
                    {invalidCount > 0 && <span className="text-red-500 ml-2">✗ {invalidCount} error</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Download template langsung dari sini */}
                <Button variant="ghost" size="sm" asChild>
                  <a href="/api/inventaris/template" download>
                    <Download className="h-4 w-4 mr-1.5" />Template
                  </a>
                </Button>
                <button onClick={() => !isPending && handleClose()} className="p-1.5 rounded-lg hover:bg-muted transition-colors" disabled={isPending}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Result banner */}
            {result && (
              <div className={`px-6 py-3 flex items-start gap-3 text-sm border-b ${
                result.errors.length === 0
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200'
                  : 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200'
              }`}>
                {result.errors.length === 0
                  ? <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  : <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                <div className="flex-1">
                  <p className="font-medium">{result.imported} barang berhasil diimport{result.errors.length > 0 && `, ${result.errors.length} baris gagal`}</p>
                  {result.errors.slice(0, 5).map((e, i) => <p key={i} className="text-xs opacity-80 mt-0.5">{e}</p>)}
                </div>
              </div>
            )}

            {/* Table Preview */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                  <tr>
                    {['#','Nama Barang','Kategori','Stok','Satuan','Kondisi','Lokasi','Merk / Tipe','Nilai (Rp)','Status'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {preview.map((row) => (
                    <tr key={row._rowNum} className={`transition-colors ${!row._valid ? 'bg-red-50 dark:bg-red-950/20' : 'hover:bg-muted/30'}`}>
                      <td className="px-3 py-2 text-muted-foreground text-xs">{row._rowNum}</td>
                      <td className="px-3 py-2 font-medium max-w-[160px] truncate" title={row.nama_barang}>
                        {row.nama_barang || <span className="text-red-500 italic">kosong</span>}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <span className={`px-1.5 py-0.5 rounded ${VALID_KATEGORI.includes(row.kategori) ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-red-100 text-red-600'}`}>
                          {(KAT_LABEL[row.kategori] ?? row.kategori) || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">{row.jumlah_stok}</td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">{row.satuan || <span className="text-red-500">—</span>}</td>
                      <td className="px-3 py-2 text-xs">
                        <span className={`px-1.5 py-0.5 rounded ${
                          row.kondisi === 'baik' ? 'bg-emerald-100 text-emerald-700' :
                          row.kondisi === 'rusak_ringan' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>{KONDISI_LABEL[row.kondisi] ?? row.kondisi}</span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-xs max-w-[140px] truncate" title={row.lokasi_penempatan}>
                        {row.lokasi_penempatan || <span className="text-red-500">—</span>}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-xs max-w-[120px] truncate">
                        {[row.merk, row.tipe_model].filter(Boolean).join(' / ') || '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                        {row.nilai_perolehan ? `Rp ${row.nilai_perolehan.toLocaleString('id-ID')}` : '—'}
                      </td>
                      <td className="px-3 py-2">
                        {row._valid
                          ? <span className="text-emerald-600 flex items-center gap-1 text-xs"><CheckCircle2 className="h-3 w-3" />OK</span>
                          : <span className="text-red-500 flex items-center gap-1 text-xs"><AlertCircle className="h-3 w-3" />{row._error}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            {!result ? (
              <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
                <p className="text-sm text-muted-foreground">{validCount} dari {preview.length} baris siap diimport</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleClose} disabled={isPending}>Batal</Button>
                  <Button size="sm" onClick={handleImport} disabled={isPending || validCount === 0} id="btn-confirm-import-barang">
                    {isPending
                      ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Mengimport...</>
                      : <><Upload className="h-4 w-4 mr-2" />Import {validCount} Barang</>}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end px-6 py-4 border-t bg-muted/20">
                <Button size="sm" onClick={handleClose}>Tutup & Perbarui Halaman</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
