'use server'

// =============================================================================
// lib/actions/user-actions.ts
// Server Actions untuk manajemen user dan profil
// =============================================================================

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { ActionResult, Profile } from '@/lib/types'
import { createUserSchema, updateUserSchema, updateProfileSchema, changePasswordSchema } from '@/lib/validators/user-schema'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Tidak terautentikasi')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Hanya Admin yang bisa melakukan aksi ini')
  return { supabase, user }
}

export async function getCurrentUser(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return data ?? null
}

export async function getUsers(role?: 'staff' | 'it_admin' | 'admin' | 'sarana'): Promise<Profile[]> {
  const supabase = await createClient()
  let query = supabase.from('profiles').select('*').order('full_name', { ascending: true })
  if (role) query = query.eq('role', role)
  const { data } = await query
  return data ?? []
}

export async function getAdmins(): Promise<Profile[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['it_admin', 'admin'])
    .eq('is_active', true)
    .order('full_name', { ascending: true })
  return data ?? []
}

export async function createUser(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
    const raw = {
      full_name: formData.get('full_name'),
      email: formData.get('email'),
      role: formData.get('role'),
      department: formData.get('department') ?? undefined,
      password: formData.get('password'),
    }
    const validation = createUserSchema.safeParse(raw)
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message ?? 'Input tidak valid' }
    }
    const { full_name, email, role, department, password } = validation.data
    const adminClient = await createAdminClient()
    // Buat user di Supabase Auth
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role },
    })
    if (authError) {
      return { success: false, error: authError.message.includes('already') ? 'Email sudah terdaftar' : authError.message }
    }
    // Update profil dengan data tambahan (trigger sudah membuat profil dasar)
    if (authData.user) {
      await adminClient.from('profiles').update({ full_name, role, department }).eq('id', authData.user.id)
    }
    revalidatePath('/users')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

export async function updateUser(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
    const raw = {
      id: formData.get('id'),
      full_name: formData.get('full_name') ?? undefined,
      role: formData.get('role') ?? undefined,
      department: formData.get('department') ?? undefined,
      is_active: formData.get('is_active') === 'true',
    }
    const validation = updateUserSchema.safeParse(raw)
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message ?? 'Input tidak valid' }
    }
    const { id, ...updates } = validation.data
    const supabase = await createClient()
    const { error } = await supabase.from('profiles').update(updates).eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/users')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

export async function toggleUserActive(userId: string, isActive: boolean): Promise<ActionResult> {
  try {
    await requireAdmin()
    const supabase = await createClient()
    const { error } = await supabase.from('profiles').update({ is_active: isActive }).eq('id', userId)
    if (error) return { success: false, error: error.message }
    revalidatePath('/users')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Tidak terautentikasi' }
    const raw = {
      full_name: formData.get('full_name') ?? undefined,
      department: formData.get('department') ?? undefined,
    }
    const validation = updateProfileSchema.safeParse(raw)
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message ?? 'Input tidak valid' }
    }
    const { error } = await supabase.from('profiles').update(validation.data).eq('id', user.id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/settings')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

export async function changePassword(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Tidak terautentikasi' }
    const raw = {
      new_password: formData.get('new_password'),
      confirm_password: formData.get('confirm_password'),
    }
    const validation = changePasswordSchema.safeParse(raw)
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message ?? 'Input tidak valid' }
    }
    const { error } = await supabase.auth.updateUser({ password: validation.data.new_password })
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
