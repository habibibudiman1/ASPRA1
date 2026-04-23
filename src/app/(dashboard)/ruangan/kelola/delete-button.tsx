'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { deleteRuangan } from '@/lib/actions/ruangan-actions'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export function DeleteRuanganButton({ id, nama }: { id: string; nama: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteRuangan(id)
      if (result.success) {
        toast.success(`Ruangan "${nama}" berhasil dihapus`)
        router.refresh()
      } else {
        toast.error(result.error ?? 'Gagal menghapus ruangan')
      }
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={(
          <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Ruangan?</AlertDialogTitle>
          <AlertDialogDescription>
            Ruangan <strong>&quot;{nama}&quot;</strong> akan dihapus secara permanen. Tindakan ini tidak bisa dibatalkan. Booking aktif yang terkait tidak bisa dihapus.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isPending ? 'Menghapus...' : 'Hapus'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
