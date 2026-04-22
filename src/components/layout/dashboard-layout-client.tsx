'use client'

// =============================================================================
// components/layout/dashboard-layout-client.tsx
// Client wrapper untuk dashboard layout (state sidebar, mobile menu)
// =============================================================================

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import type { Profile } from '@/lib/types'

interface DashboardLayoutClientProps {
  profile: Profile
  children: React.ReactNode
}

export function DashboardLayoutClient({ profile, children }: DashboardLayoutClientProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Desktop */}
      <Sidebar
        profile={profile}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-60" aria-describedby={undefined}>
          <Sidebar
            profile={profile}
            collapsed={false}
            onToggle={() => setMobileMenuOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          profile={profile}
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav profile={profile} />
    </div>
  )
}
