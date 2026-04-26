import { getItems, getItemCategories } from '@/lib/actions/inventory-actions'
import { getRooms } from '@/lib/actions/room-actions'
import { getCurrentUser } from '@/lib/actions/user-actions'
import { InventoryClient } from '@/components/inventory/inventory-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Inventaris Barang' }

interface PageProps {
  searchParams: Promise<{
    room_id?: string
    category_id?: string
    search?: string
    view?: string
  }>
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const params = await searchParams
  const [profile, rooms, categories, items] = await Promise.all([
    getCurrentUser(),
    getRooms(),
    getItemCategories(),
    getItems({
      room_id: params.room_id,
      category_id: params.category_id,
      search: params.search,
    }),
  ])

  return (
    <InventoryClient
      items={items}
      rooms={rooms}
      categories={categories}
      profile={profile!}
      filters={{
        room_id: params.room_id ?? '',
        category_id: params.category_id ?? '',
        search: params.search ?? '',
        view: params.view ?? 'all',
      }}
    />
  )
}
