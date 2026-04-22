'use client'
// =============================================================================
// app/(dashboard)/tickets/error.tsx
// =============================================================================
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-lg font-semibold">Terjadi Kesalahan</h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>Coba Lagi</Button>
    </div>
  )
}
