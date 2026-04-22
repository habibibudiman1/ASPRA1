'use client'

// =============================================================================
// components/categories/categories-client.tsx
// CRUD Kategori untuk IT Admin
// =============================================================================

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Power, Loader2, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { createCategory, updateCategory, toggleCategoryActive, deleteCategory } from '@/lib/actions/category-actions'
import type { Category } from '@/lib/types'

interface CategoriesClientProps { categories: Category[] }

export function CategoriesClient({ categories: initial }: CategoriesClientProps) {
  const [categories, setCategories] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1' })

  function openCreate() { setForm({ name: '', description: '', color: '#6366f1' }); setEditingId(null); setShowForm(true) }
  function openEdit(cat: Category) { setForm({ name: cat.name, description: cat.description ?? '', color: cat.color }); setEditingId(cat.id); setShowForm(true) }

  function handleSave() {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('description', form.description)
      fd.append('color', form.color)

      const result = editingId ? await updateCategory(editingId, fd) : await createCategory(fd)
      if (result.success) {
        toast.success(editingId ? 'Kategori diperbarui' : 'Kategori dibuat')
        setShowForm(false)
        window.location.reload()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      const result = await toggleCategoryActive(id, !current)
      if (result.success) {
        toast.success(!current ? 'Kategori diaktifkan' : 'Kategori dinonaktifkan')
        setCategories(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c))
      } else { toast.error(result.error) }
    })
  }

  async function handleDelete() {
    if (!deleteId) return
    const result = await deleteCategory(deleteId)
    if (result.success) { toast.success('Kategori dihapus'); window.location.reload() }
    else toast.error(result.error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Kategori Tiket</h2>
          <p className="text-muted-foreground text-sm mt-1">{categories.length} kategori terdaftar</p>
        </div>
        <Button id="btn-tambah-kategori" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Kategori
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <Card key={cat.id} className={!cat.is_active ? 'opacity-60' : ''}>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cat.color + '20' }}>
                    <Tag className="h-5 w-5" style={{ color: cat.color }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{cat.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{cat.description ?? 'Tanpa deskripsi'}</p>
                  </div>
                </div>
                <Badge variant="outline" className={cat.is_active ? 'text-green-600 border-green-300' : 'text-gray-500 border-gray-300'}>
                  {cat.is_active ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(cat)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleToggle(cat.id, cat.is_active)} disabled={isPending}>
                  <Power className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(cat.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Kategori' : 'Tambah Kategori Baru'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nama Kategori *</Label>
              <Input id="cat-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contoh: Hardware" />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea id="cat-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Opsional" className="min-h-20" />
            </div>
            <div className="space-y-2">
              <Label>Warna</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-10 h-10 rounded cursor-pointer border" />
                <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="font-mono text-sm" placeholder="#6366f1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={isPending || !form.name.trim()}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? 'Simpan' : 'Buat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Hapus Kategori?"
        description="Kategori tidak bisa dihapus jika masih digunakan oleh tiket. Pertimbangkan untuk menonaktifkan saja."
        confirmLabel="Ya, Hapus"
        onConfirm={handleDelete}
      />
    </div>
  )
}
