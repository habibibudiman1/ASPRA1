'use server'

// =============================================================================
// lib/actions/notification-actions.ts
// Server Actions untuk notifikasi (mendukung tipe baru)
// =============================================================================

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, Notification, NotifikasiTipe } from '@/lib/types'

export async function getNotifications(limit = 20): Promise<Notification[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as Notification[]
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return count ?? 0
}

export async function markNotificationRead(notificationId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Tidak terautentikasi' }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Tidak terautentikasi' }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) return { success: false, error: error.message }
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

// =============================================================================
// Helper internal — dipanggil dari server actions lain
// =============================================================================

export async function sendNotification({
  user_id,
  judul,
  pesan,
  tipe = 'sistem',
  reference_id,
}: {
  user_id: string
  judul: string
  pesan: string
  tipe?: NotifikasiTipe
  reference_id?: string
}): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.from('notifications').insert({
      user_id,
      title: judul,
      message: pesan,
      tipe,
      reference_id: reference_id ?? null,
      is_read: false,
    })
  } catch {
    // Notifikasi gagal tidak harus hentikan proses utama
    console.error('[sendNotification] Gagal kirim notifikasi')
  }
}

