// =============================================================================
// app/page.tsx
// Root redirect — langsung ke /login (middleware akan handle redirect role-based)
// =============================================================================

import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/login')
}
