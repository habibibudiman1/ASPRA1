'use client'

// =============================================================================
// components/layout/sidebar.tsx
// Sidebar navigasi kiri — collapsible, mendukung grouped nav & 3 role
// =============================================================================

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Ticket, Tag, Users, Timer, BarChart3,
  User, Plus, ChevronLeft, ChevronRight, LogOut,
  Building2, CalendarDays, CalendarPlus, ClipboardList,
  CheckSquare, Settings, LayoutGrid, Package, PackageCheck,
  ShoppingCart, ArrowLeftRight, ClipboardCheck, FileBarChart,
  ArrowDownCircle, ArrowUpCircle, AlertTriangle, PackageX, Trash2, Wrench, Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import { signOut } from '@/lib/actions/user-actions'
import { APP_NAME, APP_ORG, STAFF_NAV_ITEMS, IT_NAV_ITEMS, ADMIN_NAV_ITEMS, SARANA_NAV_ITEMS } from '@/lib/constants'
import { getInitials } from '@/lib/utils'
import type { Profile } from '@/lib/types'

const ICON_MAP = {
  LayoutDashboard, Ticket, Tag, Users, Timer, BarChart3, User, Plus,
  Building2, CalendarDays, CalendarPlus, ClipboardList,
  CheckSquare, Settings, LayoutGrid, Package, PackageCheck,
  ShoppingCart, ArrowLeftRight, ClipboardCheck, FileBarChart,
  ArrowDownCircle, ArrowUpCircle, AlertTriangle, PackageX, Trash2, Wrench, Activity,
}

interface NavGroup {
  group: string
  items: { href: string; label: string; icon: string }[]
}

interface SidebarProps {
  profile: Profile
  collapsed: boolean
  onToggle: () => void
  mobile?: boolean
  onNavigate?: () => void
}

function getRoleLabel(role: string): string {
  switch (role) {
    case 'admin':    return 'Admin'
    case 'it_admin': return 'IT'
    case 'sarana':   return 'Sarana'
    default:         return 'Staff'
  }
}

function getNavItems(role: string): NavGroup[] {
  switch (role) {
    case 'admin':    return ADMIN_NAV_ITEMS
    case 'it_admin': return IT_NAV_ITEMS
    case 'sarana':   return SARANA_NAV_ITEMS
    default:         return STAFF_NAV_ITEMS
  }
}

export function Sidebar({ profile, collapsed, onToggle, mobile = false, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const navGroups = getNavItems(profile.role)

  const isActive = (href: string) => {
    if (href === '/tickets/new') return pathname === href
    if (href === '/inventaris/peminjaman/baru') return pathname === href
    if (href === '/inventaris/barang' && (
      pathname.startsWith('/inventaris/lokasi') ||
      pathname.startsWith('/inventaris/barang')
    )) return true
    if (href === '/ruangan' && pathname.startsWith('/ruangan/')) return pathname === '/ruangan'
    if (href === '/inventaris' && pathname.startsWith('/inventaris/')) return pathname === '/inventaris'
    return pathname === href || (href !== '/' && pathname.startsWith(href + '/'))
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          mobile ? 'flex flex-col h-full' : 'hidden md:flex flex-col h-full transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-64'
        )}
        style={{ background: 'hsl(var(--sidebar))', borderRight: '1px solid hsl(var(--sidebar-border))' }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 p-4 border-b flex-shrink-0"
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

        {/* Navigation — Grouped */}
        <ScrollArea className="flex-1 py-2">
          <nav className="px-2 space-y-1">
            {navGroups.map((group) => (
              <div key={group.group}>
                {/* Group Label */}
                {!collapsed && (
                  <p
                    className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider opacity-40 select-none"
                    style={{ color: 'hsl(var(--sidebar-foreground))' }}
                  >
                    {group.group}
                  </p>
                )}
                {collapsed && <div className="pt-2" />}

                {group.items.map((item) => {
                  const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP]
                  const active = isActive(item.href)

                  const navLink = (
                    <Link
                      href={item.href}
                      onClick={() => {
                        if (mobile) onNavigate?.()
                      }}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                        collapsed && 'justify-center px-0',
                        active
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                      )}
                      style={
                        active
                          ? { background: 'hsl(var(--sidebar-accent))', color: 'hsl(var(--sidebar-accent-foreground))' }
                          : {}
                      }
                    >
                      {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                      {!collapsed && <span className="truncate">{item.label}</span>}
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
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* User & Logout */}
        <div
          className="p-3 border-t space-y-2 flex-shrink-0"
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
                  {getRoleLabel(profile.role)}
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
