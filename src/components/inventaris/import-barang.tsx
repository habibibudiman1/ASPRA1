'use client'

import { useState, useRef, useTransition } from 'react'
import { Upload, Download, CheckCircle2, X, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { importInventarisFromCSV } from '@/lib/actions/inventaris-actions'

const VALID_KATEGORI = ['elektronik', 'furniture', 'atk', 'kendaraan', 'alat_olahraga', 'alat_lab', 'lainnya']
const VALID_KONDISI  = ['baik', 'rusak_ringan', 'rusak_berat']

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
  catatan?: string
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  for (const line of text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')) {
    if (!line.trim()) continue
    const cols: string[] = []
    let cur = ''
    let inQ = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++ } else inQ = !inQ }
      else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = '' }
      else cur += ch
    }
    cols.push(cur.trim())
    rows.push(cols)
  }
  return rows
}

function downloadTemplate() {
  const header = 'nama_barang,kategori,jumlah_stok,satuan,kondisi,lokasi_penempatan,merk,tipe_model,tanggal_perolehan,nilai_perolehan,catatan'
  const examples = [
    'Laptop HP,elektronik,5,unit,baik,Ruang IT,HP,Pavilion 15,2024-01-01,8000000,',
    'Kursi Kantor,furniture,20,buah,baik,Ruang Rapat,,,2023-06-01,,',
    'Kertas A4,atk,50,rim,baik,Gudang ATK,,,2024-03-01,45000,',
  ]
  const csv = [header, ...examples].join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url; a.download = 'template-import-inventaris.csv'; a.click()
  URL.revokeObjectURL(url)
}

export function ImportBarang() {
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState('')
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const rows = parseCSV(text)
      if (rows.length < 2) { toast.error('File kosong atau hanya berisi header'); return }

      const [headerRow, ...dataRows] = rows
      const headers = headerRow.map(h => h.toLowerCase().replace(/\s+/g, '_'))
      const idx = (name: string) => headers.indexOf(name)
      const get = (cols: string[], name: string) => cols[idx(name)]?.trim() ?? ''

      const parsed: ParsedRow[] = dataRows.map((cols, i) => {
        const row: ParsedRow = {
          _rowNum: i + 2,
          _valid: true,
          nama_barang:       get(cols, 'nama_barang'),
          kategori:          get(cols, 'kategori').toLowerCase(),
          jumlah_stok:       Number(get(cols, 'jumlah_stok')) || 0,
          satuan:            get(cols, 'satuan'),
          kondisi:           get(cols, 'kondisi').toLowerCase() || 'baik',
          lokasi_penempatan: get(cols, 'lokasi_penempatan'),
          merk:              get(cols, 'merk') || undefined,
          tipe_model:        get(cols, 'tipe_model') || undefined,
          tanggal_perolehan: get(cols, 'tanggal_perolehan') || undefined,
          nilai_perolehan:   get(cols, 'nilai_perolehan') ? Number(get(cols, 'nilai_perolehan')) : undefined,
          catatan:           get(cols, 'catatan') || undefined,
        }
        if (!row.nama_barang)                          { row._valid = false; row._error = 'nama_barang kosong' }
        else if (!VALID_KATEGORI.includes(row.kategori)) { row._valid = false; row._error = `kategori "${row.kategori}" tidak valid` }
        else if (!row.satuan)                          { row._valid = false; row._error = 'satuan kosong' }
        else if (!row.lokasi_penempatan)               { row._valid = false; row._error = 'lokasi_penempatan kosong' }
        else if (!VALID_KONDISI.includes(row.kondisi)) { row.kondisi = 'baik' }
        return row
      })
      setPreview(parsed)
    }
    reader.readAsText(file)
  }

  function handleImport() {
    const valid = preview.filter(r => r._valid)
    if (valid.length === 0) return
    startTransition(async () => {
      const result = await importInventarisFromCSV(
        valid.map(({ _rowNum: _r, _valid: _v, _error: _e, ...row }) => row)
      )
      if (result.success && result.data) {
        const { imported, errors } = result.data
        toast.success(`Berhasil mengimport ${imported} barang`)
        if (errors.length > 0) toast.warning(`${errors.length} baris gagal:\n${errors.slice(0, 3).join('\n')}`)
        setOpen(false)
        setPreview([])
        setFileName('')
      } else {
        toast.error(result.error ?? 'Import gagal')
      }
    })
  }

  const validCount   = preview.filter(r => r._valid).length
  const invalidCount = preview.filter(r => !r._valid).length

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4 mr-2" />
        Import CSV
      </Button>

      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setPreview([]); setFileName('') } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Import Barang dari CSV</DialogTitle></DialogHeader>

          <div className="space-y-4">
            {/* Template */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <p className="text-sm font-medium">1. Download template CSV</p>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />Template CSV
              </Button>
              <p className="text-xs text-muted-foreground">
                Kategori valid: {VALID_KATEGORI.join(', ')}
              </p>
            </div>

            {/* Upload */}
            <div className="space-y-2">
              <p className="text-sm font-medium">2. Upload file CSV</p>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{fileName || 'Klik untuk pilih file CSV'}</p>
              </div>
              <input ref={fileRef} type="file" accept=".csv" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            </div>

            {/* Preview */}
            {preview.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium">3. Preview ({preview.length} baris)</p>
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />{validCount} valid
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-xs text-destructive flex items-center gap-1">
                      <X className="h-3 w-3" />{invalidCount} error
                    </span>
                  )}
                </div>
                <div className="max-h-64 overflow-auto border rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2">#</th>
                        <th className="text-left px-3 py-2">Nama</th>
                        <th className="text-left px-3 py-2">Kategori</th>
                        <th className="text-left px-3 py-2">Stok</th>
                        <th className="text-left px-3 py-2">Lokasi</th>
                        <th className="text-left px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map(row => (
                        <tr key={row._rowNum} className={row._valid ? '' : 'bg-destructive/10'}>
                          <td className="px-3 py-1.5 text-muted-foreground">{row._rowNum}</td>
                          <td className="px-3 py-1.5">{row.nama_barang || '—'}</td>
                          <td className="px-3 py-1.5">{row.kategori || '—'}</td>
                          <td className="px-3 py-1.5">{row.jumlah_stok} {row.satuan}</td>
                          <td className="px-3 py-1.5">{row.lokasi_penempatan || '—'}</td>
                          <td className="px-3 py-1.5">
                            {row._valid
                              ? <span className="text-green-600">✓</span>
                              : <span className="text-destructive flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />{row._error}
                                </span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button onClick={handleImport} disabled={validCount === 0 || isPending} className="w-full">
                  {isPending ? 'Mengimport...' : `Import ${validCount} Barang`}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
