// =============================================================================
// src/proxy.ts  (menggantikan middleware.ts — Next.js 16+)
// Auth protection & role-based routing
// =============================================================================

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_ONLY_ROUTES = ['/dashboard', '/categories', '/users', '/sla', '/reports']
const PUBLIC_ROUTES = ['/login', '/auth/callback']

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Guard: env vars wajib ada
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('[proxy] Supabase env vars missing!')
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Public routes — boleh akses tanpa login
  const isPublicRoute = PUBLIC_ROUTES.some(r => pathname.startsWith(r))
  if (isPublicRoute) {
    // Kalau sudah login dan ke /login, redirect ke home
    if (user && pathname === '/login') {
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      return NextResponse.redirect(
        new URL(profile?.role === 'it_admin' ? '/dashboard' : '/tickets', request.url)
      )
    }
    return supabaseResponse
  }

  // Belum login → ke /login
  if (!user) {
    const url = new URL('/login', request.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Check admin-only routes
  const isAdminRoute = ADMIN_ONLY_ROUTES.some(r => pathname.startsWith(r))
  if (isAdminRoute) {
    const { data: profile } = await supabase
      .from('profiles').select('role, is_active').eq('id', user.id).single()
    if (profile && !profile.is_active) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login?error=account_disabled', request.url))
    }
    if (profile?.role !== 'it_admin') {
      return NextResponse.redirect(new URL('/tickets', request.url))
    }
  }

  // Redirect root
  if (pathname === '/') {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    return NextResponse.redirect(
      new URL(profile?.role === 'it_admin' ? '/dashboard' : '/tickets', request.url)
    )
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
