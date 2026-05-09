import { Skeleton } from '@/components/ui/skeleton'

export default function TicketsLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="flex flex-col gap-4">
        {/* Filters skeleton */}
        <div className="flex gap-4">
          <Skeleton className="h-10 w-full md:w-64" />
          <Skeleton className="h-10 w-full md:w-32" />
          <Skeleton className="h-10 w-full md:w-32" />
        </div>
        
        {/* Table skeleton */}
        <div className="rounded-md border mt-4">
          <div className="border-b px-4 py-3 bg-muted/50">
            <Skeleton className="h-6 w-full" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-4 border-b flex justify-between">
              <Skeleton className="h-12 w-[30%]" />
              <Skeleton className="h-12 w-[20%]" />
              <Skeleton className="h-12 w-[15%]" />
              <Skeleton className="h-12 w-[10%]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
