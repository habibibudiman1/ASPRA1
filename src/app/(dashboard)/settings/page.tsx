// =============================================================================
// app/(dashboard)/settings/page.tsx
// Halaman pengaturan profil
// =============================================================================

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/user-actions'
import { SettingsClient } from '@/components/settings/settings-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Pengaturan Profil' }

export default async function SettingsPage() {
  const profile = await getCurrentUser()
  if (!profile) redirect('/login')

  return <SettingsClient profile={profile} />
}
