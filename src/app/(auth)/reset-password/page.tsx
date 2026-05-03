// =============================================================================
// app/(auth)/reset-password/page.tsx
// Halaman Reset Password — user memasukkan password baru setelah klik link email
// =============================================================================

'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'

const schema = z.object({
  password: z.string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[A-Z]/, 'Harus ada huruf kapital')
    .regex(/[0-9]/, 'Harus ada angka'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, {
  message: 'Konfirmasi password tidak cocok',
  path: ['confirm'],
})
type Schema = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [sessionReady, setSessionReady] = useState<boolean | null>(null)

  // Supabase mengirim token sebagai hash fragment — harus diproses di client
  useEffect(() => {
    const supabase = createClient()
    // getSession akan membaca token dari URL hash secara otomatis
    supabase.auth.getSession().then(({ data }) => {
      setSessionReady(!!data.session)
    })
  }, [])

  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm: '' },
  })

  function onSubmit(values: Schema) {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: values.password })
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Password berhasil diubah! Silakan login kembali.')
        router.push('/login')
      }
    })
  }

  // Loading state
  if (sessionReady === null) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">Memverifikasi link...</p>
      </div>
    )
  }

  // Link tidak valid / sudah expired
  if (!sessionReady) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <ShieldAlert className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold">Link Tidak Valid</h2>
        <p className="text-muted-foreground">
          Link reset password sudah kedaluwarsa atau tidak valid.
          Silakan minta link baru.
        </p>
        <Button asChild style={{ background: 'hsl(160 36% 18%)' }}>
          <a href="/lupa-password">Minta Link Baru</a>
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Reset Password</h2>
        <p className="text-muted-foreground mt-1">Masukkan password baru untuk akun Anda.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Password Baru */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password Baru</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Min. 8 karakter, 1 huruf kapital, 1 angka"
                      autoComplete="new-password"
                      disabled={isPending}
                      className="pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Konfirmasi Password */}
          <FormField
            control={form.control}
            name="confirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Konfirmasi Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Ulangi password baru"
                      autoComplete="new-password"
                      disabled={isPending}
                      className="pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            id="reset-submit"
            type="submit"
            className="w-full mt-2"
            disabled={isPending}
            style={{ background: 'hsl(160 36% 18%)' }}
          >
            {isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>
            ) : (
              <><CheckCircle2 className="mr-2 h-4 w-4" />Simpan Password Baru</>
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}
