'use client'

// =============================================================================
// components/tickets/ticket-form.tsx
// Form buat tiket baru — React Hook Form + Zod + Server Action
// =============================================================================

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Send } from 'lucide-react'
import { createTicketSchema, type CreateTicketSchema } from '@/lib/validators/ticket-schema'
import { createTicket } from '@/lib/actions/ticket-actions'
import { TICKET_PRIORITY_LIST } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { TicketPriorityBadge } from './ticket-priority-badge'
import type { Category } from '@/lib/types'

interface TicketFormProps {
  categories: Category[]
}

export function TicketForm({ categories }: TicketFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<CreateTicketSchema>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      category_id: '',
    },
  })

  function onSubmit(values: CreateTicketSchema) {
    startTransition(async () => {
      const formData = new FormData()
      formData.append('title', values.title)
      formData.append('description', values.description)
      formData.append('priority', values.priority)
      formData.append('category_id', values.category_id)

      const result = await createTicket(formData)
      if (result.success) {
        toast.success('Tiket berhasil dibuat!')
        router.push(`/tickets/${result.data?.id}`)
      } else {
        toast.error(result.error ?? 'Gagal membuat tiket')
      }
    })
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form id="ticket-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Judul */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul Masalah *</FormLabel>
                  <FormControl>
                    <Input
                      id="ticket-title"
                      placeholder="Contoh: Printer di lab tidak bisa mencetak"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Ringkas tapi jelas, minimal 5 karakter</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Kategori & Prioritas — 2 kolom */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger id="ticket-category">
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ background: cat.color }}
                              />
                              {cat.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioritas *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger id="ticket-priority">
                          <SelectValue placeholder="Pilih prioritas" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TICKET_PRIORITY_LIST.map((p) => (
                          <SelectItem key={p} value={p}>
                            <TicketPriorityBadge priority={p} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Deskripsi */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi Masalah *</FormLabel>
                  <FormControl>
                    <Textarea
                      id="ticket-description"
                      placeholder="Jelaskan masalah secara detail: kapan mulai terjadi, apa yang sudah dicoba, pesan error yang muncul, dll."
                      className="min-h-32 resize-y"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Minimal 20 karakter. Semakin detail, semakin cepat diselesaikan.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>

      <CardFooter className="gap-3 justify-end border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Batal
        </Button>
        <Button
          id="ticket-submit"
          type="submit"
          form="ticket-form"
          disabled={isPending}
        >
          {isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mengirim...</>
          ) : (
            <><Send className="mr-2 h-4 w-4" />Kirim Tiket</>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
