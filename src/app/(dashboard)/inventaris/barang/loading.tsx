import { Skeleton } from '@/components/ui/skeleton'

export default function InventarisBarangLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="flex gap-3 flex-wrap">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="rounded-md border">
        <div className="border-b px-4 py-3 bg-muted/50">
          <Skeleton className="h-6 w-full" />
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="px-4 py-4 border-b flex justify-between items-center">
            <Skeleton className="h-10 w-[25%]" />
            <Skeleton className="h-5 w-[15%]" />
            <Skeleton className="h-5 w-[10%]" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
