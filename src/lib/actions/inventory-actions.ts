'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  ActionResult,
  Item,
  ItemCategory,
  ItemUnit,
  ItemMutation,
  OpnameSession,
  CreateItemInput,
  UpdateItemInput,
  CreateItemUnitInput,
  UpdateItemUnitInput,
  MutateItemInput,
  StartOpnameInput,
  UpdateOpnameItemInput,
  ImportItemRow,
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

// =============================================================================
// ITEM CATEGORIES
// =============================================================================

export async function getItemCategories(): Promise<ItemCategory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('item_categories')
    .select('*')
    .order('name')

  if (error) throw new Error(error.message)
  return data ?? []
}

// =============================================================================
// ITEMS
// =============================================================================

export async function getItems(filters?: {
  room_id?: string
  category_id?: string
  is_electronic?: boolean
  search?: string
}): Promise<Item[]> {
  const supabase = await createClient()

  let query = supabase
    .from('items')
    .select('*, category:item_categories(*)')
    .order('name')

  if (filters?.category_id) {
    query = query.eq('item_category_id', filters.category_id)
  }

  if (filters?.is_electronic !== undefined) {
    query = query.eq('is_electronic', filters.is_electronic)
  }

  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  // Filter per ruangan dilakukan di sini (post-query) karena relasi berbeda untuk elektronik vs non-elektronik
  if (!filters?.room_id) return (data as unknown as Item[]) ?? []

  const roomId = filters.room_id

  // Ambil item yang ada di ruangan tersebut
  const [{ data: roomItems }, { data: unitItems }] = await Promise.all([
    supabase.from('room_items').select('item_id').eq('room_id', roomId).gt('quantity', 0),
    supabase.from('item_units').select('item_id').eq('room_id', roomId),
  ])

  const roomItemIds = new Set([
    ...(roomItems ?? []).map((r: { item_id: string }) => r.item_id),
    ...(unitItems ?? []).map((u: { item_id: string }) => u.item_id),
  ])

  return ((data as unknown as Item[]) ?? []).filter(item => roomItemIds.has(item.id))
}

export async function getItemById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      category:item_categories(*),
      item_units(*, room:rooms(*)),
      room_items(*, room:rooms(*))
    `)
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function createItem(input: CreateItemInput): Promise<ActionResult<Item>> {
  try {
    const { supabase } = await getAdminOrThrow()

    const { data, error } = await supabase
      .from('items')
      .insert({
        name: input.name.trim(),
        item_category_id: input.item_category_id,
        description: input.description?.trim() ?? null,
        is_electronic: input.is_electronic,
      })
      .select('*, category:item_categories(*)')
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/inventory')
    return { success: true, data: data as unknown as Item }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Gagal menambahkan barang' }
  }
}

export async function updateItem(input: UpdateItemInput): Promise<ActionResult> {
  try {
    const { supabase } = await getAdminOrThrow()
    const { id, ...fields } = input

    const { error } = await supabase
      .from('items')
      .update({
        ...(fields.name !== undefined && { name: fields.name.trim() }),
        ...(fields.item_category_id !== undefined && { item_category_id: fields.item_category_id }),
        ...(fields.description !== undefined && { description: fields.description?.trim() ?? null }),
        ...(fields.is_electronic !== undefined && { is_electronic: fields.is_electronic }),
      })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/inventory')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Gagal mengupdate barang' }
  }
}

export async function deleteItem(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await getAdminOrThrow()
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/inventory')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Gagal menghapus barang' }
  }
}

// =============================================================================
// ITEM UNITS (elektronik per unit)
// =============================================================================

export async function getItemUnits(itemId?: string, roomId?: string): Promise<ItemUnit[]> {
  const supabase = await createClient()

  let query = supabase
    .from('item_units')
    .select('*, item:items(*, category:item_categories(*)), room:rooms(*)')
    .order('unit_code')

  if (itemId) query = query.eq('item_id', itemId)
  if (roomId) query = query.eq('room_id', roomId)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data as unknown as ItemUnit[]) ?? []
}

export async function createItemUnit(input: CreateItemUnitInput): Promise<ActionResult<ItemUnit>> {
  try {
    const { supabase } = await getAdminOrThrow()

    const { data, error } = await supabase
      .from('item_units')
      .insert({
        item_id: input.item_id,
        unit_code: input.unit_code.trim().toUpperCase(),
        serial_number: input.serial_number?.trim() ?? null,
        specs: input.specs ?? null,
        condition: input.condition ?? 'baik',
        status: input.status ?? 'aktif',
        room_id: input.room_id ?? null,
        notes: input.notes?.trim() ?? null,
      })
      .select('*, item:items(*), room:rooms(*)')
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/inventory')
    if (input.room_id) revalidatePath(`/rooms/${input.room_id}`)
    return { success: true, data: data as unknown as ItemUnit }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Gagal menambahkan unit barang' }
  }
}

export async function updateItemUnit(input: UpdateItemUnitInput): Promise<ActionResult> {
  try {
    const { supabase } = await getAdminOrThrow()
    const { id, ...fields } = input

    const updateData: Record<string, unknown> = {}
    if (fields.unit_code !== undefined) updateData.unit_code = fields.unit_code.trim().toUpperCase()
    if (fields.serial_number !== undefined) updateData.serial_number = fields.serial_number?.trim() ?? null
    if (fields.specs !== undefined) updateData.specs = fields.specs
    if (fields.condition !== undefined) updateData.condition = fields.condition
    if (fields.status !== undefined) updateData.status = fields.status
    if (fields.room_id !== undefined) updateData.room_id = fields.room_id ?? null
    if (fields.notes !== undefined) updateData.notes = fields.notes?.trim() ?? null

    const { error } = await supabase.from('item_units').update(updateData).eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/inventory')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Gagal mengupdate unit barang' }
  }
}

export async function deleteItemUnit(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await getAdminOrThrow()
    const { error } = await supabase.from('item_units').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/inventory')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Gagal menghapus unit barang' }
  }
}

// =============================================================================
// MUTASI BARANG (pindah antar ruangan)
// =============================================================================

export async function mutateItem(input: MutateItemInput): Promise<ActionResult> {
  try {
    const { supabase, userId } = await getAdminOrThrow()

    // Validasi angka
    const qty = Number(input.quantity)
    if (!Number.isInteger(qty) || qty <= 0) {
      return { success: false, error: 'Jumlah harus berupa angka bulat positif' }
    }

    // Dapatkan info item
    const { data: item } = await supabase
      .from('items')
      .select('is_electronic')
      .eq('id', input.item_id)
      .single()

    if (!item) return { success: false, error: 'Barang tidak ditemukan' }

    if (item.is_electronic) {
      // Untuk elektronik: update room_id di item_units
      if (!input.item_unit_id) return { success: false, error: 'Pilih unit barang yang akan dipindahkan' }

      const { error } = await supabase
        .from('item_units')
        .update({ room_id: input.to_room_id })
        .eq('id', input.item_unit_id)

      if (error) return { success: false, error: error.message }
    } else {
      // Untuk non-elektronik: kurangi dari ruangan asal, tambah ke tujuan

      if (input.from_room_id) {
        // Cek stok di ruangan asal
        const { data: fromStock } = await supabase
          .from('room_items')
          .select('id, quantity')
          .eq('room_id', input.from_room_id)
          .eq('item_id', input.item_id)
          .single()

        if (!fromStock || fromStock.quantity < qty) {
          return {
            success: false,
            error: `Stok tidak mencukupi. Tersedia: ${fromStock?.quantity ?? 0}, diminta: ${qty}`,
          }
        }

        const newFromQty = fromStock.quantity - qty
        const { error: decErr } = await supabase
          .from('room_items')
          .update({ quantity: newFromQty })
          .eq('id', fromStock.id)

        if (decErr) return { success: false, error: decErr.message }
      }

      // Tambah/buat entri di ruangan tujuan
      const { data: toStock } = await supabase
        .from('room_items')
        .select('id, quantity')
        .eq('room_id', input.to_room_id)
        .eq('item_id', input.item_id)
        .single()

      if (toStock) {
        const { error: incErr } = await supabase
          .from('room_items')
          .update({ quantity: toStock.quantity + qty })
          .eq('id', toStock.id)

        if (incErr) return { success: false, error: incErr.message }
      } else {
        const { error: insErr } = await supabase
          .from('room_items')
          .insert({ room_id: input.to_room_id, item_id: input.item_id, quantity: qty })

        if (insErr) return { success: false, error: insErr.message }
      }
    }

    // Log mutasi
    await supabase.from('item_mutations').insert({
      item_id: input.item_id,
      item_unit_id: input.item_unit_id ?? null,
      from_room_id: input.from_room_id ?? null,
      to_room_id: input.to_room_id,
      quantity: qty,
      moved_by: userId,
      reason: input.reason?.trim() ?? null,
    })

    revalidatePath('/inventory')
    revalidatePath('/rooms')
    if (input.from_room_id) revalidatePath(`/rooms/${input.from_room_id}`)
    revalidatePath(`/rooms/${input.to_room_id}`)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Gagal memindahkan barang' }
  }
}

export async function getItemMutations(itemId?: string): Promise<ItemMutation[]> {
  const supabase = await createClient()

  let query = supabase
    .from('item_mutations')
    .select(`
      *,
      item:items(id, name),
      item_unit:item_units(id, unit_code),
      from_room:rooms!from_room_id(id, name, code),
      to_room:rooms!to_room_id(id, name, code),
      mover:profiles!moved_by(id, full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (itemId) query = query.eq('item_id', itemId)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data as unknown as ItemMutation[]) ?? []
}

// =============================================================================
// ROOM ITEMS (quantity per ruangan, non-elektronik)
// =============================================================================

export async function setRoomItemQuantity(
  roomId: string,
  itemId: string,
  quantity: number,
): Promise<ActionResult> {
  try {
    const { supabase } = await getAdminOrThrow()

    // Validasi
    const qty = Number(quantity)
    if (!Number.isInteger(qty) || qty < 0) {
      return { success: false, error: 'Jumlah harus berupa angka bulat non-negatif' }
    }

    const { data: existing } = await supabase
      .from('room_items')
      .select('id')
      .eq('room_id', roomId)
      .eq('item_id', itemId)
      .single()

    if (existing) {
      const { error } = await supabase
        .from('room_items')
        .update({ quantity: qty })
        .eq('id', existing.id)
      if (error) return { success: false, error: error.message }
    } else {
      if (qty === 0) return { success: true }
      const { error } = await supabase
        .from('room_items')
        .insert({ room_id: roomId, item_id: itemId, quantity: qty })
      if (error) return { success: false, error: error.message }
    }

    revalidatePath(`/rooms/${roomId}`)
    revalidatePath('/inventory')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Gagal mengupdate jumlah barang' }
  }
}

// =============================================================================
// OPNAME
// =============================================================================

export async function getOpnameSessions(): Promise<OpnameSession[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('opname_sessions')
    .select(`
      *,
      conductor:profiles!conducted_by(id, full_name),
      opname_items(*, item:items(id, name, is_electronic), room:rooms(id, name, code))
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data as unknown as OpnameSession[]) ?? []
}

export async function startOpname(input: StartOpnameInput): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase, userId } = await getAdminOrThrow()

    const { data: session, error: sessionErr } = await supabase
      .from('opname_sessions')
      .insert({
        conducted_by: userId,
        notes: input.notes?.trim() ?? null,
        status: 'draft',
      })
      .select('id')
      .single()

    if (sessionErr || !session) {
      return { success: false, error: sessionErr?.message ?? 'Gagal membuat sesi opname' }
    }

    if (input.items.length > 0) {
      const rows = input.items.map(item => ({
        opname_session_id: session.id,
        item_id: item.item_id,
        room_id: item.room_id,
        expected_qty: Math.max(0, Number(item.expected_qty) || 0),
        actual_qty: 0,
      }))

      const { error: itemsErr } = await supabase.from('opname_items').insert(rows)
      if (itemsErr) return { success: false, error: itemsErr.message }
    }

    revalidatePath('/inventory/opname')
    return { success: true, data: { id: session.id } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Gagal memulai opname' }
  }
}

export async function updateOpnameItem(input: UpdateOpnameItemInput): Promise<ActionResult> {
  try {
    const { supabase } = await getAdminOrThrow()

    // Validasi input — ini yang menyebabkan "invalid syntax" sebelumnya
    const actualQty = Number(input.actual_qty)
    if (!Number.isFinite(actualQty) || !Number.isInteger(actualQty) || actualQty < 0) {
      return { success: false, error: 'Jumlah aktual harus berupa angka bulat non-negatif' }
    }

    const { error } = await supabase
      .from('opname_items')
      .update({
        actual_qty: actualQty,
        notes: input.notes?.trim() ?? null,
      })
      .eq('id', input.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/inventory/opname')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Gagal mengupdate item opname' }
  }
}

export async function completeOpname(sessionId: string): Promise<ActionResult> {
  try {
    const { supabase } = await getAdminOrThrow()

    // Dapatkan semua item opname
    const { data: opItems, error: fetchErr } = await supabase
      .from('opname_items')
      .select('*')
      .eq('opname_session_id', sessionId)

    if (fetchErr) return { success: false, error: fetchErr.message }

    // Update kuantitas untuk non-elektronik berdasarkan actual_qty
    for (const oi of opItems ?? []) {
      const { data: itemData } = await supabase
        .from('items')
        .select('is_electronic')
        .eq('id', oi.item_id)
        .single()

      if (itemData?.is_electronic) continue // elektronik dikelola via item_units
      if (!oi.room_id) continue

      const newQty = Math.max(0, Number(oi.actual_qty))

      // Upsert room_items
      const { data: existing } = await supabase
        .from('room_items')
        .select('id')
        .eq('room_id', oi.room_id)
        .eq('item_id', oi.item_id)
        .single()

      if (existing) {
        await supabase.from('room_items').update({ quantity: newQty }).eq('id', existing.id)
      } else if (newQty > 0) {
        await supabase.from('room_items').insert({
          room_id: oi.room_id,
          item_id: oi.item_id,
          quantity: newQty,
        })
      }
    }

    // Tandai sesi selesai
    const { error: completeErr } = await supabase
      .from('opname_sessions')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', sessionId)

    if (completeErr) return { success: false, error: completeErr.message }

    revalidatePath('/inventory/opname')
    revalidatePath('/inventory')
    revalidatePath('/rooms')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Gagal menyelesaikan opname' }
  }
}

// =============================================================================
// IMPORT VIA CSV/EXCEL
// Format baris: { nama_barang, kategori, ruangan?, jumlah?, kode_unit?, nomor_seri?, spesifikasi?, kondisi?, keterangan? }
// =============================================================================

export async function importItemsFromCSV(rows: ImportItemRow[]): Promise<ActionResult<{ imported: number; errors: string[] }>> {
  try {
    const { supabase } = await getAdminOrThrow()
    const errors: string[] = []
    let imported = 0

    // Cache kategori dan ruangan
    const { data: categories } = await supabase.from('item_categories').select('id, name, is_electronic')
    const { data: rooms } = await supabase.from('rooms').select('id, name, code')

    const catMap = new Map((categories ?? []).map(c => [c.name.toLowerCase(), c]))
    const roomMap = new Map([
      ...(rooms ?? []).map(r => [r.name.toLowerCase(), r] as [string, typeof r]),
      ...(rooms ?? []).map(r => [r.code.toLowerCase(), r] as [string, typeof r]),
    ])

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // +2 karena baris 1 = header

      if (!row.nama_barang?.trim()) {
        errors.push(`Baris ${rowNum}: nama_barang kosong`)
        continue
      }

      const cat = catMap.get(row.kategori?.toLowerCase() ?? '')
      if (!cat) {
        errors.push(`Baris ${rowNum}: kategori "${row.kategori}" tidak ditemukan`)
        continue
      }

      // Cari atau buat item
      let { data: existingItem } = await supabase
        .from('items')
        .select('id, is_electronic')
        .eq('name', row.nama_barang.trim())
        .eq('item_category_id', cat.id)
        .single()

      if (!existingItem) {
        const { data: newItem, error: itemErr } = await supabase
          .from('items')
          .insert({
            name: row.nama_barang.trim(),
            item_category_id: cat.id,
            description: row.keterangan?.trim() ?? null,
            is_electronic: cat.is_electronic,
          })
          .select('id, is_electronic')
          .single()

        if (itemErr || !newItem) {
          errors.push(`Baris ${rowNum}: gagal membuat barang — ${itemErr?.message}`)
          continue
        }
        existingItem = newItem
      }

      const room = row.ruangan ? roomMap.get(row.ruangan.toLowerCase()) : null

      if (cat.is_electronic) {
        // Import unit elektronik
        if (!row.kode_unit?.trim()) {
          errors.push(`Baris ${rowNum}: kode_unit wajib diisi untuk barang elektronik`)
          continue
        }

        let specs: Record<string, string> | null = null
        if (row.spesifikasi?.trim()) {
          specs = { keterangan: row.spesifikasi.trim() }
        }

        const { error: unitErr } = await supabase.from('item_units').insert({
          item_id: existingItem.id,
          unit_code: row.kode_unit.trim().toUpperCase(),
          serial_number: row.nomor_seri?.trim() ?? null,
          specs,
          condition: (row.kondisi?.trim() as 'baik' | 'rusak_ringan' | 'rusak_berat') ?? 'baik',
          status: 'aktif',
          room_id: room?.id ?? null,
          notes: row.keterangan?.trim() ?? null,
        })

        if (unitErr) {
          errors.push(`Baris ${rowNum}: ${unitErr.message}`)
          continue
        }
      } else {
        // Import barang non-elektronik (qty per ruangan)
        if (room) {
          const qty = Math.max(0, Number(row.jumlah) || 0)

          const { data: existing } = await supabase
            .from('room_items')
            .select('id, quantity')
            .eq('room_id', room.id)
            .eq('item_id', existingItem.id)
            .single()

          if (existing) {
            const { error: upErr } = await supabase
              .from('room_items')
              .update({ quantity: existing.quantity + qty })
              .eq('id', existing.id)

            if (upErr) {
              errors.push(`Baris ${rowNum}: ${upErr.message}`)
              continue
            }
          } else if (qty > 0) {
            const { error: insErr } = await supabase
              .from('room_items')
              .insert({ room_id: room.id, item_id: existingItem.id, quantity: qty })

            if (insErr) {
              errors.push(`Baris ${rowNum}: ${insErr.message}`)
              continue
            }
          }
        }
      }

      imported++
    }

    revalidatePath('/inventory')
    revalidatePath('/rooms')
    return { success: true, data: { imported, errors } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Gagal mengimport barang' }
  }
}
