'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, Plus, Pencil, Trash2, Users, MapPin, Eye, ToggleLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { createRoom, updateRoom, deleteRoom } from '@/lib/actions/room-actions'
import type { Room, Profile } from '@/lib/types'

interface Props {
  rooms: Room[]
  profile: Profile
}

export function RoomsClient({ rooms, profile }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const isAdmin = profile.role === 'it_admin'

  type Modal = 'add' | 'edit' | 'delete' | null
  const [modal, setModal] = useState<Modal>(null)
  const [selected, setSelected] = useState<Room | null>(null)
  const [form, setForm] = useState({ name: '', code: '', capacity: '', location: '', description: '' })

  function openAdd() {
    setForm({ name: '', code: '', capacity: '', location: '', description: '' })
    setModal('add')
  }

  function openEdit(room: Room) {
    setSelected(room)
    setForm({
      name: room.name,
      code: room.code,
      capacity: room.capacity?.toString() ?? '',
      location: room.location ?? '',
      description: room.description ?? '',
    })
    setModal('edit')
  }

  async function handleSave() {
    const payload = {
      name: form.name,
      code: form.code,
      capacity: form.capacity ? Number(form.capacity) : undefined,
      location: form.location || undefined,
      description: form.description || undefined,
    }

    const result = modal === 'add'
      ? await createRoom(payload)
      : await updateRoom({ id: selected!.id, ...payload })

    if (result.success) {
      toast.success(modal === 'add' ? 'Ruangan berhasil ditambahkan' : 'Ruangan berhasil diupdate')
      setModal(null)
      startTransition(() => router.refresh())
    } else {
      toast.error(result.error)
    }
  }

  async function handleToggleActive(room: Room) {
    const result = await updateRoom({ id: room.id, is_active: !room.is_active })
    if (result.success) {
      toast.success(room.is_active ? 'Ruangan dinonaktifkan' : 'Ruangan diaktifkan')
      startTransition(() => router.refresh())
    } else {
      toast.error(result.error)
    }
  }

  async function handleDelete() {
    if (!selected) return
    const result = await deleteRoom(selected.id)
    if (result.success) {
      toast.success('Ruangan berhasil dihapus')
      setModal(null)
      startTransition(() => router.refresh())
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Daftar Ruangan</h2>
          <p className="text-muted-foreground text-sm mt-1">{rooms.length} ruangan terdaftar</p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Ruangan
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.length === 0 && (
          <div className="col-span-3 text-center py-16 text-muted-foreground border rounded-lg">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Belum ada ruangan</p>
          </div>
        )}
        {rooms.map(room => (
          <div key={room.id} className="border rounded-lg p-4 space-y-3 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{room.name}</h3>
                  <Badge variant="outline" className="text-xs">{room.code}</Badge>
                  {!room.is_active && <Badge variant="secondary" className="text-xs">Nonaktif</Badge>}
                </div>
                {room.location && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {room.location}
                  </p>
                )}
                {room.capacity && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Kapasitas: {room.capacity} orang
                  </p>
                )}
              </div>
              {isAdmin && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => handleToggleActive(room)}>
                    <ToggleLeft className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openEdit(room)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost" size="sm" className="h-7 px-2 text-destructive hover:text-destructive"
                    onClick={() => { setSelected(room); setModal('delete') }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {room.description && (
              <p className="text-xs text-muted-foreground">{room.description}</p>
            )}

            <Link href={`/rooms/${room.id}`}>
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                Lihat Detail & Inventaris
              </Button>
            </Link>
          </div>
        ))}
      </div>

      {/* Modal Add/Edit */}
      <Dialog open={modal === 'add' || modal === 'edit'} onOpenChange={() => setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modal === 'add' ? 'Tambah Ruangan' : 'Edit Ruangan'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Nama Ruangan *</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Kelas A" />
              </div>
              <div>
                <label className="text-sm font-medium">Kode *</label>
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. KLS-A" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Kapasitas</label>
                <Input type="number" min="1" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} placeholder="Jumlah orang" />
              </div>
              <div>
                <label className="text-sm font-medium">Lokasi</label>
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Lantai 1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Deskripsi</label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Opsional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>Batal</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.code}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Delete */}
      <Dialog open={modal === 'delete'} onOpenChange={() => setModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Hapus Ruangan</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Yakin ingin menghapus <strong>{selected?.name}</strong>? Semua data inventaris dan booking di ruangan ini juga akan terhapus.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
