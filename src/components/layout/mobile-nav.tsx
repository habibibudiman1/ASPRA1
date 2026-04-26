'use client'

// =============================================================================
// components/layout/mobile-nav.tsx
// Bottom navigation untuk mobile — mendukung 3 role
// =============================================================================

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Ticket, User,
  Building2, Package, PackageCheck, CalendarDays, CheckSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Profile } from '@/lib/types'

interface MobileNavProps {
  profile: Profile
}

export function MobileNav({ profile }: MobileNavProps) {
  const pathname = usePathname()

  const items = profile.role === 'admin'
    ? [
        { href: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/tickets',    icon: Ticket,          label: 'Tiket' },
        { href: '/ruangan',    icon: Building2,       label: 'Ruangan' },
        { href: '/inventaris', icon: Package,         label: 'Inventaris' },
        { href: '/settings',   icon: User,            label: 'Profil' },
      ]
    : profile.role === 'it_admin'
    ? [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/tickets',   icon: Ticket,          label: 'Tiket' },
        { href: '/settings',  icon: User,            label: 'Profil' },
      ]
    : profile.role === 'sarana'
    ? [
        { href: '/ruangan/approval',      icon: CheckSquare,  label: 'Approval' },
        { href: '/ruangan',               icon: Building2,    label: 'Ruangan' },
        { href: '/inventaris',            icon: Package,      label: 'Inventaris' },
        { href: '/inventaris/peminjaman', icon: PackageCheck, label: 'Peminjaman' },
        { href: '/settings',              icon: User,         label: 'Profil' },
      ]
    : [
        { href: '/tickets',               icon: Ticket,       label: 'Tiket' },
        { href: '/ruangan/jadwal',        icon: CalendarDays, label: 'Ruangan' },
        { href: '/inventaris/peminjaman', icon: PackageCheck, label: 'Pinjam' },
        { href: '/settings',              icon: User,         label: 'Profil' },
      ]

  const isActive = (href: string) =>
    pathname === href || (href !== '/tickets/new' && pathname.startsWith(href + '/'))

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur">
      <div className="flex items-center justify-around h-16">
        {items.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors',
              isActive(href) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
