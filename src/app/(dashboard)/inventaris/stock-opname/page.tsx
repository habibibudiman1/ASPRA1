import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/user-actions'
import { StockOpnameClient } from './stock-opname-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Stock Opname | ASPRA' }

export default async function StockOpnamePage() {
  const profile = await getCurrentUser()
  if (!profile || (profile.role !== 'sarana' && profile.role !== 'admin')) {
    redirect('/inventaris')
  }

  return <StockOpnameClient />
}
