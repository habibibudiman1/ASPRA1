'use client'

// =============================================================================
// components/shared/export-pdf-button.tsx
// Tombol Export PDF untuk data Tiket atau Inventaris
// =============================================================================

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getInventaris } from '@/lib/actions/inventaris-actions'
import { getTickets } from '@/lib/actions/ticket-actions'
import { exportInventarisToPDF, exportTicketsToPDF } from '@/lib/pdf-export'
import { toast } from 'sonner'

interface Props {
  type: 'inventaris' | 'tickets'
  label?: string
  // Optional filters untuk export subset
  filters?: any
}

export function ExportPDFButton({ type, label = 'Export PDF', filters }: Props) {
  const [isExporting, setIsExporting] = useState(false)

  async function handleExport() {
    setIsExporting(true)
    toast.info('Menyiapkan file PDF...')

    try {
      if (type === 'inventaris') {
        // Fetch up to 1000 items untuk laporan export
        const { data } = await getInventaris(filters || {}, 1, 1000)
        if (!data || data.length === 0) {
          toast.warning('Tidak ada data inventaris untuk diexport.')
          return
        }
        exportInventarisToPDF(data, 'Laporan Semua Barang')
        toast.success('PDF Inventaris berhasil dibuat')
        
      } else if (type === 'tickets') {
        const { data } = await getTickets(filters || {}, 1, 1000)
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
