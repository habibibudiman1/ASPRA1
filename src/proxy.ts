// =============================================================================
// src/proxy.ts  (menggantikan middleware.ts — Next.js 16+)
// Auth protection & role-based routing
// Mendukung 4 role: staff, it_admin, admin, sarana
//
// OPTIMASI PERFORMA:
// - Tidak ada query ke database Supabase
// - Role & is_active dibaca dari JWT claims (app_metadata)
//   yang di-inject via custom_access_token_hook (migration 008)
// =============================================================================

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Route yang hanya bisa diakses Admin (admin role)
const ADMIN_ONLY_ROUTES = [
  '/users',
]

// Route yang bisa diakses IT Admin dan Admin
const IT_ADMIN_ROUTES = [
  '/dashboard',
  '/categories',
  '/sla',
  '/reports',
]

// Route yang bisa diakses Sarana atau Admin
const SARANA_OR_ADMIN_ROUTES = [
  '/ruangan/kelola',
  '/ruangan/approval',
  '/inventaris/barang/baru',
  '/inventaris/barang/edit',
  '/inventaris/mutasi',
  '/inventaris/stock-opname',
]

// Route publik — tidak perlu login
const PUBLIC_ROUTES = ['/login', '/auth/callback', '/lupa-password', '/reset-password']

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

  // Ambil user — hanya 1 network call (validasi JWT, tanpa DB query)
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Helper untuk redirect sambil membawa cookie dari supabaseResponse
  const redirectWithCookies = (url: string | URL) => {
    const res = NextResponse.redirect(new URL(url, request.url))
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      res.cookies.set(cookie.name, cookie.value, cookie)
    })
    return res
  }

  // Public routes — boleh akses tanpa login
  const isPublicRoute = PUBLIC_ROUTES.some(r => pathname.startsWith(r))
  if (isPublicRoute) {
    // Kalau sudah login dan ke /login, redirect ke home sesuai role
    if (user && pathname === '/login') {
      // Baca role dari JWT app_metadata — TANPA query DB
      const role = (user.app_metadata?.role as string | undefined) ?? 'staff'
      return redirectWithCookies(getDefaultRoute(role))
    }
    return supabaseResponse
  }

  // Belum login → ke /login
  if (!user) {
    const url = new URL('/login', request.url)
    url.searchParams.set('next', pathname)
    return redirectWithCookies(url)
  }

  // Baca role & is_active dari JWT claims; fallback ke DB jika JWT hook belum aktif
  let role = (user.app_metadata?.role as string | undefined)
  let isActive = (user.app_metadata?.is_active as boolean | undefined) ?? true
  if (!role) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()
    role = (profile?.role as string | undefined) ?? 'staff'
    isActive = (profile?.is_active as boolean | undefined) ?? true
  }

  // Akun nonaktif → redirect login
  if (!isActive) {
    await supabase.auth.signOut()
    return redirectWithCookies('/login?error=account_disabled')
  }

  // Check admin-only routes
  const isAdminRoute = ADMIN_ONLY_ROUTES.some(r => pathname.startsWith(r))
  if (isAdminRoute && role !== 'admin') {
    return redirectWithCookies(getDefaultRoute(role))
  }

  // Check IT/Admin routes
  const isITRoute = IT_ADMIN_ROUTES.some(r => pathname.startsWith(r))
  if (isITRoute && role !== 'it_admin' && role !== 'admin') {
    return redirectWithCookies(getDefaultRoute(role))
  }

  // Check sarana-or-admin routes
  const isSaranaOrAdminRoute = SARANA_OR_ADMIN_ROUTES.some(r => pathname.startsWith(r))
  if (isSaranaOrAdminRoute && role !== 'sarana' && role !== 'admin') {
    return redirectWithCookies(getDefaultRoute(role))
  }

  // Redirect root ke halaman default sesuai role
  if (pathname === '/') {
    return redirectWithCookies(getDefaultRoute(role))
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

export default proxy
