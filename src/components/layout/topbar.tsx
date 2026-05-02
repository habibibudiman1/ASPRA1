'use client'

// =============================================================================
// components/layout/topbar.tsx
// Topbar dengan breadcrumb, notification bell, user dropdown, theme toggle
// =============================================================================

import { usePathname } from 'next/navigation'
import { Moon, Sun, Menu } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotificationBell } from '@/components/shared/notification-bell'
import { signOut } from '@/lib/actions/user-actions'
import { getInitials } from '@/lib/utils'
import type { Profile } from '@/lib/types'

// Mapping path ke judul breadcrumb
const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard IT',
  '/tickets': 'Tiket',
  '/tickets/new': 'Buat Tiket Baru',
  '/categories': 'Kategori',
  '/users': 'Pengguna',
  '/sla': 'SLA Management',
  '/reports': 'Laporan IT',
  '/settings': 'Pengaturan Profil',
  // Ruangan
  '/ruangan': 'Dashboard Ruangan',
  '/ruangan/jadwal': 'Jadwal Ruangan',
  '/ruangan/booking': 'Booking Ruangan',
  '/ruangan/riwayat': 'Riwayat Booking',
  '/ruangan/approval': 'Approval Booking',
  '/ruangan/kelola': 'Kelola Ruangan',
  // Inventaris
  '/inventaris': 'Dashboard Inventaris',
  '/inventaris/barang': 'Data Barang',
  '/inventaris/barang/baru': 'Tambah Barang',
  '/inventaris/peminjaman': 'Peminjaman Barang',
  '/inventaris/peminjaman/baru': 'Ajukan Peminjaman',
  '/inventaris/mutasi': 'Mutasi Barang',
  '/inventaris/mutasi/baru': 'Tambah Mutasi',
  '/inventaris/stock-opname': 'Stock Opname',
  '/inventaris/laporan': 'Laporan Inventaris',
  '/notifications': 'Pusat Notifikasi',
  '/inventaris/lokasi': 'Lokasi Barang',
  '/inventaris/barang/nama': 'Detail Nama Barang',
}

interface TopbarProps {
  profile: Profile
  onMobileMenuOpen: () => void
}

export function Topbar({ profile, onMobileMenuOpen }: TopbarProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  // Tentukan judul halaman saat ini
  let pageTitle = 'Beranda'
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname === path || pathname.startsWith(path + '/')) {
      pageTitle = title
      break
    }
  }
  // Halaman detail tiket
  if (pathname.match(/^\/tickets\/[^/]+$/)) pageTitle = 'Detail Tiket'

  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 gap-4 flex-shrink-0 sticky top-0 z-40">
      {/* Kiri: Mobile menu + Breadcrumb */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-8 w-8"
          onClick={onMobileMenuOpen}
          id="mobile-menu-trigger"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-sm font-semibold">{pageTitle}</h1>
        </div>
      </div>

      {/* Kanan: Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          id="theme-toggle"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle tema</span>
        </Button>

        {/* Notification Bell */}
        <NotificationBell />

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 rounded-full p-0" id="user-menu">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs font-medium bg-primary text-primary-foreground">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{profile.full_name}</p>
                <p className="text-xs text-muted-foreground">{profile.email}</p>
                <span className="inline-flex mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {profile.role === 'admin' ? 'Admin' : profile.role === 'it_admin' ? 'IT' : profile.role === 'sarana' ? 'Sarana' : 'Staff'}
                  </span>
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/settings">Pengaturan Profil</a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={signOut}>
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full text-destructive focus:text-destructive">
                  Keluar
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
