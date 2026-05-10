import { Skeleton } from '@/components/ui/skeleton'

export default function InventarisLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-11 w-11 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-6">
          <Skeleton className="h-6 w-36 mb-4" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="rounded-xl border bg-card p-6">
          <Skeleton className="h-6 w-36 mb-4" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  )
}
