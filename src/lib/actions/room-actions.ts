'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  ActionResult,
  Room,
  RoomWithItems,
  CreateRoomInput,
  UpdateRoomInput,
} from '@/lib/types'

async function getAdminOrThrow() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Tidak terautentikasi')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'it_admin') throw new Error('Hanya IT Admin yang dapat melakukan aksi ini')
  return { supabase, userId: user.id }
}

async function getAuthOrThrow() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Tidak terautentikasi')
  return { supabase, userId: user.id }
}

// =============================================================================
// GET ROOMS
// =============================================================================

export async function getRooms(): Promise<Room[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .order('name')

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getRoomById(id: string): Promise<RoomWithItems | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rooms')
    .select(`
      *,
      room_items(
        *,
        item:items(*, category:item_categories(*))
      ),
      item_units(
        *,
        item:items(*, category:item_categories(*))
      )
    `)
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as RoomWithItems
}

// =============================================================================
// CREATE ROOM
// =============================================================================

export async function createRoom(input: CreateRoomInput): Promise<ActionResult<Room>> {
  try {
    const { supabase } = await getAdminOrThrow()

    const { data, error } = await supabase
      .from('rooms')
      .insert({
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
        capacity: input.capacity ?? null,
        location: input.location?.trim() ?? null,
        description: input.description?.trim() ?? null,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/rooms')
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Gagal membuat ruangan' }
  }
}

// =============================================================================
// UPDATE ROOM
// =============================================================================

export async function updateRoom(input: UpdateRoomInput): Promise<ActionResult> {
  try {
    const { supabase } = await getAdminOrThrow()
    const { id, ...fields } = input

    const { error } = await supabase
      .from('rooms')
      .update({
        ...(fields.name !== undefined && { name: fields.name.trim() }),
        ...(fields.code !== undefined && { code: fields.code.trim().toUpperCase() }),
        ...(fields.capacity !== undefined && { capacity: fields.capacity }),
        ...(fields.location !== undefined && { location: fields.location?.trim() ?? null }),
        ...(fields.description !== undefined && { description: fields.description?.trim() ?? null }),
        ...(fields.is_active !== undefined && { is_active: fields.is_active }),
      })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/rooms')
    revalidatePath(`/rooms/${id}`)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Gagal mengupdate ruangan' }
  }
}

// =============================================================================
// DELETE ROOM
// =============================================================================

export async function deleteRoom(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await getAdminOrThrow()

    const { error } = await supabase.from('rooms').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/rooms')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Gagal menghapus ruangan' }
  }
}

// =============================================================================
// BOOKING ACTIONS
// =============================================================================

export async function getRoomBookings(roomId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Tidak terautentikasi')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  let query = supabase
    .from('room_bookings')
    .select(`
      *,
      room:rooms(id, name, code),
      booker:profiles!booked_by(id, full_name, email, department),
      canceller:profiles!cancelled_by(id, full_name)
    `)
    .order('start_time', { ascending: false })

  if (profile?.role !== 'it_admin') {
    query = query.eq('booked_by', user.id)
  }

  if (roomId) {
    query = query.eq('room_id', roomId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createRoomBooking(input: {
  room_id: string
  title: string
  description?: string
  start_time: string
  end_time: string
}): Promise<ActionResult> {
  try {
    const { supabase, userId } = await getAuthOrThrow()

    // Cek konflik jadwal (hanya booking aktif)
    const start = new Date(input.start_time).toISOString()
    const end = new Date(input.end_time).toISOString()

    const { data: conflict } = await supabase
      .from('room_bookings')
      .select('id, title, start_time, end_time')
      .eq('room_id', input.room_id)
      .eq('status', 'confirmed')
      .lt('start_time', end)
      .gt('end_time', start)
      .limit(1)

    if (conflict && conflict.length > 0) {
      return {
        success: false,
        error: `Ruangan sudah dibooking: "${conflict[0].title}" pada waktu tersebut`,
      }
    }

    const { error } = await supabase.from('room_bookings').insert({
      room_id: input.room_id,
      booked_by: userId,
      title: input.title.trim(),
      description: input.description?.trim() ?? null,
      start_time: start,
      end_time: end,
      status: 'confirmed',
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/rooms/booking')
    revalidatePath(`/rooms/${input.room_id}`)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Gagal membuat booking' }
  }
}

export async function cancelRoomBooking(id: string, cancelReason?: string): Promise<ActionResult> {
  try {
    const { supabase, userId } = await getAuthOrThrow()

    // Pastikan booking ada dan user punya hak untuk cancel
    const { data: booking, error: fetchErr } = await supabase
      .from('room_bookings')
      .select('id, booked_by, status, room_id')
      .eq('id', id)
      .single()

    if (fetchErr || !booking) return { success: false, error: 'Booking tidak ditemukan' }
    if (booking.status === 'cancelled') return { success: false, error: 'Booking sudah dibatalkan' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single()
    const isAdmin = profile?.role === 'it_admin'
    const isOwner = booking.booked_by === userId

    if (!isAdmin && !isOwner) {
      return { success: false, error: 'Anda tidak memiliki izin untuk membatalkan booking ini' }
    }

    const { error } = await supabase
      .from('room_bookings')
      .update({
        status: 'cancelled',
        cancelled_by: userId,
        cancelled_at: new Date().toISOString(),
        cancel_reason: cancelReason?.trim() ?? null,
      })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/rooms/booking')
    revalidatePath(`/rooms/${booking.room_id}`)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Gagal membatalkan booking' }
  }
}
