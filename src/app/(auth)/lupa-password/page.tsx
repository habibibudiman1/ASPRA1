// =============================================================================
// app/(auth)/lupa-password/page.tsx
// Halaman Lupa Password — kirim reset email via Supabase
// =============================================================================

'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'

const schema = z.object({
  email: z.string().email('Format email tidak valid'),
})
type Schema = z.infer<typeof schema>

export default function LupaPasswordPage() {
  const [isPending, startTransition] = useTransition()
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  function onSubmit(values: Schema) {
    setError(null)
    startTransition(async () => {
      const supabase = createClient()
      const { error: err } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (err) {
        setError(err.message)
      } else {
        setSent(true)
      }
    })
  }

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold">Email Terkirim!</h2>
        <p className="text-muted-foreground">
          Link reset password telah dikirim ke <strong>{form.getValues('email')}</strong>.
          Cek inbox atau folder spam Anda.
        </p>
        <p className="text-xs text-muted-foreground">
          Link berlaku selama 1 jam. Jika tidak menerima email, hubungi IT Admin.
        </p>
        <Button variant="outline" asChild className="mt-2">
          <Link href="/login"><ArrowLeft className="h-4 w-4 mr-2" />Kembali ke Login</Link>
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
          <Link href="/login"><ArrowLeft className="h-4 w-4 mr-1" />Kembali</Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">Lupa Password</h2>
        <p className="text-muted-foreground mt-1">
          Masukkan email Anda, kami akan kirim link reset password.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="nama@assakinah.or.id"
                      autoComplete="email"
                      disabled={isPending}
                      className="pl-9"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
          )}

          <Button
            id="forgot-submit"
            type="submit"
            className="w-full"
            disabled={isPending}
            style={{ background: 'hsl(160 36% 18%)' }}
          >
            {isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mengirim...</>
            ) : (
              <>Kirim Link Reset Password</>
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}
