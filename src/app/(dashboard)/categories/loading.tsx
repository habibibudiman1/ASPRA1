import { Skeleton } from '@/components/ui/skeleton'

export default function CategoriesLoading() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div><Skeleton className="h-8 w-40 mb-2" /><Skeleton className="h-4 w-36" /></div>
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="rounded-lg border overflow-hidden">
        <div className="bg-muted/50 px-4 py-3"><Skeleton className="h-4 w-full" /></div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-4 py-3 border-t flex items-center gap-4">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-5 w-24 rounded-full" />
            <div className="flex gap-2"><Skeleton className="h-8 w-16 rounded" /><Skeleton className="h-8 w-16 rounded" /></div>
          </div>
        ))}
      </div>
    </div>
  )
}
