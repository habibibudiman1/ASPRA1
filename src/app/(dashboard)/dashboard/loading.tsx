import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardPageLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 rounded-xl border bg-card">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-10 w-20" />
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid gap-4 md:grid-cols-7">
        {/* Chart */}
        <div className="md:col-span-4 rounded-xl border bg-card p-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-[300px] w-full" />
        </div>
        
        {/* Recent Activity */}
        <div className="md:col-span-3 rounded-xl border bg-card p-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="space-y-2 w-full">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
