import { Skeleton } from '@/components/ui/skeleton'

export default function CategoriesLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="rounded-md border">
        <div className="border-b px-4 py-3 bg-muted/50">
          <Skeleton className="h-6 w-full" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-4 py-4 border-b flex justify-between items-center">
            <Skeleton className="h-5 w-[40%]" />
            <Skeleton className="h-5 w-[20%]" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
