'use server'

// =============================================================================
// lib/actions/mutasi-actions.ts
// Server Actions untuk mutasi barang (audit trail)
// =============================================================================

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, MutasiBarang, PaginatedResult, MutasiFilters } from '@/lib/types'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'

async function requireSaranaOrAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Tidak terautentikasi')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['sarana', 'admin'].includes(profile?.role ?? '')) throw new Error('Akses ditolak')
  return { supabase, user, role: profile!.role }
}

export async function getMutasi(
  filters?: MutasiFilters,
  page = 1,
  per_page = DEFAULT_PAGE_SIZE
): Promise<PaginatedResult<MutasiBarang>> {
  const supabase = await createClient()
  const from = (page - 1) * per_page
  const to = from + per_page - 1

  let query = supabase
    .from('mutasi_barang')
    .select('*, inventaris(*), user:user_id(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filters?.inventaris_id) query = query.eq('inventaris_id', filters.inventaris_id)
  if (filters?.jenis_mutasi && filters.jenis_mutasi !== 'all') query = query.eq('jenis_mutasi', filters.jenis_mutasi)
  if (filters?.date_from) query = query.gte('tanggal', filters.date_from)
  if (filters?.date_to)   query = query.lte('tanggal', filters.date_to)

  const { data, count, error } = await query
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as MutasiBarang[],
    pagination: { page, per_page, total: count ?? 0, total_pages: Math.ceil((count ?? 0) / per_page) },
  }
}

export async function getMutasiByInventaris(inventarisId: string): Promise<MutasiBarang[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('mutasi_barang')
    .select('*, user:user_id(full_name)')
    .eq('inventaris_id', inventarisId)
    .order('created_at', { ascending: false })
  return (data ?? []) as MutasiBarang[]
}

export async function createMutasi(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireSaranaOrAdmin()

    const inventarisId = formData.get('inventaris_id') as string
    const jenisMutasi = formData.get('jenis_mutasi') as string
    const jumlah = Number(formData.get('jumlah'))
    const keterangan = formData.get('keterangan') as string
    const tanggal = (formData.get('tanggal') as string) || new Date().toISOString().split('T')[0]
    const dariLokasi = (formData.get('dari_lokasi') as string) || null
    const keLokasi = (formData.get('ke_lokasi') as string) || null

    if (!inventarisId || !jenisMutasi || !jumlah || !keterangan) {
      return { success: false, error: 'Field wajib belum lengkap' }
    }
    if (!keterangan || keterangan.length < 5) {
      return { success: false, error: 'Keterangan minimal 5 karakter' }
    }

    // Ambil stok saat ini
    const { data: inv } = await supabase.from('inventaris').select('jumlah_stok, lokasi_penempatan').eq('id', inventarisId).single()
    if (!inv) return { success: false, error: 'Barang tidak ditemukan' }

    let stokSesudah = inv.jumlah_stok
    if (['masuk', 'perbaikan'].includes(jenisMutasi)) stokSesudah += jumlah
    else if (['keluar', 'rusak', 'hilang', 'disposal'].includes(jenisMutasi)) stokSesudah -= jumlah

    if (stokSesudah < 0) return { success: false, error: 'Stok tidak mencukupi untuk mutasi ini' }

    // Insert mutasi
    const { error } = await supabase.from('mutasi_barang').insert({
      inventaris_id: inventarisId,
      jenis_mutasi: jenisMutasi,
      jumlah,
      stok_sebelum: inv.jumlah_stok,
      stok_sesudah: stokSesudah,
      dari_lokasi: dariLokasi,
      ke_lokasi: keLokasi,
      keterangan,
      user_id: user.id,
      tanggal,
    })
    if (error) return { success: false, error: error.message }

    // Update stok & lokasi inventaris
    const updates: Record<string, unknown> = { jumlah_stok: stokSesudah }
    if (jenisMutasi === 'pindah_lokasi' && keLokasi) updates.lokasi_penempatan = keLokasi

    await supabase.from('inventaris').update(updates).eq('id', inventarisId)

    revalidatePath('/inventaris/mutasi')
    revalidatePath('/inventaris/barang')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}
