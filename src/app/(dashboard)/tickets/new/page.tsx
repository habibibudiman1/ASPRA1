// =============================================================================
// app/(dashboard)/tickets/new/page.tsx
// Halaman buat tiket baru
// =============================================================================

import { redirect } from 'next/navigation'
import { getCategories } from '@/lib/actions/category-actions'
import { TicketForm } from '@/components/tickets/ticket-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Buat Tiket Baru' }

export default async function NewTicketPage() {
  const categories = await getCategories()
  const activeCategories = categories.filter((c) => c.is_active)

  if (activeCategories.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-16">
          <p className="text-muted-foreground">
            Belum ada kategori aktif. Hubungi IT Admin untuk menambahkan kategori.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Buat Tiket Baru</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Jelaskan masalah IT yang Anda alami dengan detail agar tim IT dapat membantu lebih cepat.
        </p>
      </div>
      <TicketForm categories={activeCategories} />
    </div>
  )
}
