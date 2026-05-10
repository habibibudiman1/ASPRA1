import { Skeleton } from '@/components/ui/skeleton'

export default function ApprovalLoading() {
  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-amber-200 dark:border-amber-800 p-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-28 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full max-w-sm" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-3 w-48" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24 rounded" />
                <Skeleton className="h-9 w-20 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
