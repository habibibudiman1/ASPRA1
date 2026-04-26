'use client'

// =============================================================================
// components/layout/sidebar.tsx
// Sidebar navigasi kiri — collapsible di desktop
// =============================================================================

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Ticket, Tag, Users, Timer, BarChart3,
  User, Plus, ChevronLeft, ChevronRight, LogOut,
  Package, Building2, Calendar, ClipboardList,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import { signOut } from '@/lib/actions/user-actions'
import { APP_NAME, APP_ORG } from '@/lib/constants'
import { getInitials } from '@/lib/utils'
import type { Profile } from '@/lib/types'

const ICON_MAP = {
  LayoutDashboard, Ticket, Tag, Users, Timer, BarChart3, User, Plus,
  Package, Building2, Calendar, ClipboardList,
}

const STAFF_NAV = [
  { href: '/tickets', label: 'Tiket Saya', icon: 'Ticket' },
  { href: '/tickets/new', label: 'Buat Tiket', icon: 'Plus' },
  { href: '/rooms', label: 'Ruangan', icon: 'Building2' },
  { href: '/rooms/booking', label: 'Booking Ruangan', icon: 'Calendar' },
  { href: '/settings', label: 'Profil', icon: 'User' },
]

const ADMIN_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/tickets', label: 'Semua Tiket', icon: 'Ticket' },
  { href: '/inventory', label: 'Inventaris', icon: 'Package' },
  { href: '/inventory/opname', label: 'Opname', icon: 'ClipboardList' },
  { href: '/rooms', label: 'Ruangan', icon: 'Building2' },
  { href: '/rooms/booking', label: 'Booking Ruangan', icon: 'Calendar' },
  { href: '/categories', label: 'Kategori Tiket', icon: 'Tag' },
  { href: '/users', label: 'Pengguna', icon: 'Users' },
  { href: '/sla', label: 'SLA', icon: 'Timer' },
  { href: '/reports', label: 'Laporan', icon: 'BarChart3' },
  { href: '/settings', label: 'Profil', icon: 'User' },
]

interface SidebarProps {
  profile: Profile
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ profile, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const navItems = profile.role === 'it_admin' ? ADMIN_NAV : STAFF_NAV

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'hidden md:flex flex-col h-full transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-60'
        )}
        style={{ background: 'hsl(var(--sidebar))', borderRight: '1px solid hsl(var(--sidebar-border))' }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 p-4 border-b"
          style={{ borderColor: 'hsl(var(--sidebar-border))' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
            style={{ background: 'hsl(var(--sidebar-primary))', color: 'hsl(var(--sidebar-primary-foreground))' }}
          >
            IT
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-semibold text-sm truncate" style={{ color: 'hsl(var(--sidebar-foreground))' }}>
                {APP_NAME}
              </p>
              <p className="text-xs truncate opacity-60" style={{ color: 'hsl(var(--sidebar-foreground))' }}>
                {APP_ORG}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-3">
          <nav className="px-2 space-y-1">
            {navItems.map((item) => {
              const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP]
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href) && item.href !== '/tickets/new')
              const navLink = (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                  )}
                  style={
                    isActive
                      ? { background: 'hsl(var(--sidebar-accent))', color: 'hsl(var(--sidebar-accent-foreground))' }
                      : {}
                  }
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                )
              }
              return <div key={item.href}>{navLink}</div>
            })}
          </nav>
        </ScrollArea>

        {/* User & Logout */}
        <div
          className="p-3 border-t space-y-2"
          style={{ borderColor: 'hsl(var(--sidebar-border))' }}
        >
          {/* User Info */}
          {!collapsed && (
            <div
              className="flex items-center gap-3 rounded-lg px-2 py-2"
              style={{ background: 'hsl(var(--sidebar-accent) / 0.5)' }}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback
                  className="text-xs font-medium"
                  style={{ background: 'hsl(var(--sidebar-primary))', color: 'hsl(var(--sidebar-primary-foreground))' }}
                >
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-semibold truncate" style={{ color: 'hsl(var(--sidebar-foreground))' }}>
                  {profile.full_name}
                </p>
                <p className="text-xs opacity-60 truncate" style={{ color: 'hsl(var(--sidebar-foreground))' }}>
                  {profile.role === 'it_admin' ? 'IT Admin' : 'Staff'}
                </p>
              </div>
            </div>
          )}

          {/* Logout */}
          <form action={signOut}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'w-full text-xs opacity-60 hover:opacity-100 transition-opacity',
                    collapsed ? 'justify-center px-0' : 'justify-start gap-2'
                  )}
                  style={{ color: 'hsl(var(--sidebar-foreground))' }}
                >
                  <LogOut className="h-4 w-4" />
                  {!collapsed && 'Keluar'}
                </Button>
              </TooltipTrigger>
              {collapsed && <TooltipContent side="right">Keluar</TooltipContent>}
            </Tooltip>
          </form>

          {/* Toggle Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn('w-full opacity-40 hover:opacity-70 transition-opacity', collapsed ? 'justify-center px-0' : 'justify-end')}
            style={{ color: 'hsl(var(--sidebar-foreground))' }}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
