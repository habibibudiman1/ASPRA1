'use server'

// =============================================================================
// lib/actions/upload-actions.ts
// Server Actions untuk file upload ke Supabase Storage
// Mendukung: ticket attachments, foto inventaris, foto ruangan
// =============================================================================

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { STORAGE_BUCKETS, MAX_FILE_SIZE_BYTES, ALLOWED_FILE_TYPES } from '@/lib/constants'
import type { ActionResult, TicketAttachment } from '@/lib/types'

// =============================================================================
// UPLOAD FILE KE SUPABASE STORAGE
// =============================================================================

async function uploadFile(
  bucket: string,
  folder: string,
  file: File,
  userId: string
): Promise<{ url: string; path: string } | { error: string }> {
  const supabase = await createClient()

  // Validasi tipe dan ukuran
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { error: `Tipe file tidak didukung: ${file.type}` }
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { error: `Ukuran file melebihi batas 5MB (${(file.size / 1024 / 1024).toFixed(1)}MB)` }
  }

  // Buat path unik: folder/userId/timestamp-namafile
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${folder}/${userId}/${Date.now()}-${sanitizedName}`

  const arrayBuffer = await file.arrayBuffer()
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) return { error: error.message }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
  return { url: urlData.publicUrl, path }
}

// =============================================================================
// UPLOAD ATTACHMENT TIKET
// =============================================================================

export async function uploadTicketAttachment(
  ticketId: string,
  formData: FormData
): Promise<ActionResult<TicketAttachment[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Tidak terautentikasi' }

    const files = formData.getAll('files') as File[]
    if (files.length === 0) return { success: false, error: 'Tidak ada file yang dipilih' }
    if (files.length > 5) return { success: false, error: 'Maksimal 5 file per upload' }

    const attachments: TicketAttachment[] = []
    const errors: string[] = []

    for (const file of files) {
      const result = await uploadFile(
        STORAGE_BUCKETS.ATTACHMENTS,
        `tickets/${ticketId}`,
        file,
        user.id
      )

      if ('error' in result) {
        errors.push(`${file.name}: ${result.error}`)
        continue
      }

      const { data, error } = await supabase
        .from('ticket_attachments')
        .insert({
          ticket_id: ticketId,
          uploaded_by: user.id,
          file_name: file.name,
          file_url: result.url,
          file_size: file.size,
          mime_type: file.type,
        })
        .select('*')
        .single()

      if (error) {
        errors.push(`${file.name}: Gagal menyimpan ke database`)
        // Hapus file yang sudah terupload jika DB error
        await supabase.storage.from(STORAGE_BUCKETS.ATTACHMENTS).remove([result.path])
        continue
      }
      attachments.push(data as TicketAttachment)
    }

    if (errors.length > 0 && attachments.length === 0) {
      return { success: false, error: errors.join(', ') }
    }

    revalidatePath(`/tickets/${ticketId}`)
    return {
      success: true,
      data: attachments,
      ...(errors.length > 0 ? { error: `Beberapa file gagal: ${errors.join(', ')}` } : {}),
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Gagal upload file' }
  }
}

// =============================================================================
// UPLOAD GAMBAR SAAT BUAT TIKET BARU
// Hanya menerima file gambar (image/*), dipakai langsung setelah tiket dibuat.
// =============================================================================

export async function uploadTicketImages(
  ticketId: string,
  formData: FormData
): Promise<ActionResult<TicketAttachment[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Tidak terautentikasi' }

    const files = formData.getAll('files') as File[]
    if (files.length === 0) return { success: false, error: 'Tidak ada gambar yang dipilih' }
    if (files.length > 3) return { success: false, error: 'Maksimal 3 gambar per tiket' }

    const attachments: TicketAttachment[] = []
    const errors: string[] = []

    for (const file of files) {
      // Hanya izinkan file gambar
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name}: bukan file gambar`)
        continue
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`${file.name}: ukuran melebihi 5MB`)
        continue
      }

      const result = await uploadFile(
        STORAGE_BUCKETS.ATTACHMENTS,
        `tickets/${ticketId}`,
        file,
        user.id
      )

      if ('error' in result) {
        errors.push(`${file.name}: ${result.error}`)
        continue
      }

      const { data, error } = await supabase
        .from('ticket_attachments')
        .insert({
          ticket_id: ticketId,
          uploaded_by: user.id,
          file_name: file.name,
          file_url: result.url,
          file_size: file.size,
          mime_type: file.type,
        })
        .select('*')
        .single()

      if (error) {
        errors.push(`${file.name}: Gagal menyimpan ke database`)
        await supabase.storage.from(STORAGE_BUCKETS.ATTACHMENTS).remove([result.path])
        continue
      }
      attachments.push(data as TicketAttachment)
    }

    if (errors.length > 0 && attachments.length === 0) {
      return { success: false, error: errors.join(', ') }
    }

    revalidatePath(`/tickets/${ticketId}`)
    return {
      success: true,
      data: attachments,
      ...(errors.length > 0 ? { error: `Beberapa gambar gagal diupload: ${errors.join(', ')}` } : {}),
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Gagal upload gambar' }
  }
}

// =============================================================================
// DELETE ATTACHMENT TIKET
// =============================================================================

export async function deleteTicketAttachment(attachmentId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Tidak terautentikasi' }

    // Ambil info attachment
    const { data: attachment } = await supabase
      .from('ticket_attachments')
      .select('file_url, uploaded_by, ticket_id')
      .eq('id', attachmentId)
      .single()

    if (!attachment) return { success: false, error: 'Attachment tidak ditemukan' }

    // Hanya yang upload atau admin yang bisa hapus
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (attachment.uploaded_by !== user.id && !['it_admin', 'admin'].includes(profile?.role ?? '')) {
      return { success: false, error: 'Akses ditolak' }
    }

    // Hapus dari storage
    const urlObj = new URL(attachment.file_url)
    const pathParts = urlObj.pathname.split(`/storage/v1/object/public/${STORAGE_BUCKETS.ATTACHMENTS}/`)
    if (pathParts[1]) {
      await supabase.storage.from(STORAGE_BUCKETS.ATTACHMENTS).remove([pathParts[1]])
    }

    // Hapus dari database
    const { error } = await supabase.from('ticket_attachments').delete().eq('id', attachmentId)
    if (error) return { success: false, error: error.message }

    revalidatePath(`/tickets/${attachment.ticket_id}`)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Gagal menghapus file' }
  }
}

// =============================================================================
// UPLOAD FOTO INVENTARIS
// =============================================================================

export async function uploadInventarisFoto(
  inventarisId: string,
  formData: FormData
): Promise<ActionResult<string>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Tidak terautentikasi' }

    // Validasi role
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!['sarana', 'admin'].includes(profile?.role ?? '')) {
      return { success: false, error: 'Hanya Sarana atau Admin yang bisa upload foto barang' }
    }

    const file = formData.get('foto') as File | null
    if (!file || file.size === 0) return { success: false, error: 'File tidak ditemukan' }

    // Hanya izinkan gambar untuk foto barang
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Hanya file gambar yang diizinkan untuk foto barang' }
    }

    const result = await uploadFile(
      STORAGE_BUCKETS.INVENTORY_PHOTOS,
      'inventaris',
      file,
      user.id
    )
    if ('error' in result) return { success: false, error: result.error }

    // Update kolom foto di tabel inventaris
    const { error } = await supabase
      .from('inventaris')
      .update({ foto: result.url })
      .eq('id', inventarisId)

    if (error) {
      await supabase.storage.from(STORAGE_BUCKETS.INVENTORY_PHOTOS).remove([result.path])
      return { success: false, error: error.message }
    }

    revalidatePath(`/inventaris/barang/${inventarisId}`)
    revalidatePath('/inventaris/barang')
    return { success: true, data: result.url }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Gagal upload foto' }
  }
}

