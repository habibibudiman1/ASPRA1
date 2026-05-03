'use server'

// =============================================================================
// lib/actions/sla-actions.ts
// Server Actions untuk manajemen SLA policies
// =============================================================================

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, SLAPolicy } from '@/lib/types'

export async function getSLAPolicies(): Promise<SLAPolicy[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('sla_policies').select('*').order('priority')
  return data ?? []
}

export async function updateSLAPolicy(
  id: string,
  responseTimeMinutes: number,
  resolutionTimeMinutes: number
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession(); const user = session?.user
    if (!user) return { success: false, error: 'Tidak terautentikasi' }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!['it_admin', 'admin'].includes(profile?.role ?? '')) return { success: false, error: 'Hanya IT atau Admin yang bisa mengubah SLA' }

    if (responseTimeMinutes < 5 || resolutionTimeMinutes < 30) {
      return { success: false, error: 'Waktu respon minimal 5 menit, resolusi minimal 30 menit' }
    }
    if (responseTimeMinutes >= resolutionTimeMinutes) {
      return { success: false, error: 'Waktu resolusi harus lebih besar dari waktu respon' }
    }

    const { error } = await supabase
      .from('sla_policies')
      .update({
        response_time_minutes: responseTimeMinutes,
        resolution_time_minutes: resolutionTimeMinutes,
      })
      .eq('id', id)

    if (error) return { success: false, error: error.message }
    revalidatePath('/sla')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' }
  }
}

