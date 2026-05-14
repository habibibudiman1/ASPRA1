import { Skeleton } from '@/components/ui/skeleton'

export default function BookingLoading() {
  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div><Skeleton className="h-8 w-48 mb-2" /><Skeleton className="h-4 w-64" /></div>
      <div className="rounded-xl border bg-card p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
        <Skeleton className="h-10 w-full rounded-md mt-2" />
      </div>
    </div>
  )
}
