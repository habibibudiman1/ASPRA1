'use client'

// =============================================================================
// components/shared/export-pdf-button.tsx
// Tombol Export PDF untuk data Tiket atau Inventaris
// =============================================================================

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAllInventarisForExport } from '@/lib/actions/export-inventaris-actions'
import { getAllTicketsForExport } from '@/lib/actions/export-ticket-actions'
import { exportInventarisToPDF, exportTicketsToPDF } from '@/lib/pdf-export'
import { toast } from 'sonner'

interface Props {
  type: 'inventaris' | 'tickets'
  label?: string
  // Optional filters untuk export subset
  filters?: Record<string, string>
}

export function ExportPDFButton({ type, label = 'Export PDF', filters }: Props) {
  const [isExporting, setIsExporting] = useState(false)

  async function handleExport() {
    setIsExporting(true)
    toast.info('Menyiapkan file PDF...')

    try {
      if (type === 'inventaris') {
        const data = await getAllInventarisForExport(filters || {})
        if (!data || data.length === 0) {
          toast.warning('Tidak ada data inventaris untuk diexport.')
          return
        }
        exportInventarisToPDF(data, 'Laporan Semua Barang')
        toast.success('PDF Inventaris berhasil dibuat')

      } else if (type === 'tickets') {
        const data = await getAllTicketsForExport(filters || {})
        if (!data || data.length === 0) {
          toast.warning('Tidak ada data tiket untuk diexport.')
          return
        }
        exportTicketsToPDF(data)
        toast.success('PDF Tiket berhasil dibuat')
      }
    } catch (err) {
      console.error(err)
      toast.error('Terjadi kesalahan saat generate PDF')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4 mr-2" />
      )}
      {label}
    </Button>
  )
}
