'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ClipboardList, Plus, CheckCircle, ChevronDown, ChevronUp, AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import {
  startOpname, updateOpnameItem, completeOpname,
} from '@/lib/actions/inventory-actions'
import type { OpnameSession, Item, Room } from '@/lib/types'

interface Props {
  sessions: OpnameSession[]
  items: Item[]
  rooms: Room[]
}

interface OpnameItemForm {
  item_id: string
  room_id: string
  expected_qty: string
}

export function OpnameClient({ sessions, items, rooms }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [showNew, setShowNew] = useState(false)
  const [expandedSession, setExpandedSession] = useState<string | null>(null)

  // Form untuk sesi baru
  const [notes, setNotes] = useState('')
  const [opnameItems, setOpnameItems] = useState<OpnameItemForm[]>([
    { item_id: '', room_id: '', expected_qty: '0' },
  ])

  // State untuk edit actual_qty
  const [editingQty, setEditingQty] = useState<Record<string, string>>({})

  function addItemRow() {
    setOpnameItems(prev => [...prev, { item_id: '', room_id: '', expected_qty: '0' }])
  }

  function removeItemRow(idx: number) {
    setOpnameItems(prev => prev.filter((_, i) => i !== idx))
  }

  function updateItemRow(idx: number, field: keyof OpnameItemForm, value: string) {
    setOpnameItems(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row))
  }

  async function handleStartOpname() {
    const validItems = opnameItems.filter(r => r.item_id)
    if (validItems.length === 0) {
      toast.error('Tambahkan minimal 1 barang untuk diopname')
      return
    }

    const result = await startOpname({
      notes: notes || undefined,
      items: validItems.map(r => ({
        item_id: r.item_id,
        room_id: r.room_id || null,
        // Validasi angka sebelum dikirim
        expected_qty: Math.max(0, Number(r.expected_qty) || 0),
      })),
    })

    if (result.success) {
      toast.success('Sesi opname dimulai')
      setShowNew(false)
      setNotes('')
      setOpnameItems([{ item_id: '', room_id: '', expected_qty: '0' }])
      startTransition(() => router.refresh())
    } else {
      toast.error(result.error)
    }
  }

  async function handleUpdateActualQty(opnameItemId: string) {
    const rawVal = editingQty[opnameItemId]

    // Validasi — inilah yang menyebabkan "invalid syntax" sebelumnya
    const parsed = Number(rawVal)
    if (rawVal === undefined || rawVal === '' || !Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) {
      toast.error('Jumlah aktual harus berupa angka bulat ≥ 0')
      return
    }

    const result = await updateOpnameItem({ id: opnameItemId, actual_qty: parsed })
    if (result.success) {
      toast.success('Jumlah aktual disimpan')
      startTransition(() => router.refresh())
    } else {
      toast.error(result.error)
    }
  }

  async function handleCompleteOpname(sessionId: string) {
    const result = await completeOpname(sessionId)
    if (result.success) {
      toast.success('Opname selesai. Stok barang telah diperbarui.')
      startTransition(() => router.refresh())
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Opname Barang</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Hitung stok fisik dan sesuaikan dengan data sistem
          </p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Mulai Opname
        </Button>
      </div>

      {/* Session list */}
      {sessions.length === 0 ? (
        <div className="border rounded-lg py-16 text-center text-muted-foreground">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Belum ada sesi opname</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(session => {
            const isExpanded = expandedSession === session.id
            const isDraft = session.status === 'draft'
            const opItems = session.opname_items ?? []
            const hasDiscrepancy = opItems.some(oi => oi.actual_qty !== oi.expected_qty && oi.actual_qty > 0)

            return (
              <div key={session.id} className="border rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30"
                  onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          Opname {formatDate(session.created_at)}
                        </span>
                        <Badge variant={isDraft ? 'secondary' : 'default'}>
                          {isDraft ? 'Draft' : 'Selesai'}
                        </Badge>
                        {hasDiscrepancy && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Ada Selisih
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {opItems.length} barang · {session.conductor?.full_name}
                        {session.notes && ` · ${session.notes}`}
                      </p>
                    </div>
                  </div>
                  {isDraft && (
                    <Button
                      size="sm"
                      variant="default"
                      className="shrink-0"
                      onClick={e => { e.stopPropagation(); handleCompleteOpname(session.id) }}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Selesaikan & Terapkan
                    </Button>
                  )}
                </div>

                {isExpanded && (
                  <div className="border-t">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium">Barang</th>
                          <th className="text-left px-4 py-2 font-medium">Ruangan</th>
                          <th className="text-right px-4 py-2 font-medium">Sistem</th>
                          <th className="text-right px-4 py-2 font-medium">Fisik</th>
                          <th className="text-right px-4 py-2 font-medium">Selisih</th>
                          {isDraft && <th className="px-4 py-2 font-medium w-24"></th>}
                        </tr>
                      </thead>
                      <tbody>
                        {opItems.map(oi => {
                          const diff = oi.actual_qty - oi.expected_qty
                          const hasEdited = editingQty[oi.id] !== undefined

                          return (
                            <tr key={oi.id} className={cn(
                              'border-t',
                              diff !== 0 && oi.actual_qty > 0 && 'bg-yellow-50 dark:bg-yellow-950/20'
                            )}>
                              <td className="px-4 py-2">{oi.item?.name ?? '—'}</td>
                              <td className="px-4 py-2 text-muted-foreground text-xs">
                                {oi.room?.name ?? 'Tanpa ruangan'}
                              </td>
                              <td className="px-4 py-2 text-right">{oi.expected_qty}</td>
                              <td className="px-4 py-2 text-right">
                                {isDraft ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    className="w-20 h-7 text-right text-sm ml-auto"
                                    value={hasEdited ? editingQty[oi.id] : String(oi.actual_qty)}
                                    onChange={e => setEditingQty(prev => ({ ...prev, [oi.id]: e.target.value }))}
                                    onKeyDown={e => e.key === 'Enter' && handleUpdateActualQty(oi.id)}
                                  />
                                ) : oi.actual_qty}
                              </td>
                              <td className={cn(
                                'px-4 py-2 text-right font-medium',
                                diff < 0 ? 'text-destructive' : diff > 0 ? 'text-orange-500' : 'text-muted-foreground'
                              )}>
                                {diff > 0 ? `+${diff}` : diff}
                              </td>
                              {isDraft && (
                                <td className="px-4 py-2">
                                  {hasEdited && (
                                    <Button
                                      size="sm" variant="ghost"
                                      className="h-7 text-xs"
                                      onClick={() => handleUpdateActualQty(oi.id)}
                                    >
                                      Simpan
                                    </Button>
                                  )}
                                </td>
                              )}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Dialog: Sesi Baru */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mulai Sesi Opname Baru</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Catatan (opsional)</label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opname bulanan, dll." />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Daftar Barang yang Diopname</label>
                <Button variant="outline" size="sm" onClick={addItemRow}>
                  <Plus className="h-3 w-3 mr-1" />
                  Tambah Baris
                </Button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {opnameItems.map((row, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Select value={row.item_id} onValueChange={v => updateItemRow(idx, 'item_id', v)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Pilih barang" />
                      </SelectTrigger>
                      <SelectContent>
                        {items.filter(i => !i.is_electronic).map(i => (
                          <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={row.room_id || 'none'} onValueChange={v => updateItemRow(idx, 'room_id', v === 'none' ? '' : v)}>
                      <SelectTrigger className="w-44">
                        <SelectValue placeholder="Ruangan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Tanpa ruangan</SelectItem>
                        {rooms.map(r => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-1 w-28 shrink-0">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">Sistem:</span>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        className="h-9 text-right"
                        value={row.expected_qty}
                        onChange={e => updateItemRow(idx, 'expected_qty', e.target.value)}
                      />
                    </div>

                    <Button
                      variant="ghost" size="sm"
                      className="text-destructive hover:text-destructive shrink-0"
                      onClick={() => removeItemRow(idx)}
                      disabled={opnameItems.length === 1}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Batal</Button>
            <Button onClick={handleStartOpname}>Mulai Opname</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
