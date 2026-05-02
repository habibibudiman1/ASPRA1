'use server'

// =============================================================================
// lib/actions/ticket-actions.ts
// Server Actions untuk operasi tiket — semua mutasi data dilakukan di sini
// =============================================================================

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  ActionResult,
  TicketWithRelations,
  PaginatedResult,
  TicketFilters,
  TicketStatus,
} from '@/lib/types'
import {
  createTicketSchema,
  updateTicketStatusSchema,
  assignTicketSchema,
  rateTicketSchema,
} from '@/lib/validators/ticket-schema'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'

// =============================================================================
// HELPER: Dapatkan user saat ini dan validasi role
// =============================================================================

async function getCurrentUserAndRole() {
  const supabase = await createClient()
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  const user = session?.user
  if (authError || !user) throw new Error('Tidak terautentikasi')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) throw new Error('Profil tidak ditemukan')
  return { user, profile, supabase }
}

// =============================================================================
// GET TICKETS — List tiket (filtered by role)
// =============================================================================

export async function getTickets(
  filters: TicketFilters = {},
  page = 1,
  perPage = DEFAULT_PAGE_SIZE
): Promise<PaginatedResult<TicketWithRelations>> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user
  if (!user) throw new Error('Tidak terautentikasi')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Hitung offset untuk pagination
  const offset = (page - 1) * perPage

  let query = supabase
    .from('tickets')
    .select(`
      *,
      category:categories(id, name, color),
      reporter:profiles!reporter_id(id, full_name, email, avatar_url, department),
      assignee:profiles!assignee_id(id, full_name, email, avatar_url)
    `, { count: 'exact' })

  // Staff hanya bisa lihat tiket sendiri (RLS juga menerapkan ini)
  if (profile?.role === 'staff') {
    query = query.eq('reporter_id', user.id)
  }

  // Terapkan filters
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters.priority && filters.priority !== 'all') {
    query = query.eq('priority', filters.priority)
  }
  if (filters.category_id && filters.category_id !== 'all') {
    query = query.eq('category_id', filters.category_id)
  }
  if (filters.assignee_id && filters.assignee_id !== 'all') {
    query = query.eq('assignee_id', filters.assignee_id)
  }
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,ticket_number.ilike.%${filters.search}%`)
  }
  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from)
  }
  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to)
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  if (error) throw new Error(`Gagal memuat tiket: ${error.message}`)

  const total = count ?? 0
  return {
    data: (data as unknown as TicketWithRelations[]) ?? [],
    pagination: {
      page,
      per_page: perPage,
      total,
      total_pages: Math.ceil(total / perPage),
    },
  }
}

// =============================================================================
// GET TICKET BY ID — Detail tiket
// =============================================================================

export async function getTicketById(id: string): Promise<TicketWithRelations | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      category:categories(id, name, color, description),
      reporter:profiles!reporter_id(id, full_name, email, avatar_url, department),
      assignee:profiles!assignee_id(id, full_name, email, avatar_url),
      comments:ticket_comments(
        id, content, is_internal, created_at,
        author:profiles!author_id(id, full_name, email, avatar_url, role)
      ),
      attachments:ticket_attachments(
        id, file_name, file_url, file_size, mime_type, created_at,
        uploader:profiles!uploaded_by(id, full_name)
      ),
      activity_log:ticket_activity_log(
        id, action, old_value, new_value, metadata, created_at,
        actor:profiles!actor_id(id, full_name, avatar_url, role)
      )
    `)
    .eq('id', id)
    .order('created_at', { foreignTable: 'ticket_comments', ascending: true })
    .order('created_at', { foreignTable: 'ticket_activity_log', ascending: true })
    .single()

  if (error) return null
  return data as unknown as TicketWithRelations
}

// =============================================================================
// CREATE TICKET — Staff membuat tiket baru
// =============================================================================

export async function createTicket(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const { user, profile, supabase } = await getCurrentUserAndRole()

    // Parse dan validasi input
    const raw = {
      title: formData.get('title'),
      description: formData.get('description'),
      priority: formData.get('priority'),
      category_id: formData.get('category_id'),
    }
    const validation = createTicketSchema.safeParse(raw)
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message ?? 'Input tidak valid' }
    }

    const { title, description, priority, category_id } = validation.data

    // Buat tiket baru (ticket_number dan SLA di-generate otomatis via trigger)
    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert({
        title,
        description,
        priority,
        category_id,
        reporter_id: user.id,
        status: 'open',
      })
      .select('id, ticket_number')
      .single()

    if (error) return { success: false, error: `Gagal membuat tiket: ${error.message}` }

    // Catat activity log
    await supabase.from('ticket_activity_log').insert({
      ticket_id: ticket.id,
      actor_id: user.id,
      action: 'created',
      new_value: ticket.ticket_number,
    })

    // Kirim notifikasi ke semua IT Admin dan Admin
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['it_admin', 'admin'])
      .eq('is_active', true)

    if (admins && admins.length > 0) {
      const notifications = admins.map((admin) => ({
        user_id: admin.id,
        ticket_id: ticket.id,
        title: 'Tiket Baru Masuk',
        message: `${profile.full_name} membuat tiket baru: "${title}"`,
      }))
      await supabase.from('notifications').insert(notifications)
    }

    revalidatePath('/tickets')
    return { success: true, data: { id: ticket.id } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

// =============================================================================
// UPDATE TICKET STATUS — IT Admin mengubah status tiket
// =============================================================================

export async function updateTicketStatus(
  ticketId: string,
  newStatus: TicketStatus,
  comment?: string
): Promise<ActionResult> {
  try {
    const { user, profile, supabase } = await getCurrentUserAndRole()

    const validation = updateTicketStatusSchema.safeParse({
      ticket_id: ticketId,
      status: newStatus,
      comment,
    })
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message ?? 'Input tidak valid' }
    }

    // Ambil tiket saat ini
    const { data: ticket, error: fetchError } = await supabase
      .from('tickets')
      .select('status, reporter_id, title, first_responded_at, sla_response_deadline, sla_resolution_deadline')
      .eq('id', ticketId)
      .single()

    if (fetchError || !ticket) return { success: false, error: 'Tiket tidak ditemukan' }

    // Validasi: Staff hanya bisa reopen atau close tiket miliknya
    if (profile.role === 'staff') {
      if (ticket.reporter_id !== user.id) {
        return { success: false, error: 'Akses ditolak' }
      }
      if (!['closed', 'reopened'].includes(newStatus)) {
        return { success: false, error: 'Staff hanya bisa menutup atau membuka kembali tiket' }
      }
    }

    const oldStatus = ticket.status
    const now = new Date().toISOString()

    // Tentukan field tambahan berdasarkan status baru
    const updateFields: Record<string, unknown> = { status: newStatus }

    if (newStatus === 'in_progress' && !ticket.first_responded_at) {
      updateFields.first_responded_at = now
      // Hitung apakah SLA response terpenuhi (gunakan sla_response_deadline, bukan resolution)
      if (ticket.sla_response_deadline) {
        updateFields.sla_response_met = new Date(now) <= new Date(ticket.sla_response_deadline)
      }
    }
    if (newStatus === 'resolved') {
      updateFields.resolved_at = now
      // Hitung apakah SLA resolution terpenuhi
      if (ticket.sla_resolution_deadline) {
        updateFields.sla_resolution_met = new Date(now) <= new Date(ticket.sla_resolution_deadline)
      }
    }
    if (newStatus === 'closed') {
      updateFields.closed_at = now
    }

    // Update status tiket
    const { error: updateError } = await supabase
      .from('tickets')
      .update(updateFields)
      .eq('id', ticketId)

    if (updateError) return { success: false, error: `Gagal update status: ${updateError.message}` }

    // Catat activity log
    await supabase.from('ticket_activity_log').insert({
      ticket_id: ticketId,
      actor_id: user.id,
      action: newStatus === 'reopened' ? 'reopened' : 'status_changed',
      old_value: oldStatus,
      new_value: newStatus,
    })

    // Tambah komentar otomatis jika ada
    if (comment) {
      await supabase.from('ticket_comments').insert({
        ticket_id: ticketId,
        author_id: user.id,
        content: comment,
        is_internal: false,
      })
    }

    // Kirim notifikasi ke reporter (jika yang update bukan reporter)
    if (ticket.reporter_id !== user.id) {
      const statusLabels: Record<string, string> = {
        in_progress: 'Sedang dikerjakan',
        resolved: 'Telah diselesaikan',
        closed: 'Ditutup',
        reopened: 'Dibuka kembali',
        open: 'Dibuka',
      }
      await supabase.from('notifications').insert({
        user_id: ticket.reporter_id,
        ticket_id: ticketId,
        title: `Status Tiket Diperbarui`,
        message: `Tiket "${ticket.title}" — Status: ${statusLabels[newStatus] ?? newStatus}`,
      })
    }

    revalidatePath(`/tickets/${ticketId}`)
    revalidatePath('/tickets')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

// =============================================================================
// ASSIGN TICKET — IT Admin meng-assign tiket
// =============================================================================

export async function assignTicket(ticketId: string, assigneeId: string | null): Promise<ActionResult> {
  try {
    const { user, profile, supabase } = await getCurrentUserAndRole()

    if (profile.role !== 'it_admin' && profile.role !== 'admin') {
      return { success: false, error: 'Hanya IT atau Admin yang bisa meng-assign tiket' }
    }

    const validation = assignTicketSchema.safeParse({ ticket_id: ticketId, assignee_id: assigneeId })
    if (!validation.success) {
      return { success: false, error: 'Input tidak valid' }
    }

    const { data: oldTicket } = await supabase
      .from('tickets')
      .select('assignee_id, title, reporter_id')
      .eq('id', ticketId)
      .single()

    const { error } = await supabase
      .from('tickets')
      .update({ assignee_id: assigneeId })
      .eq('id', ticketId)

    if (error) return { success: false, error: `Gagal assign tiket: ${error.message}` }

    // Log aktivitas
    await supabase.from('ticket_activity_log').insert({
      ticket_id: ticketId,
      actor_id: user.id,
      action: 'assigned',
      old_value: oldTicket?.assignee_id ?? null,
      new_value: assigneeId,
    })

    // Notifikasi ke assignee baru
    if (assigneeId && assigneeId !== user.id) {
      await supabase.from('notifications').insert({
        user_id: assigneeId,
        ticket_id: ticketId,
        title: 'Tiket Ditugaskan ke Anda',
        message: `Tiket "${oldTicket?.title}" ditugaskan ke Anda oleh ${profile.full_name}`,
      })
    }

    revalidatePath(`/tickets/${ticketId}`)
    revalidatePath('/tickets')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

// =============================================================================
// RATE TICKET — Staff memberi rating setelah tiket resolved
// =============================================================================

export async function rateTicket(formData: FormData): Promise<ActionResult> {
  try {
    const { user, profile, supabase } = await getCurrentUserAndRole()

    if (profile.role !== 'staff') {
      return { success: false, error: 'Hanya staff yang bisa memberi rating' }
    }

    const raw = {
      ticket_id: formData.get('ticket_id'),
      rating: Number(formData.get('rating')),
      rating_comment: formData.get('rating_comment') ?? undefined,
    }
    const validation = rateTicketSchema.safeParse(raw)
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message ?? 'Input tidak valid' }
    }

    const { ticket_id, rating, rating_comment } = validation.data

    // Pastikan tiket milik reporter dan statusnya resolved
    const { data: ticket } = await supabase
      .from('tickets')
      .select('reporter_id, status, rating')
      .eq('id', ticket_id)
      .single()

    if (!ticket || ticket.reporter_id !== user.id) {
      return { success: false, error: 'Akses ditolak' }
    }
    if (ticket.status !== 'resolved') {
      return { success: false, error: 'Hanya tiket berstatus Resolved yang bisa diberi rating' }
    }
    if (ticket.rating !== null) {
      return { success: false, error: 'Tiket ini sudah diberi rating' }
    }

    const { error } = await supabase
      .from('tickets')
      .update({ rating, rating_comment, status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', ticket_id)

    if (error) return { success: false, error: `Gagal menyimpan rating: ${error.message}` }

    // Log aktivitas
    await supabase.from('ticket_activity_log').insert({
      ticket_id,
      actor_id: user.id,
      action: 'rated',
      new_value: String(rating),
      metadata: { rating_comment },
    })

    revalidatePath(`/tickets/${ticket_id}`)
    revalidatePath('/tickets')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

