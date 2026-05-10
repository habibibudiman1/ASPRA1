import { Skeleton } from '@/components/ui/skeleton'

export default function BookingLoading() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <Skeleton className="h-10 w-48" />
      <div className="rounded-xl border bg-card p-6 space-y-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-full mt-2" />
      </div>
    </div>
  )
}
