import { Skeleton } from '@/components/ui/skeleton'

export default function UsersLoading() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div><Skeleton className="h-8 w-40 mb-2" /><Skeleton className="h-4 w-36" /></div>
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-10 w-64" />
      <div className="rounded-lg border overflow-hidden">
        <div className="bg-muted/50 px-4 py-3"><Skeleton className="h-4 w-full" /></div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-4 py-3 border-t flex items-center gap-4">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-1"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-48" /></div>
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <div className="flex gap-2"><Skeleton className="h-8 w-16 rounded" /><Skeleton className="h-8 w-16 rounded" /></div>
          </div>
        ))}
      </div>
    </div>
  )
}
