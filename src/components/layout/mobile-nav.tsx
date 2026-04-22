'use client'

// =============================================================================
// components/layout/mobile-nav.tsx
// Bottom navigation untuk mobile
// =============================================================================

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Ticket, Plus, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Profile } from '@/lib/types'

interface MobileNavProps {
  profile: Profile
}

export function MobileNav({ profile }: MobileNavProps) {
  const pathname = usePathname()

  const items =
    profile.role === 'it_admin'
      ? [
          { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { href: '/tickets', icon: Ticket, label: 'Tiket' },
          { href: '/settings', icon: User, label: 'Profil' },
        ]
      : [
          { href: '/tickets', icon: Ticket, label: 'Tiket Saya' },
          { href: '/tickets/new', icon: Plus, label: 'Buat Tiket' },
          { href: '/settings', icon: User, label: 'Profil' },
        ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur">
      <div className="flex items-center justify-around h-16">
        {items.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/tickets/new' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
