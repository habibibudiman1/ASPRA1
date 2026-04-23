// =============================================================================
// lib/validators/ruangan-schema.ts
// Zod schemas untuk ruangan & booking
// =============================================================================

import { z } from 'zod'

export const createRuanganFormSchema = z.object({
  nama_ruangan: z.string().min(3, 'Nama ruangan minimal 3 karakter').max(100).trim(),
  lokasi_gedung: z.string().min(2, 'Lokasi gedung wajib diisi').max(100).trim(),
  lantai: z.number().int().positive().nullable().optional(),
  kapasitas: z.number().int().min(1, 'Kapasitas minimal 1').max(10000),
  fasilitas: z.array(z.string()),
  status: z.enum(['tersedia', 'maintenance', 'tidak_aktif']),
  foto: z.string().url('URL foto tidak valid').nullable().optional(),
  keterangan: z.string().max(500).nullable().optional(),
})

export const createRuanganSchema = createRuanganFormSchema

export const updateRuanganSchema = createRuanganFormSchema.partial().extend({
  id: z.string().uuid('ID ruangan tidak valid'),
})

export const createBookingSchema = z.object({
  ruangan_id: z.string().uuid('Pilih ruangan'),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid'),
  jam_mulai: z.string().regex(/^\d{2}:\d{2}$/, 'Format jam tidak valid'),
  jam_selesai: z.string().regex(/^\d{2}:\d{2}$/, 'Format jam tidak valid'),
  keperluan: z.string().min(10, 'Keperluan minimal 10 karakter').max(500),
  jumlah_peserta: z.number().int().min(1).nullable().optional(),
}).refine((data) => data.jam_selesai > data.jam_mulai, {
  message: 'Jam selesai harus setelah jam mulai',
  path: ['jam_selesai'],
})

export type CreateRuanganSchema = z.infer<typeof createRuanganFormSchema>
export type UpdateRuanganSchema = z.infer<typeof updateRuanganSchema>
export type CreateBookingSchema = z.infer<typeof createBookingSchema>

