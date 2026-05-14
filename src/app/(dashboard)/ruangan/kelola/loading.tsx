import { Skeleton } from '@/components/ui/skeleton'

export default function KelolaRuanganLoading() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <div className="bg-muted/50 px-4 py-3 grid grid-cols-6 gap-4">
          {['Nama Ruangan', 'Lokasi', 'Kapasitas', 'Fasilitas', 'Status', 'Aksi'].map((h) => (
            <Skeleton key={h} className="h-4 w-20" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-4 py-3 border-t flex items-center gap-4">
            <Skeleton className="h-5 w-40 flex-1" />
            <Skeleton className="h-5 w-28 flex-1" />
            <Skeleton className="h-5 w-16" />
            <div className="flex gap-1 flex-1">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
