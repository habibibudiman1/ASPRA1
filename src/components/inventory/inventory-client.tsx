'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Package, Plus, Upload, ArrowLeftRight, Search, Filter,
  Pencil, Trash2, Monitor, ChevronDown, ChevronRight, Box,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  createItem, updateItem, deleteItem,
  createItemUnit, mutateItem, getItemById,
} from '@/lib/actions/inventory-actions'
import { ItemImport } from './item-import'
import type { Item, ItemCategory, Room, Profile, ItemUnit } from '@/lib/types'

interface Props {
  items: Item[]
  rooms: Room[]
  categories: ItemCategory[]
  profile: Profile
  filters: {
    room_id: string
    category_id: string
    search: string
    view: string
  }
}

type ModalType = 'add' | 'edit' | 'delete' | 'add-unit' | 'mutate' | 'import' | 'unit-detail' | null

export function InventoryClient({ items, rooms, categories, profile, filters }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const isAdmin = profile.role === 'it_admin'

  const [modal, setModal] = useState<ModalType>(null)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [itemUnits, setItemUnits] = useState<Record<string, ItemUnit[]>>({})
  const [loadingUnits, setLoadingUnits] = useState<Set<string>>(new Set())

  // Form state
  const [form, setForm] = useState({
    name: '', category_id: '', description: '', is_electronic: false,
  })
  const [unitForm, setUnitForm] = useState({
    unit_code: '', serial_number: '', room_id: '', condition: 'baik', notes: '',
    spec_processor: '', spec_ram: '', spec_storage: '', spec_display: '',
  })
  const [mutateForm, setMutateForm] = useState({
    from_room_id: '', to_room_id: '', quantity: '1',
    item_unit_id: '', reason: '',
  })

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/inventory?${params.toString()}`)
  }

  async function toggleExpand(item: Item) {
    if (!item.is_electronic) return
    const newSet = new Set(expandedItems)

    if (newSet.has(item.id)) {
      newSet.delete(item.id)
    } else {
      newSet.add(item.id)
      if (!itemUnits[item.id]) {
        setLoadingUnits(prev => new Set(prev).add(item.id))
        const detail = await getItemById(item.id)
        setItemUnits(prev => ({
          ...prev,
          [item.id]: (detail as { item_units?: ItemUnit[] })?.item_units ?? [],
        }))
        setLoadingUnits(prev => {
          const s = new Set(prev)
          s.delete(item.id)
          return s
        })
      }
    }

    setExpandedItems(newSet)
  }

  function openAdd() {
    setForm({ name: '', category_id: '', description: '', is_electronic: false })
    setModal('add')
  }

  function openEdit(item: Item) {
    setSelectedItem(item)
    setForm({
      name: item.name,
      category_id: item.item_category_id ?? '',
      description: item.description ?? '',
      is_electronic: item.is_electronic,
    })
    setModal('edit')
  }

  function openAddUnit(item: Item) {
    setSelectedItem(item)
    setUnitForm({
      unit_code: '', serial_number: '', room_id: '', condition: 'baik', notes: '',
      spec_processor: '', spec_ram: '', spec_storage: '', spec_display: '',
    })
    setModal('add-unit')
  }

  function openMutate(item: Item) {
    setSelectedItem(item)
    setMutateForm({ from_room_id: '', to_room_id: '', quantity: '1', item_unit_id: '', reason: '' })
    setModal('mutate')
  }

  async function handleSaveItem() {
    const cat = categories.find(c => c.id === form.category_id)
    const payload = {
      name: form.name,
      item_category_id: form.category_id,
      description: form.description,
      is_electronic: cat?.is_electronic ?? form.is_electronic,
    }

    let result
    if (modal === 'add') {
      result = await createItem(payload)
    } else {
      result = await updateItem({ id: selectedItem!.id, ...payload })
    }

    if (result.success) {
      toast.success(modal === 'add' ? 'Barang berhasil ditambahkan' : 'Barang berhasil diupdate')
      setModal(null)
      startTransition(() => router.refresh())
    } else {
      toast.error(result.error)
    }
  }

  async function handleDeleteItem() {
    if (!selectedItem) return
    const result = await deleteItem(selectedItem.id)
    if (result.success) {
      toast.success('Barang berhasil dihapus')
      setModal(null)
      startTransition(() => router.refresh())
    } else {
      toast.error(result.error)
    }
  }

  async function handleSaveUnit() {
    if (!selectedItem) return

    const specs: Record<string, string> = {}
    if (unitForm.spec_processor) specs.processor = unitForm.spec_processor
    if (unitForm.spec_ram) specs.ram = unitForm.spec_ram
    if (unitForm.spec_storage) specs.storage = unitForm.spec_storage
    if (unitForm.spec_display) specs.display = unitForm.spec_display

    const result = await createItemUnit({
      item_id: selectedItem.id,
      unit_code: unitForm.unit_code,
      serial_number: unitForm.serial_number || undefined,
      specs: Object.keys(specs).length > 0 ? specs : undefined,
      condition: unitForm.condition as 'baik' | 'rusak_ringan' | 'rusak_berat',
      room_id: unitForm.room_id || undefined,
      notes: unitForm.notes || undefined,
    })

    if (result.success) {
      toast.success('Unit barang berhasil ditambahkan')
      setModal(null)
      // Refresh unit list untuk item ini
      setItemUnits(prev => ({ ...prev, [selectedItem.id]: [] }))
      startTransition(() => router.refresh())
    } else {
      toast.error(result.error)
    }
  }

  async function handleMutate() {
    if (!selectedItem) return

    const result = await mutateItem({
      item_id: selectedItem.id,
      from_room_id: mutateForm.from_room_id || null,
      to_room_id: mutateForm.to_room_id,
      quantity: Number(mutateForm.quantity),
      item_unit_id: mutateForm.item_unit_id || undefined,
      reason: mutateForm.reason || undefined,
    })

    if (result.success) {
      toast.success('Barang berhasil dipindahkan')
      setModal(null)
      setItemUnits(prev => ({ ...prev, [selectedItem.id]: [] }))
      startTransition(() => router.refresh())
    } else {
      toast.error(result.error)
    }
  }

  const activeCategory = categories.find(c => c.id === filters.category_id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inventaris Barang</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {items.length} barang ditemukan
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setModal('import')}>
              <Upload className="h-4 w-4 mr-2" />
              Import CSV/Excel
            </Button>
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Barang
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama barang..."
            className="pl-9"
            defaultValue={filters.search}
            onChange={e => updateFilter('search', e.target.value)}
          />
        </div>

        <Select value={filters.room_id || 'all'} onValueChange={v => updateFilter('room_id', v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Semua Ruangan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Ruangan</SelectItem>
            {rooms.filter(r => r.is_active).map(r => (
              <SelectItem key={r.id} value={r.id}>{r.name} ({r.code})</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.category_id || 'all'} onValueChange={v => updateFilter('category_id', v === 'all' ? '' : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Item Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium w-8"></th>
              <th className="text-left px-4 py-3 font-medium">Nama Barang</th>
              <th className="text-left px-4 py-3 font-medium">Kategori</th>
              <th className="text-left px-4 py-3 font-medium">Tipe</th>
              <th className="text-left px-4 py-3 font-medium">Keterangan</th>
              {isAdmin && <th className="text-right px-4 py-3 font-medium">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="text-center py-12 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Tidak ada barang
                </td>
              </tr>
            )}
            {items.map(item => (
              <>
                <tr
                  key={item.id}
                  className={cn(
                    'border-t hover:bg-muted/30 transition-colors',
                    item.is_electronic && 'cursor-pointer'
                  )}
                  onClick={() => item.is_electronic && toggleExpand(item)}
                >
                  <td className="px-4 py-3">
                    {item.is_electronic ? (
                      expandedItems.has(item.id)
                        ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Box className="h-4 w-4 text-muted-foreground/40" />
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.category?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    {item.is_electronic ? (
                      <Badge variant="secondary" className="gap-1">
                        <Monitor className="h-3 w-3" />
                        Elektronik
                      </Badge>
                    ) : (
                      <Badge variant="outline">Non-Elektronik</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {item.description ?? '—'}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        {item.is_electronic && (
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openAddUnit(item)}>
                            <Plus className="h-3 w-3 mr-1" />
                            Unit
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openMutate(item)}>
                          <ArrowLeftRight className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openEdit(item)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost" size="sm" className="h-7 px-2 text-destructive hover:text-destructive"
                          onClick={() => { setSelectedItem(item); setModal('delete') }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>

                {/* Expand: unit elektronik */}
                {item.is_electronic && expandedItems.has(item.id) && (
                  <tr key={`${item.id}-units`} className="bg-muted/20">
                    <td colSpan={isAdmin ? 6 : 5} className="px-8 py-3">
                      {loadingUnits.has(item.id) ? (
                        <p className="text-xs text-muted-foreground">Memuat unit...</p>
                      ) : (itemUnits[item.id]?.length ?? 0) === 0 ? (
                        <p className="text-xs text-muted-foreground">Belum ada unit terdaftar.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {(itemUnits[item.id] ?? []).map(unit => (
                            <div key={unit.id} className="border rounded-md p-3 bg-background text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold">{unit.unit_code}</span>
                                <Badge
                                  variant={unit.condition === 'baik' ? 'default' : 'destructive'}
                                  className="text-xs"
                                >
                                  {unit.condition === 'baik' ? 'Baik'
                                    : unit.condition === 'rusak_ringan' ? 'Rusak Ringan'
                                    : 'Rusak Berat'}
                                </Badge>
                              </div>
                              {unit.serial_number && (
                                <p className="text-muted-foreground">S/N: {unit.serial_number}</p>
                              )}
                              {unit.room && (
                                <p className="text-muted-foreground">
                                  📍 {unit.room.name} ({unit.room.code})
                                </p>
                              )}
                              {unit.specs && (
                                <div className="text-muted-foreground space-y-0.5">
                                  {Object.entries(unit.specs).map(([k, v]) => (
                                    <p key={k}><span className="capitalize">{k}</span>: {v}</p>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Add/Edit Item */}
      <Dialog open={modal === 'add' || modal === 'edit'} onOpenChange={() => setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modal === 'add' ? 'Tambah Barang' : 'Edit Barang'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nama Barang *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Komputer, Kursi" />
            </div>
            <div>
              <label className="text-sm font-medium">Kategori *</label>
              <Select value={form.category_id} onValueChange={v => {
                const cat = categories.find(c => c.id === v)
                setForm(f => ({ ...f, category_id: v, is_electronic: cat?.is_electronic ?? false }))
              }}>
                <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Keterangan</label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Opsional" />
            </div>
            {form.category_id && (
              <p className="text-xs text-muted-foreground">
                {categories.find(c => c.id === form.category_id)?.is_electronic
                  ? '⚡ Elektronik — setiap unit akan dilacak secara individual'
                  : '📦 Non-Elektronik — dilacak berdasarkan jumlah per ruangan'}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>Batal</Button>
            <Button onClick={handleSaveItem} disabled={!form.name || !form.category_id}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Add Unit */}
      <Dialog open={modal === 'add-unit'} onOpenChange={() => setModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Unit — {selectedItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Kode Unit *</label>
                <Input value={unitForm.unit_code} onChange={e => setUnitForm(f => ({ ...f, unit_code: e.target.value }))} placeholder="e.g. KOMP-001" />
              </div>
              <div>
                <label className="text-sm font-medium">Nomor Seri</label>
                <Input value={unitForm.serial_number} onChange={e => setUnitForm(f => ({ ...f, serial_number: e.target.value }))} placeholder="Opsional" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Ruangan</label>
                <Select value={unitForm.room_id || 'none'} onValueChange={v => setUnitForm(f => ({ ...f, room_id: v === 'none' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder="Pilih ruangan" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak ada</SelectItem>
                    {rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name} ({r.code})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Kondisi</label>
                <Select value={unitForm.condition} onValueChange={v => setUnitForm(f => ({ ...f, condition: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baik">Baik</SelectItem>
                    <SelectItem value="rusak_ringan">Rusak Ringan</SelectItem>
                    <SelectItem value="rusak_berat">Rusak Berat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground">Spesifikasi (opsional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs">Processor</label>
                <Input value={unitForm.spec_processor} onChange={e => setUnitForm(f => ({ ...f, spec_processor: e.target.value }))} placeholder="e.g. Intel i5-10400" />
              </div>
              <div>
                <label className="text-xs">RAM</label>
                <Input value={unitForm.spec_ram} onChange={e => setUnitForm(f => ({ ...f, spec_ram: e.target.value }))} placeholder="e.g. 8GB DDR4" />
              </div>
              <div>
                <label className="text-xs">Storage</label>
                <Input value={unitForm.spec_storage} onChange={e => setUnitForm(f => ({ ...f, spec_storage: e.target.value }))} placeholder="e.g. 256GB SSD" />
              </div>
              <div>
                <label className="text-xs">Display</label>
                <Input value={unitForm.spec_display} onChange={e => setUnitForm(f => ({ ...f, spec_display: e.target.value }))} placeholder="e.g. 21.5 inch" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Catatan</label>
              <Input value={unitForm.notes} onChange={e => setUnitForm(f => ({ ...f, notes: e.target.value }))} placeholder="Opsional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>Batal</Button>
            <Button onClick={handleSaveUnit} disabled={!unitForm.unit_code}>Simpan Unit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Mutasi (Pindah Barang) */}
      <Dialog open={modal === 'mutate'} onOpenChange={() => setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pindah Barang — {selectedItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedItem?.is_electronic && (
              <div>
                <label className="text-sm font-medium">Unit yang Dipindahkan *</label>
                <Select value={mutateForm.item_unit_id} onValueChange={v => {
                  const unit = (itemUnits[selectedItem?.id ?? ''] ?? []).find(u => u.id === v)
                  setMutateForm(f => ({
                    ...f,
                    item_unit_id: v,
                    from_room_id: unit?.room_id ?? '',
                  }))
                }}>
                  <SelectTrigger><SelectValue placeholder="Pilih unit" /></SelectTrigger>
                  <SelectContent>
                    {(itemUnits[selectedItem?.id ?? ''] ?? []).map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.unit_code} — {u.room?.name ?? 'Tanpa ruangan'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(itemUnits[selectedItem?.id ?? ''] ?? []).length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Buka daftar unit terlebih dahulu dengan mengklik baris barang.
                  </p>
                )}
              </div>
            )}

            {!selectedItem?.is_electronic && (
              <div>
                <label className="text-sm font-medium">Dari Ruangan</label>
                <Select value={mutateForm.from_room_id || 'none'} onValueChange={v => setMutateForm(f => ({ ...f, from_room_id: v === 'none' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder="Gudang / tidak ada" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Gudang (tanpa ruangan)</SelectItem>
                    {rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name} ({r.code})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Ke Ruangan *</label>
              <Select value={mutateForm.to_room_id} onValueChange={v => setMutateForm(f => ({ ...f, to_room_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Pilih ruangan tujuan" /></SelectTrigger>
                <SelectContent>
                  {rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name} ({r.code})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {!selectedItem?.is_electronic && (
              <div>
                <label className="text-sm font-medium">Jumlah *</label>
                <Input
                  type="number" min="1"
                  value={mutateForm.quantity}
                  onChange={e => setMutateForm(f => ({ ...f, quantity: e.target.value }))}
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Alasan Pemindahan</label>
              <Input value={mutateForm.reason} onChange={e => setMutateForm(f => ({ ...f, reason: e.target.value }))} placeholder="Opsional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>Batal</Button>
            <Button
              onClick={handleMutate}
              disabled={!mutateForm.to_room_id || (selectedItem?.is_electronic && !mutateForm.item_unit_id)}
            >
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Pindahkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Delete */}
      <Dialog open={modal === 'delete'} onOpenChange={() => setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Barang</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Yakin ingin menghapus <strong>{selectedItem?.name}</strong>?
            Semua unit dan data terkait juga akan terhapus.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDeleteItem}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Import */}
      <Dialog open={modal === 'import'} onOpenChange={() => setModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Barang dari CSV/Excel</DialogTitle>
          </DialogHeader>
          <ItemImport
            categories={categories}
            rooms={rooms}
            onSuccess={() => {
              setModal(null)
              startTransition(() => router.refresh())
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
