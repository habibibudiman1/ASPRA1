'use server'

// =============================================================================
// lib/actions/category-actions.ts
// Server Actions untuk manajemen kategori (IT Admin only)
// =============================================================================

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, Category } from '@/lib/types'
import { createCategorySchema } from '@/lib/validators/user-schema'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user
  if (!user) throw new Error('Tidak terautentikasi')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['it_admin', 'admin'].includes(profile?.role ?? '')) throw new Error('Hanya IT atau Admin yang bisa melakukan aksi ini')
  return { supabase, user }
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })
  if (error) return []
  return data ?? []
}

export async function createCategory(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()
    const raw = {
      name: formData.get('name'),
      description: formData.get('description') ?? undefined,
      color: formData.get('color') ?? '#6366f1',
    }
    const validation = createCategorySchema.safeParse(raw)
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message ?? 'Input tidak valid' }
    }
    const { error } = await supabase.from('categories').insert(validation.data)
    if (error) return { success: false, error: error.message.includes('unique') ? 'Nama kategori sudah digunakan' : error.message }
    revalidatePath('/categories')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

export async function updateCategory(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()
    const raw = {
      name: formData.get('name'),
      description: formData.get('description') ?? undefined,
      color: formData.get('color') ?? '#6366f1',
    }
    const validation = createCategorySchema.safeParse(raw)
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message ?? 'Input tidak valid' }
    }
    const { error } = await supabase.from('categories').update(validation.data).eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/categories')
    revalidatePath('/tickets')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

export async function toggleCategoryActive(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase.from('categories').update({ is_active: isActive }).eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/categories')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()
    // Cek apakah kategori masih digunakan tiket
    const { count } = await supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('category_id', id)
    if (count && count > 0) {
      return { success: false, error: `Kategori tidak bisa dihapus karena masih digunakan oleh ${count} tiket. Nonaktifkan saja.` }
    }
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/categories')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

