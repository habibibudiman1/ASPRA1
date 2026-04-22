// =============================================================================
// app/(dashboard)/layout.tsx
// Layout utama dashboard — Server Component untuk fetch user
// =============================================================================

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/user-actions'
import { DashboardLayoutClient } from '@/components/layout/dashboard-layout-client'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Server-side: ambil profil user
  const profile = await getCurrentUser()
  if (!profile) redirect('/login')
  if (!profile.is_active) redirect('/login?error=account_disabled')

  return <DashboardLayoutClient profile={profile}>{children}</DashboardLayoutClient>
}
