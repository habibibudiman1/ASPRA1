// =============================================================================
// lib/supabase/client.ts
// Supabase Browser Client — digunakan di Client Components
// =============================================================================

import { createBrowserClient } from '@supabase/ssr'

/**
 * Membuat Supabase client untuk browser/client-side
 * Dipanggil sekali per session di Client Components
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
