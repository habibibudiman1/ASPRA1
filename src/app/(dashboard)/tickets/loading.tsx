// =============================================================================
// app/(dashboard)/tickets/loading.tsx
// =============================================================================
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-3">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-40" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-xl" />
      ))}
    </div>
  )
}
