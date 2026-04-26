'use client'

import { useState, useRef } from 'react'
import { Upload, Download, AlertCircle, CheckCircle2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { importItemsFromCSV } from '@/lib/actions/inventory-actions'
import type { ItemCategory, Room, ImportItemRow } from '@/lib/types'

interface Props {
  categories: ItemCategory[]
  rooms: Room[]
  onSuccess: () => void
}

type ParsedRow = ImportItemRow & { _rowNum: number; _valid: boolean; _error?: string }

export function ItemImport({ categories, rooms, onSuccess }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)

  const catNames = new Set(categories.map(c => c.name.toLowerCase()))
  const roomNames = new Set([
    ...rooms.map(r => r.name.toLowerCase()),
    ...rooms.map(r => r.code.toLowerCase()),
  ])

  function downloadTemplate(type: 'non-elektronik' | 'elektronik') {
    const headers = type === 'elektronik'
      ? 'nama_barang,kategori,ruangan,kode_unit,nomor_seri,spesifikasi,kondisi,keterangan'
      : 'nama_barang,kategori,ruangan,jumlah,keterangan'

    const examples = type === 'elektronik'
      ? [
          'Komputer,Elektronik,Lab Komputer,KOMP-001,SN001,"Intel i5/8GB RAM/256GB SSD",baik,PC Desktop',
          'Komputer,Elektronik,Lab Komputer,KOMP-002,SN002,"Intel i7/16GB RAM/512GB SSD",baik,PC Desktop',
          'Laptop,Elektronik,Ruang Guru,LAPT-001,LT001,"Intel i5/8GB RAM/256GB SSD",baik,Lenovo ThinkPad',
        ]
      : [
          'Kursi,Furnitur,Kelas A,30,Kursi plastik merah',
          'Meja Guru,Furnitur,Kelas A,1,Meja kayu jati',
          'Papan Tulis,Furnitur,Kelas B,1,Whiteboard 120x90',
        ]

    const csv = [headers, ...examples].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `template-import-${type}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function parseCSV(text: string): string[][] {
    const rows: string[][] = []
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
    for (const line of lines) {
      if (!line.trim()) continue
      const cols: string[] = []
      let cur = ''
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') { cur += '"'; i++ }
          else inQuotes = !inQuotes
        } else if (ch === ',' && !inQuotes) {
          cols.push(cur.trim())
          cur = ''
        } else {
          cur += ch
        }
      }
      cols.push(cur.trim())
      rows.push(cols)
    }
    return rows
  }

  async function handleFile(file: File) {
    setFileName(file.name)
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')

    let csvText: string

    if (isExcel) {
      // Untuk Excel, gunakan xlsx jika tersedia
      try {
        const XLSX = await import('xlsx')
        const buf = await file.arrayBuffer()
        const wb = XLSX.read(buf)
        const ws = wb.Sheets[wb.SheetNames[0]]
        csvText = XLSX.utils.sheet_to_csv(ws)
      } catch {
        toast.error('xlsx library tidak tersedia. Simpan file sebagai CSV (.csv) terlebih dahulu, atau jalankan: npm install xlsx')
        return
      }
    } else {
      csvText = await file.text()
    }

    const rows = parseCSV(csvText)
    if (rows.length < 2) {
      toast.error('File kosong atau hanya berisi header')
      return
    }

    const [headerRow, ...dataRows] = rows
    const headers = headerRow.map(h => h.toLowerCase().replace(/\s+/g, '_'))

    const idx = (name: string) => headers.indexOf(name)

    const parsed: ParsedRow[] = dataRows.map((cols, i) => {
      const get = (name: string) => cols[idx(name)]?.trim() ?? ''

      const row: ParsedRow = {
        _rowNum: i + 2,
        _valid: true,
        nama_barang: get('nama_barang'),
        kategori: get('kategori'),
        ruangan: get('ruangan') || undefined,
        jumlah: get('jumlah') ? Number(get('jumlah')) : undefined,
        kode_unit: get('kode_unit') || undefined,
        nomor_seri: get('nomor_seri') || undefined,
        spesifikasi: get('spesifikasi') || undefined,
        kondisi: get('kondisi') || undefined,
        keterangan: get('keterangan') || undefined,
      }

      // Validasi
      if (!row.nama_barang) { row._valid = false; row._error = 'nama_barang kosong' }
      else if (!row.kategori) { row._valid = false; row._error = 'kategori kosong' }
      else if (!catNames.has(row.kategori.toLowerCase())) { row._valid = false; row._error = `kategori "${row.kategori}" tidak dikenal` }
      else if (row.ruangan && !roomNames.has(row.ruangan.toLowerCase())) { row._valid = false; row._error = `ruangan "${row.ruangan}" tidak ditemukan` }

      return row
    })

    setPreview(parsed)
  }

  async function handleImport() {
    const valid = preview.filter(r => r._valid)
    if (valid.length === 0) return

    setImporting(true)
    try {
      const result = await importItemsFromCSV(valid.map(({ _rowNum: _r, _valid: _v, _error: _e, ...row }) => row))
      if (result.success && result.data) {
        const { imported, errors } = result.data
        toast.success(`Berhasil mengimport ${imported} baris`)
        if (errors.length > 0) {
          toast.warning(`${errors.length} baris gagal:\n${errors.slice(0, 3).join('\n')}`)
        }
        onSuccess()
      } else {
        toast.error(result.error ?? 'Import gagal')
      }
    } finally {
      setImporting(false)
    }
  }

  const validCount = preview.filter(r => r._valid).length
  const invalidCount = preview.filter(r => !r._valid).length

  return (
    <div className="space-y-4">
      {/* Template Download */}
      <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
        <p className="text-sm font-medium">1. Download template CSV</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadTemplate('non-elektronik')}>
            <Download className="h-4 w-4 mr-2" />
            Template Non-Elektronik
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadTemplate('elektronik')}>
            <Download className="h-4 w-4 mr-2" />
            Template Elektronik
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Kategori valid: {categories.map(c => c.name).join(', ')}
        </p>
        <p className="text-xs text-muted-foreground">
          Kode ruangan valid: {rooms.map(r => r.code).join(', ')}
        </p>
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <p className="text-sm font-medium">2. Upload file CSV atau Excel</p>
        <div
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {fileName || 'Klik atau seret file CSV / Excel (.xlsx) ke sini'}
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
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
                  <th className="text-left px-3 py-2">Ruangan</th>
                  <th className="text-left px-3 py-2">Kode/Jml</th>
                  <th className="text-left px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.map(row => (
                  <tr key={row._rowNum} className={row._valid ? '' : 'bg-destructive/10'}>
                    <td className="px-3 py-1.5 text-muted-foreground">{row._rowNum}</td>
                    <td className="px-3 py-1.5">{row.nama_barang || '—'}</td>
                    <td className="px-3 py-1.5">{row.kategori || '—'}</td>
                    <td className="px-3 py-1.5">{row.ruangan || '—'}</td>
                    <td className="px-3 py-1.5">{row.kode_unit || row.jumlah || '—'}</td>
                    <td className="px-3 py-1.5">
                      {row._valid ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {row._error}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button
            onClick={handleImport}
            disabled={validCount === 0 || importing}
            className="w-full"
          >
            {importing ? 'Mengimport...' : `Import ${validCount} Baris`}
          </Button>
        </div>
      )}
    </div>
  )
}
