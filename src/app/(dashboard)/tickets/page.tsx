// =============================================================================
// app/(dashboard)/tickets/page.tsx
// Halaman daftar tiket — filtered by role
// =============================================================================

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getTickets } from '@/lib/actions/ticket-actions'
import { getCurrentUser } from '@/lib/actions/user-actions'
import { getCategories } from '@/lib/actions/category-actions'
import { buttonVariants } from '@/components/ui/button'
import { TicketsClient } from '@/components/tickets/tickets-client'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tiket' }

interface PageProps {
  searchParams: Promise<{
    status?: string
    priority?: string
    category_id?: string
    search?: string
    page?: string
  }>
}

export default async function TicketsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const [profile, categories] = await Promise.all([getCurrentUser(), getCategories()])

  const { data: tickets, pagination } = await getTickets(
    {
      status: (params.status as 'all' | undefined) ?? 'all',
      priority: (params.priority as 'all' | undefined) ?? 'all',
      category_id: params.category_id ?? 'all',
      search: params.search,
    },
    Number(params.page ?? 1)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {(profile?.role === 'it_admin' || profile?.role === 'admin') ? 'Semua Tiket' : 'Tiket Saya'}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {(profile?.role === 'it_admin' || profile?.role === 'admin')
              ? 'Kelola semua tiket dari seluruh staff'
              : 'Pantau status tiket yang Anda buat'}
          </p>
        </div>
        <Link href="/tickets/new" id="btn-buat-tiket" className={cn(buttonVariants({ variant: 'default' }), 'inline-flex items-center flex-shrink-0')}>
          <Plus className="mr-2 h-4 w-4" />
          Buat Tiket
        </Link>
      </div>

      {/* Ticket List Client Component */}
      <TicketsClient
        tickets={tickets}
        pagination={pagination}
        categories={categories}
        profile={profile!}
        currentFilters={{
          status: params.status ?? 'all',
          priority: params.priority ?? 'all',
          category_id: params.category_id ?? 'all',
          search: params.search ?? '',
        }}
      />
    </div>
  )
}
