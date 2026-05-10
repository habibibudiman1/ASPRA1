'use server'

// =============================================================================
// lib/actions/import-ruangan-actions.ts
// Server action untuk import data ruangan dari Excel
// =============================================================================

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'

interface RuanganImportRow {
  nama_ruangan: string
  lokasi_gedung: string
  lantai?: number | null
  kapasitas: number
  fasilitas?: string
  status?: string
  keterangan?: string
}

export interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: Array<{ row: number; message: string }>
  error?: string
}

const VALID_STATUSES = ['tersedia', 'maintenance', 'tidak_aktif']
const VALID_FASILITAS = ['proyektor', 'AC', 'whiteboard', 'sound_system', 'wifi', 'komputer', 'panggung', 'tv', 'printer']

export async function importRuanganFromExcel(rows: RuanganImportRow[]): Promise<ImportResult> {
  const supabase = await createClient()

  // Cek role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, imported: 0, skipped: 0, errors: [], error: 'Tidak terautentikasi' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'sarana' && profile?.role !== 'admin') {
    return { success: false, imported: 0, skipped: 0, errors: [], error: 'Akses ditolak' }
  }

  // Admin client untuk bypass RLS: policy INSERT ruangan hanya izinkan it_admin & admin, bukan sarana
  const adminClient = await createAdminClient()

  let imported = 0
  let skipped = 0
  const errors: Array<{ row: number; message: string }> = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // +2 karena row 1 = header

    // Validasi wajib
    if (!row.nama_ruangan?.trim()) {
      errors.push({ row: rowNum, message: 'Nama Ruangan wajib diisi' })
      skipped++
      continue
    }
    if (!row.lokasi_gedung?.trim()) {
      errors.push({ row: rowNum, message: `[${row.nama_ruangan}] Lokasi Gedung wajib diisi` })
      skipped++
      continue
    }
    if (!row.kapasitas || isNaN(Number(row.kapasitas)) || Number(row.kapasitas) <= 0) {
      errors.push({ row: rowNum, message: `[${row.nama_ruangan}] Kapasitas harus angka positif` })
      skipped++
      continue
    }

    // Validasi status
    const status = row.status?.toLowerCase().trim() || 'tersedia'
    if (!VALID_STATUSES.includes(status)) {
      errors.push({ row: rowNum, message: `[${row.nama_ruangan}] Status tidak valid. Gunakan: tersedia/maintenance/tidak_aktif` })
      skipped++
      continue
    }

    // Parse fasilitas — pisahkan dengan koma, validasi tiap item
    let fasilitas: string[] = []
    if (row.fasilitas?.trim()) {
      const rawFasilitas = row.fasilitas.split(',').map((f) => f.trim().toLowerCase())
      // Normalisasi alias umum
      const aliasMap: Record<string, string> = {
        'projector': 'proyektor', 'projek': 'proyektor',
        'air conditioner': 'AC', 'ac': 'AC',
        'white board': 'whiteboard',
        'sound': 'sound_system', 'audio': 'sound_system',
        'internet': 'wifi', 'wi-fi': 'wifi',
        'pc': 'komputer', 'computer': 'komputer',
        'stage': 'panggung',
        'monitor': 'tv', 'television': 'tv',
      }
      fasilitas = rawFasilitas
        .map((f) => aliasMap[f] ?? f)
        .filter((f) => VALID_FASILITAS.includes(f))
    }

    const payload = {
      nama_ruangan: row.nama_ruangan.trim(),
      lokasi_gedung: row.lokasi_gedung.trim(),
      lantai: row.lantai ? Number(row.lantai) : null,
      kapasitas: Number(row.kapasitas),
      fasilitas,
      status,
      keterangan: row.keterangan?.trim() || null,
    }

    const { error: insertError } = await adminClient.from('ruangan').insert(payload)
    if (insertError) {
      if (insertError.message.includes('unique') || insertError.message.includes('duplicate')) {
        errors.push({ row: rowNum, message: `[${row.nama_ruangan}] Nama ruangan sudah ada, dilewati` })
        skipped++
      } else {
        errors.push({ row: rowNum, message: `[${row.nama_ruangan}] ${insertError.message}` })
        skipped++
      }
      continue
    }

    imported++
  }

  if (imported > 0) {
    revalidatePath('/ruangan/kelola')
    revalidatePath('/ruangan')
  }

  return { success: true, imported, skipped, errors }
}
