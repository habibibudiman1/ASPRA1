// =============================================================================
// src/proxy.ts  (menggantikan middleware.ts — Next.js 16+)
// Auth protection & role-based routing
// Mendukung 4 role: staff, it_admin, admin, sarana
// =============================================================================

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Route yang hanya bisa diakses Admin (admin role)
const ADMIN_ONLY_ROUTES = [
  '/users',
  '/ruangan/kelola',
]

// Route yang bisa diakses IT Admin dan Admin
const IT_ADMIN_ROUTES = [
  '/dashboard',
  '/categories',
  '/sla',
  '/reports',
]

// Route yang hanya bisa diakses Sarana
const SARANA_ONLY_ROUTES = [
  '/ruangan/approval',
  '/inventaris/barang/baru',
  '/inventaris/barang/edit',
  '/inventaris/mutasi/baru',
  '/inventaris/stock-opname',
]

// Route publik — tidak perlu login
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
    // Kalau sudah login dan ke /login, redirect ke home sesuai role
    if (user && pathname === '/login') {
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      return NextResponse.redirect(
        new URL(getDefaultRoute(profile?.role), request.url)
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

  // Ambil profil untuk cek role & status
  const { data: profile } = await supabase
    .from('profiles').select('role, is_active').eq('id', user.id).single()

  // Akun nonaktif → logout & redirect
  if (profile && !profile.is_active) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/login?error=account_disabled', request.url))
  }

  const role = profile?.role ?? 'staff'

  // Check admin-only routes (admin role only)
  const isAdminRoute = ADMIN_ONLY_ROUTES.some(r => pathname.startsWith(r))
  if (isAdminRoute && role !== 'admin') {
    return NextResponse.redirect(new URL(getDefaultRoute(role), request.url))
  }

  // Check IT/Admin routes
  const isITRoute = IT_ADMIN_ROUTES.some(r => pathname.startsWith(r))
  if (isITRoute && role !== 'it_admin' && role !== 'admin') {
    return NextResponse.redirect(new URL(getDefaultRoute(role), request.url))
  }

  // Check sarana-only routes
  const isSaranaRoute = SARANA_ONLY_ROUTES.some(r => pathname.startsWith(r))
  if (isSaranaRoute && role !== 'sarana') {
    return NextResponse.redirect(new URL(getDefaultRoute(role), request.url))
  }

  // Redirect root ke halaman default sesuai role
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(getDefaultRoute(role), request.url)
    )
  }

  return supabaseResponse
}

/** Halaman default saat login, berdasarkan role */
function getDefaultRoute(role?: string): string {
  switch (role) {
    case 'admin':    return '/dashboard'
    case 'it_admin': return '/dashboard'
    case 'sarana':   return '/ruangan/approval'
    case 'staff':
    default:         return '/tickets'
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
