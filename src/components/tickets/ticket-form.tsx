'use client'

// =============================================================================
// components/tickets/ticket-form.tsx
// Form buat tiket baru — React Hook Form + Zod + Server Action
// Mendukung upload gambar opsional saat membuat tiket
// =============================================================================

import { useTransition, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Send, ImagePlus, X, Image as ImageIcon, UploadCloud } from 'lucide-react'
import { createTicketSchema, type CreateTicketSchema } from '@/lib/validators/ticket-schema'
import { createTicket } from '@/lib/actions/ticket-actions'
import { uploadTicketImages } from '@/lib/actions/upload-actions'
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

interface ImagePreview {
  file: File
  url: string
  name: string
  size: number
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_IMAGES = 3

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function TicketForm({ categories }: TicketFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [images, setImages] = useState<ImagePreview[]>([])
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<CreateTicketSchema>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      category_id: '',
    },
  })

  // ---- Manajemen file gambar ----

  const addImages = useCallback((files: FileList | null) => {
    if (!files) return

    const valid: ImagePreview[] = []
    const errors: string[] = []

    Array.from(files).forEach((file) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        errors.push(`${file.name}: tipe tidak didukung (gunakan JPG, PNG, GIF, atau WebP)`)
        return
      }
      if (file.size > MAX_IMAGE_SIZE) {
        errors.push(`${file.name}: ukuran melebihi 5MB`)
        return
      }
      if (images.length + valid.length >= MAX_IMAGES) {
        errors.push(`Maksimal ${MAX_IMAGES} gambar`)
        return
      }
      valid.push({
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
      })
    })

    if (errors.length > 0) toast.error(errors[0])
    if (valid.length > 0) setImages((prev) => [...prev, ...valid].slice(0, MAX_IMAGES))
  }, [images])

  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      const next = [...prev]
      URL.revokeObjectURL(next[index].url)
      next.splice(index, 1)
      return next
    })
  }, [])

  // ---- Submit ----

  function onSubmit(values: CreateTicketSchema) {
    startTransition(async () => {
      // 1. Buat tiket dulu
      const formData = new FormData()
      formData.append('title', values.title)
      formData.append('description', values.description)
      formData.append('priority', values.priority)
      formData.append('category_id', values.category_id)

      const result = await createTicket(formData)
      if (!result.success || !result.data) {
        toast.error(result.error ?? 'Gagal membuat tiket')
        return
      }

      const ticketId = result.data.id
      toast.success('Tiket berhasil dibuat!')

      // 2. Upload gambar jika ada (opsional — tidak membatalkan jika gagal)
      if (images.length > 0) {
        const imgFormData = new FormData()
        images.forEach((img) => imgFormData.append('files', img.file))

        const uploadResult = await uploadTicketImages(ticketId, imgFormData)
        if (!uploadResult.success) {
          toast.warning(`Tiket dibuat, tapi gagal upload gambar: ${uploadResult.error}`)
        } else if (uploadResult.error) {
          // partial upload errors
          toast.warning(uploadResult.error)
        }
      }

      router.push(`/tickets/${ticketId}`)
    })
  }

  const canAddMore = images.length < MAX_IMAGES

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

            {/* Upload Gambar — Opsional */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Lampiran Gambar
                  <span className="ml-1 text-xs font-normal text-muted-foreground">(opsional, maks {MAX_IMAGES} gambar)</span>
                </span>
              </div>

              {/* Drop Zone — hanya tampil jika masih bisa tambah */}
              {canAddMore && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOver(false)
                    addImages(e.dataTransfer.files)
                  }}
                  onClick={() => !isPending && fileInputRef.current?.click()}
                  className={`
                    border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors
                    ${dragOver
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
                    }
                    ${isPending ? 'pointer-events-none opacity-50' : ''}
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => addImages(e.target.files)}
                    disabled={isPending}
                  />
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <UploadCloud className="h-7 w-7" />
                    <p className="text-sm font-medium">
                      Drag &amp; drop gambar ke sini atau{' '}
                      <span className="text-primary underline">klik untuk pilih</span>
                    </p>
                    <p className="text-xs">JPG, PNG, GIF, WebP — maks 5MB per gambar</p>
                  </div>
                </div>
              )}

              {/* Preview gambar yang dipilih */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {images.map((img, idx) => (
                    <div
                      key={img.url}
                      className="relative group rounded-lg overflow-hidden border bg-muted aspect-video"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                      {/* Overlay info */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                        <div className="px-2 py-1 text-white opacity-0 group-hover:opacity-100 transition-opacity w-full">
                          <p className="text-xs font-medium truncate">{img.name}</p>
                          <p className="text-xs text-white/70">{formatSize(img.size)}</p>
                        </div>
                      </div>
                      {/* Tombol hapus */}
                      {!isPending && (
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Hapus gambar"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Tombol tambah gambar di dalam grid jika masih bisa */}
                  {canAddMore && images.length > 0 && (
                    <button
                      type="button"
                      onClick={() => !isPending && fileInputRef.current?.click()}
                      disabled={isPending}
                      className="rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30 aspect-video flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <ImagePlus className="h-5 w-5" />
                      <span className="text-xs">Tambah</span>
                    </button>
                  )}
                </div>
              )}

              {images.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {images.length}/{MAX_IMAGES} gambar dipilih
                </p>
              )}
            </div>
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
