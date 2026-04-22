// =============================================================================
// app/(dashboard)/users/page.tsx
// Halaman manajemen user (IT Admin only)
// =============================================================================

import { redirect } from 'next/navigation'
import { getCurrentUser, getUsers } from '@/lib/actions/user-actions'
import { UsersClient } from '@/components/users/users-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Pengguna' }

export default async function UsersPage() {
  const profile = await getCurrentUser()
  if (!profile || profile.role !== 'it_admin') redirect('/tickets')

  const users = await getUsers()
  return <UsersClient users={users} currentUserId={profile.id} />
}
