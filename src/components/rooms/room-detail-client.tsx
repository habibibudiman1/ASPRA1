'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Package, ArrowLeftRight, Calendar, Monitor, Box,
  Plus, Pencil, ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import {
  setRoomItemQuantity, mutateItem, updateItemUnit,
} from '@/lib/actions/inventory-actions'
import type {
  RoomWithItems, Room, ItemCategory, RoomBooking, ItemMutation, Profile, ItemUnit, RoomItem,
} from '@/lib/types'

interface Props {
  room: RoomWithItems
  allRooms: Room[]
  categories: ItemCategory[]
  bookings: RoomBooking[]
  mutations: ItemMutation[]
  profile: Profile
}

export function RoomDetailClient({ room, allRooms, categories, bookings, mutations, profile }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const isAdmin = profile.role === 'it_admin'

  type Modal = 'edit-qty' | 'mutate-unit' | 'edit-unit' | null
  const [modal, setModal] = useState<Modal>(null)
  const [selectedRoomItem, setSelectedRoomItem] = useState<RoomItem | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<ItemUnit | null>(null)
  const [editQty, setEditQty] = useState('')
  const [mutateToRoom, setMutateToRoom] = useState('')
  const [mutateReason, setMutateReason] = useState('')
  const [editUnitField, setEditUnitField] = useState({ condition: '', room_id: '', notes: '' })

  async function handleSaveQty() {
    if (!selectedRoomItem) return

    const qty = Number(editQty)
    if (!Number.isInteger(qty) || qty < 0) {
      toast.error('Jumlah harus berupa angka bulat non-negatif')
      return
    }

    const result = await setRoomItemQuantity(room.id, selectedRoomItem.item_id, qty)
    if (result.success) {
      toast.success('Jumlah barang diperbarui')
      setModal(null)
      startTransition(() => router.refresh())
    } else {
      toast.error(result.error)
    }
  }

  async function handleMutateUnit() {
    if (!selectedUnit || !mutateToRoom) return

    const result = await mutateItem({
      item_id: selectedUnit.item_id,
      item_unit_id: selectedUnit.id,
      from_room_id: room.id,
      to_room_id: mutateToRoom,
      quantity: 1,
      reason: mutateReason || undefined,
    })

    if (result.success) {
      toast.success(`${selectedUnit.unit_code} berhasil dipindahkan`)
      setModal(null)
      startTransition(() => router.refresh())
    } else {
      toast.error(result.error)
    }
  }

  async function handleSaveUnit() {
    if (!selectedUnit) return
    const result = await updateItemUnit({
      id: selectedUnit.id,
      condition: editUnitField.condition as 'baik' | 'rusak_ringan' | 'rusak_berat',
      notes: editUnitField.notes || undefined,
    })

    if (result.success) {
      toast.success('Unit berhasil diupdate')
      setModal(null)
      startTransition(() => router.refresh())
    } else {
      toast.error(result.error)
    }
  }

  const nonElectronicItems = (room.room_items ?? []).filter(ri => !ri.item?.is_electronic)
  const electronicUnits = room.item_units ?? []
  const otherRooms = allRooms.filter(r => r.id !== room.id && r.is_active)

  // Group unit by item
  const unitsByItem = electronicUnits.reduce<Record<string, { item: ItemUnit['item']; units: ItemUnit[] }>>((acc, unit) => {
    const key = unit.item_id
    if (!acc[key]) acc[key] = { item: unit.item, units: [] }
    acc[key].units.push(unit)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/rooms" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1')}>
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{room.name}</h2>
            <Badge variant="outline">{room.code}</Badge>
            {!room.is_active && <Badge variant="secondary">Nonaktif</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            {room.location && `${room.location} · `}
            {room.capacity && `Kapasitas ${room.capacity} orang · `}
            {nonElectronicItems.length + Object.keys(unitsByItem).length} jenis barang
          </p>
        </div>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">
            <Package className="h-4 w-4 mr-2" />
            Inventaris ({nonElectronicItems.length + Object.keys(unitsByItem).length})
          </TabsTrigger>
          <TabsTrigger value="mutations">
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Mutasi ({mutations.length})
          </TabsTrigger>
          <TabsTrigger value="bookings">
            <Calendar className="h-4 w-4 mr-2" />
            Booking ({bookings.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB: INVENTARIS */}
        <TabsContent value="items" className="space-y-4 mt-4">
          {/* Non-elektronik */}
          {nonElectronicItems.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <Box className="h-4 w-4" />
                Non-Elektronik
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left px-4 py-2">Barang</th>
                      <th className="text-left px-4 py-2">Kategori</th>
                      <th className="text-right px-4 py-2">Jumlah</th>
                      {isAdmin && <th className="px-4 py-2 w-24"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {nonElectronicItems.map(ri => (
                      <tr key={ri.id} className="border-t">
                        <td className="px-4 py-2 font-medium">{ri.item?.name ?? '—'}</td>
                        <td className="px-4 py-2 text-muted-foreground text-xs">{ri.item?.category?.name ?? '—'}</td>
                        <td className="px-4 py-2 text-right font-semibold">{ri.quantity}</td>
                        {isAdmin && (
                          <td className="px-4 py-2 text-right">
                            <Button
                              variant="ghost" size="sm" className="h-7 text-xs"
                              onClick={() => {
                                setSelectedRoomItem(ri as unknown as RoomItem)
                                setEditQty(String(ri.quantity))
                                setModal('edit-qty')
                              }}
                            >
                              <Pencil className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Elektronik per unit */}
          {Object.values(unitsByItem).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Elektronik (per unit)
              </h3>
              <div className="space-y-3">
                {Object.values(unitsByItem).map(({ item, units }) => (
                  <div key={item?.id} className="border rounded-lg overflow-hidden">
                    <div className="px-4 py-2 bg-muted/30 flex items-center justify-between">
                      <span className="font-medium text-sm">{item?.name}</span>
                      <Badge variant="secondary">{units.length} unit</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3">
                      {units.map(unit => (
                        <div key={unit.id} className="border rounded-md p-3 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">{unit.unit_code}</span>
                            <div className="flex gap-1">
                              <Badge
                                variant={unit.condition === 'baik' ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {unit.condition === 'baik' ? 'Baik'
                                  : unit.condition === 'rusak_ringan' ? 'Rusak Ringan'
                                  : 'Rusak Berat'}
                              </Badge>
                            </div>
                          </div>

                          {unit.serial_number && (
                            <p className="text-muted-foreground">S/N: {unit.serial_number}</p>
                          )}

                          {unit.specs && Object.keys(unit.specs).length > 0 && (
                            <div className="text-muted-foreground space-y-0.5">
                              {Object.entries(unit.specs).map(([k, v]) => (
                                <p key={k}><span className="capitalize font-medium">{k}</span>: {v}</p>
                              ))}
                            </div>
                          )}

                          {unit.notes && <p className="text-muted-foreground italic">{unit.notes}</p>}

                          {isAdmin && (
                            <div className="flex gap-1 pt-1">
                              <Button
                                variant="outline" size="sm" className="flex-1 h-6 text-xs"
                                onClick={() => {
                                  setSelectedUnit(unit)
                                  setEditUnitField({
                                    condition: unit.condition,
                                    room_id: unit.room_id ?? '',
                                    notes: unit.notes ?? '',
                                  })
                                  setModal('edit-unit')
                                }}
                              >
                                <Pencil className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline" size="sm" className="flex-1 h-6 text-xs"
                                onClick={() => {
                                  setSelectedUnit(unit)
                                  setMutateToRoom('')
                                  setMutateReason('')
                                  setModal('mutate-unit')
                                }}
                              >
                                <ArrowLeftRight className="h-3 w-3 mr-1" />
                                Pindah
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {nonElectronicItems.length === 0 && Object.keys(unitsByItem).length === 0 && (
            <div className="text-center py-12 text-muted-foreground border rounded-lg">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Belum ada barang di ruangan ini</p>
              <Link href="/inventory" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-3')}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah via Inventaris
              </Link>
            </div>
          )}
        </TabsContent>

        {/* TAB: MUTASI */}
        <TabsContent value="mutations" className="mt-4">
          {mutations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg">
              <ArrowLeftRight className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Belum ada riwayat mutasi barang</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-2">Tanggal</th>
                    <th className="text-left px-4 py-2">Barang</th>
                    <th className="text-left px-4 py-2">Dari</th>
                    <th className="text-left px-4 py-2">Ke</th>
                    <th className="text-right px-4 py-2">Jml</th>
                    <th className="text-left px-4 py-2">Oleh</th>
                    <th className="text-left px-4 py-2">Alasan</th>
                  </tr>
                </thead>
                <tbody>
                  {mutations.map(m => (
                    <tr key={m.id} className="border-t">
                      <td className="px-4 py-2 text-xs text-muted-foreground">{formatDate(m.created_at)}</td>
                      <td className="px-4 py-2">
                        <div>{m.item?.name}</div>
                        {m.item_unit && <div className="text-xs text-muted-foreground">{m.item_unit.unit_code}</div>}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {m.from_room ? (
                          <span className={m.from_room_id === room.id ? 'text-destructive font-medium' : ''}>
                            {m.from_room.name}
                          </span>
                        ) : 'Gudang'}
                      </td>
                      <td className="px-4 py-2">
                        {m.to_room ? (
                          <span className={m.to_room_id === room.id ? 'text-green-600 font-medium' : ''}>
                            {m.to_room.name}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-2 text-right">{m.quantity}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{m.mover?.full_name}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{m.reason ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* TAB: BOOKING */}
        <TabsContent value="bookings" className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-muted-foreground">{bookings.length} booking</p>
            <Link href="/rooms/booking" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              <Calendar className="h-4 w-4 mr-2" />
              Kelola Booking
            </Link>
          </div>

          {bookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Belum ada booking</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bookings.slice(0, 10).map(b => (
                <div key={b.id} className="border rounded-lg px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{b.title}</span>
                      <Badge variant={b.status === 'cancelled' ? 'secondary' : 'default'}>
                        {b.status === 'cancelled' ? 'Dibatalkan' : 'Aktif'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(b.start_time)} — {formatDate(b.end_time)}
                    </p>
                    <p className="text-xs text-muted-foreground">{b.booker?.full_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal: Edit Qty */}
      <Dialog open={modal === 'edit-qty'} onOpenChange={() => setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Jumlah — {selectedRoomItem?.item?.name}</DialogTitle>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium">Jumlah di {room.name}</label>
            <Input
              type="number" min="0" step="1"
              value={editQty}
              onChange={e => setEditQty(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>Batal</Button>
            <Button onClick={handleSaveQty}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Pindah Unit */}
      <Dialog open={modal === 'mutate-unit'} onOpenChange={() => setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pindah Unit — {selectedUnit?.unit_code}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Ke Ruangan *</label>
              <Select value={mutateToRoom} onValueChange={setMutateToRoom}>
                <SelectTrigger><SelectValue placeholder="Pilih ruangan tujuan" /></SelectTrigger>
                <SelectContent>
                  {otherRooms.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name} ({r.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Alasan</label>
              <Input value={mutateReason} onChange={e => setMutateReason(e.target.value)} placeholder="Opsional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>Batal</Button>
            <Button onClick={handleMutateUnit} disabled={!mutateToRoom}>
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Pindahkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Edit Unit */}
      <Dialog open={modal === 'edit-unit'} onOpenChange={() => setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Unit — {selectedUnit?.unit_code}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Kondisi</label>
              <Select
                value={editUnitField.condition}
                onValueChange={v => setEditUnitField(f => ({ ...f, condition: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baik">Baik</SelectItem>
                  <SelectItem value="rusak_ringan">Rusak Ringan</SelectItem>
                  <SelectItem value="rusak_berat">Rusak Berat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Catatan</label>
              <Input value={editUnitField.notes} onChange={e => setEditUnitField(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>Batal</Button>
            <Button onClick={handleSaveUnit}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
