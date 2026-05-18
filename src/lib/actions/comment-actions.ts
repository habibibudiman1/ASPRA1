'use server'

// =============================================================================
// lib/actions/comment-actions.ts
// Server Actions untuk komentar tiket
// =============================================================================

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types'
import { createCommentSchema } from '@/lib/validators/comment-schema'

export async function addComment(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Tidak terautentikasi' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()
    if (!profile) return { success: false, error: 'Profil tidak ditemukan' }

    const raw = {
      ticket_id: formData.get('ticket_id'),
      content: formData.get('content'),
      is_internal: formData.get('is_internal') === 'true',
    }

    const validation = createCommentSchema.safeParse(raw)
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message ?? 'Input tidak valid' }
    }

    const { ticket_id, content, is_internal } = validation.data

    // Staff tidak bisa membuat internal note
    if (profile.role === 'staff' && is_internal) {
      return { success: false, error: 'Akses ditolak: Staff tidak bisa membuat internal note' }
    }

    // Ambil info tiket untuk notifikasi
    const { data: ticket } = await supabase
      .from('tickets')
      .select('reporter_id, assignee_id, title')
      .eq('id', ticket_id)
      .single()

    if (!ticket) return { success: false, error: 'Tiket tidak ditemukan' }

    // Insert komentar
    const { error } = await supabase.from('ticket_comments').insert({
      ticket_id,
      author_id: user.id,
      content,
      is_internal,
    })

    if (error) return { success: false, error: `Gagal menambah komentar: ${error.message}` }

    // Log aktivitas
    await supabase.from('ticket_activity_log').insert({
      ticket_id,
      actor_id: user.id,
      action: 'commented',
      new_value: is_internal ? '[Internal Note]' : content.slice(0, 100),
    })

    // Kirim notifikasi ke pihak terkait
    const notifyUserIds = new Set<string>()
    if (ticket.reporter_id !== user.id) notifyUserIds.add(ticket.reporter_id)
    if (ticket.assignee_id && ticket.assignee_id !== user.id) notifyUserIds.add(ticket.assignee_id)

    // Jika yang berkomentar adalah staff/reporter, notifikasi ke semua IT Admin & Admin yang belum ada di set
    if (profile.role === 'staff' || profile.role === 'sarana') {
      // Gunakan adminClient — staff tidak bisa query profiles lain (RLS profiles_select_own)
      const adminClient = await createAdminClient()
      const { data: admins } = await adminClient
        .from('profiles')
        .select('id')
        .in('role', ['it_admin', 'admin'])
        .eq('is_active', true)
      ;(admins ?? []).forEach((a) => {
        if (a.id !== user.id) notifyUserIds.add(a.id)
      })
    }

    if (notifyUserIds.size > 0 && !is_internal) {
      const notifications = Array.from(notifyUserIds).map((uid) => ({
        user_id: uid,
        ticket_id,
        title: 'Komentar Baru',
        message: `${profile.full_name} menambahkan komentar pada tiket "${ticket.title}"`,
        tipe: 'tiket',
      }))
      await supabase.from('notifications').insert(notifications)
    }

    revalidatePath(`/tickets/${ticket_id}`)
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

export async function deleteComment(commentId: string, ticketId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Tidak terautentikasi' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

    const { data: comment } = await supabase
      .from('ticket_comments')
      .select('author_id')
      .eq('id', commentId)
      .single()

    if (!comment) return { success: false, error: 'Komentar tidak ditemukan' }
    if (comment.author_id !== user.id && !['it_admin', 'admin'].includes(profile?.role ?? '')) {
      return { success: false, error: 'Akses ditolak' }
    }

    const { error } = await supabase.from('ticket_comments').delete().eq('id', commentId)
    if (error) return { success: false, error: `Gagal menghapus komentar: ${error.message}` }

    revalidatePath(`/tickets/${ticketId}`)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

