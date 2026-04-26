// =============================================================================
// app/(dashboard)/page.tsx
// Halaman root dashboard — redirect berdasarkan role
// =============================================================================

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/user-actions'

export default async function RootPage() {
  const profile = await getCurrentUser()
  if (!profile) redirect('/login')
  if (profile.role === 'admin' || profile.role === 'it_admin') redirect('/dashboard')
  if (profile.role === 'sarana') redirect('/ruangan/approval')
  redirect('/tickets')
}
