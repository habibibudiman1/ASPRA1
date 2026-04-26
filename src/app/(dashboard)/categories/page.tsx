// =============================================================================
// app/(dashboard)/categories/page.tsx
// Halaman manajemen kategori (IT Admin only)
// =============================================================================

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/user-actions'
import { getCategories } from '@/lib/actions/category-actions'
import { CategoriesClient } from '@/components/categories/categories-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Kategori' }

export default async function CategoriesPage() {
  const profile = await getCurrentUser()
  if (!profile || (profile.role !== 'it_admin' && profile.role !== 'admin')) redirect('/tickets')

  const categories = await getCategories()
  return <CategoriesClient categories={categories} />
}
