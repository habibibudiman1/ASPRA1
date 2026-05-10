import { Skeleton } from '@/components/ui/skeleton'

export default function RuanganKelolaLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="flex gap-3 flex-wrap">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card overflow-hidden">
            <Skeleton className="h-40 w-full" />
            <div className="p-4 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
