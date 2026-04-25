'use client'

// =============================================================================
// components/settings/settings-client.tsx
// Halaman pengaturan profil user
// =============================================================================

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Save, Loader2, User, Lock } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { updateProfile, changePassword } from '@/lib/actions/user-actions'
import { updateProfileSchema, changePasswordSchema, type UpdateProfileSchema, type ChangePasswordSchema } from '@/lib/validators/user-schema'
import { getInitials } from '@/lib/utils'
import type { Profile } from '@/lib/types'

interface SettingsClientProps { profile: Profile }

export function SettingsClient({ profile }: SettingsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const profileForm = useForm<UpdateProfileSchema>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { full_name: profile.full_name, department: profile.department ?? '' },
  })

  const passwordForm = useForm<ChangePasswordSchema>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { new_password: '', confirm_password: '' },
  })

  function onSaveProfile(values: UpdateProfileSchema) {
    startTransition(async () => {
      const fd = new FormData()
      if (values.full_name) fd.append('full_name', values.full_name)
      if (values.department) fd.append('department', values.department)
      const result = await updateProfile(fd)
      if (result.success) { toast.success('Profil berhasil diperbarui'); router.refresh() }
      else toast.error(result.error)
    })
  }

  function onChangePassword(values: ChangePasswordSchema) {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('new_password', values.new_password)
      fd.append('confirm_password', values.confirm_password)
      const result = await changePassword(fd)
      if (result.success) { toast.success('Password berhasil diubah'); passwordForm.reset() }
      else toast.error(result.error)
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">Pengaturan Profil</h2>
        <p className="text-muted-foreground text-sm mt-1">Kelola informasi akun Anda</p>
      </div>

      {/* Avatar & Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-5">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-lg">{profile.full_name}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <Badge variant="outline" className="mt-1 text-xs">
                {profile.role === 'admin' ? '🛡️ Admin' : profile.role === 'it_admin' ? '💻 IT' : profile.role === 'sarana' ? '🏢 Sarana' : '👤 Staff'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profil */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Informasi Profil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
              <FormField control={profileForm.control} name="full_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap</FormLabel>
                  <FormControl><Input id="profile-name" disabled={isPending} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={profileForm.control} name="department" render={({ field }) => (
                <FormItem>
                  <FormLabel>Departemen</FormLabel>
                  <FormControl><Input id="profile-dept" placeholder="Keuangan, SDM, TI, dll." disabled={isPending} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div>
                <FormLabel>Email</FormLabel>
                <Input value={profile.email} disabled className="mt-1.5 bg-muted" />
                <p className="text-xs text-muted-foreground mt-1">Email tidak bisa diubah</p>
              </div>
              <Button type="submit" disabled={isPending} id="profile-save">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Simpan Perubahan
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Ganti Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" /> Ganti Password
          </CardTitle>
          <CardDescription>Password minimal 8 karakter, mengandung huruf besar, kecil, dan angka</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
              <FormField control={passwordForm.control} name="new_password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password Baru</FormLabel>
                  <FormControl><Input id="new-password" type="password" disabled={isPending} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={passwordForm.control} name="confirm_password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Konfirmasi Password</FormLabel>
                  <FormControl><Input id="confirm-password" type="password" disabled={isPending} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" variant="outline" disabled={isPending} id="password-save">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                Ganti Password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
