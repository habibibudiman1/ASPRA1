// =============================================================================
// app/(dashboard)/loading.tsx
// Global loading skeleton untuk halaman di dalam dashboard
// =============================================================================

import { Loader2 } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-background/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Memuat data...</p>
      </div>
    </div>
  )
}
