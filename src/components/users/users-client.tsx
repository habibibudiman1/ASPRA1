'use client'

// =============================================================================
// components/users/users-client.tsx
// Manajemen User untuk IT Admin
// =============================================================================

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Power, Shield, User, Loader2, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createUser, toggleUserActive } from '@/lib/actions/user-actions'
import { getInitials } from '@/lib/utils'
import type { Profile } from '@/lib/types'

interface UsersClientProps { users: Profile[]; currentUserId: string }
type CreateUserForm = {
  full_name: string
  email: string
  role: 'staff' | 'it_admin' | 'admin' | 'sarana'
  department: string
  password: string
}

export function UsersClient({ users: initial, currentUserId }: UsersClientProps) {
  const [users, setUsers] = useState(initial)
  const [showCreate, setShowCreate] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<CreateUserForm>({ full_name: '', email: '', role: 'staff', department: '', password: '' })

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase())
  )

  const formFields: Array<{ key: keyof CreateUserForm; label: string; type: string; placeholder: string }> = [
    { key: 'full_name', label: 'Nama Lengkap *', type: 'text', placeholder: 'Nama lengkap' },
    { key: 'email', label: 'Email *', type: 'email', placeholder: 'nama@assakinah.or.id' },
    { key: 'department', label: 'Departemen', type: 'text', placeholder: 'Keuangan, SDM, dll.' },
    { key: 'password', label: 'Password *', type: 'password', placeholder: 'Min. 8 karakter' },
  ]

  function handleCreate() {
    startTransition(async () => {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      const result = await createUser(fd)
      if (result.success) { toast.success('User berhasil dibuat'); setShowCreate(false); window.location.reload() }
      else toast.error(result.error)
    })
  }

  function handleToggle(userId: string, current: boolean) {
    startTransition(async () => {
      const result = await toggleUserActive(userId, !current)
      if (result.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !current } : u))
        toast.success(!current ? 'User diaktifkan' : 'User dinonaktifkan')
      } else toast.error(result.error)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Manajemen Pengguna</h2>
          <p className="text-muted-foreground text-sm mt-1">{users.length} pengguna terdaftar</p>
        </div>
        <Button id="btn-tambah-user" onClick={() => setShowCreate(true)} className="flex-shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Tambah User
        </Button>
      </div>

      <Input placeholder="Cari nama, email, atau departemen..." value={search} onChange={(e) => setSearch(e.target.value)} id="user-search" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((user) => (
          <Card key={user.id} className={!user.is_active ? 'opacity-60' : ''}>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">{user.full_name}</p>
                    {user.id === currentUserId && <Badge variant="outline" className="text-xs">Anda</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <Badge
                  variant="outline"
                  className={`gap-1 text-xs ${
                    user.role === 'admin'
                      ? 'text-red-600 border-red-300'
                      : user.role === 'it_admin'
                        ? 'text-purple-600 border-purple-300'
                        : user.role === 'sarana'
                          ? 'text-orange-600 border-orange-300'
                          : 'text-blue-600 border-blue-300'
                  }`}
                >
                  {user.role === 'admin' || user.role === 'it_admin' ? (
                    <Shield className="h-3 w-3" />
                  ) : user.role === 'sarana' ? (
                    <Building2 className="h-3 w-3" />
                  ) : (
                    <User className="h-3 w-3" />
                  )}
                  {user.role === 'admin' ? 'Admin' : user.role === 'it_admin' ? 'IT' : user.role === 'sarana' ? 'Sarana' : 'Staff'}
                </Badge>
                {user.department && <Badge variant="outline" className="text-xs">{user.department}</Badge>}
                <Badge variant="outline" className={user.is_active ? 'text-green-600 border-green-300 text-xs' : 'text-gray-500 border-gray-300 text-xs'}>
                  {user.is_active ? '● Aktif' : '○ Nonaktif'}
                </Badge>
              </div>
              {user.id !== currentUserId && (
                <Button variant="outline" size="sm" className="w-full mt-3 text-xs" onClick={() => handleToggle(user.id, user.is_active)} disabled={isPending}>
                  <Power className="h-3.5 w-3.5 mr-1" />
                  {user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create User Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md bg-card border-border/50 shadow-xl opacity-100">
          <DialogHeader><DialogTitle>Tambah User Baru</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {formFields.map(({ key, label, type, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                <Input
                  id={`user-${key}`}
                  type={type}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label>Role *</Label>
              <Select value={form.role} onValueChange={(v: 'staff' | 'it_admin' | 'admin' | 'sarana') => setForm({ ...form, role: v })}>
                <SelectTrigger id="user-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="it_admin">IT</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="sarana">Sarana</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Batal</Button>
            <Button onClick={handleCreate} disabled={isPending || !form.full_name || !form.email || !form.password} id="user-submit">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Buat User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
