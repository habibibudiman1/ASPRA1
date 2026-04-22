// =============================================================================
// lib/supabase/server.ts
// Supabase Server Client — digunakan di Server Components & Server Actions
// =============================================================================

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Membuat Supabase client untuk server-side (Server Components, Server Actions)
 * Menggunakan cookie store dari Next.js untuk session management
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll dipanggil dari Server Component — bisa diabaikan
            // jika tidak ada middleware yang me-refresh session
          }
        },
      },
    }
  )
}

/**
 * Membuat Supabase Admin Client menggunakan service role key
 * HANYA digunakan di Server Actions untuk operasi yang memerlukan akses admin
 * JANGAN expose ke client-side
 */
export async function createAdminClient() {
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
