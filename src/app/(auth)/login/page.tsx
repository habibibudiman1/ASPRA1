'use client'

// =============================================================================
// app/(auth)/login/page.tsx
// Halaman Login — form email + password dengan validasi
// =============================================================================

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password tidak boleh kosong'),
})
type LoginSchema = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginSchema) {
    startTransition(async () => {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email atau password salah')
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Email belum dikonfirmasi')
        } else {
          toast.error(error.message)
        }
        return
      }

      if (!data.user) {
        toast.error('Login gagal, coba lagi')
        return
      }

      // Ambil role untuk redirect yang sesuai
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', data.user.id)
        .single()

      if (profile && !profile.is_active) {
        await supabase.auth.signOut()
        toast.error('Akun Anda dinonaktifkan. Hubungi IT Admin.')
        return
      }

      toast.success('Login berhasil! Selamat datang.')
      const redirectTo = profile?.role === 'it_admin' ? '/dashboard' : '/tickets'
      router.push(redirectTo)
      router.refresh()
    })
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Selamat Datang</h2>
        <p className="text-muted-foreground mt-1">
          Masuk ke akun Anda untuk melanjutkan
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="nama@assakinah.or.id"
                    autoComplete="email"
                    disabled={isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Masukkan password"
                      autoComplete="current-password"
                      disabled={isPending}
                      className="pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit */}
          <Button
            id="login-submit"
            type="submit"
            className="w-full mt-2"
            disabled={isPending}
            style={{ background: 'hsl(160 36% 18%)' }}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Masuk
              </>
            )}
          </Button>
        </form>
      </Form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Lupa password? Hubungi IT Admin untuk reset akun.
      </p>
    </div>
  )
}
