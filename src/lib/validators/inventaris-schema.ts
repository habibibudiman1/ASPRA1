// =============================================================================
// lib/validators/inventaris-schema.ts
// Zod schemas untuk inventaris & peminjaman barang
// =============================================================================

import { z } from 'zod'

const KATEGORI_LIST = ['elektronik', 'furniture', 'atk', 'kendaraan', 'alat_olahraga', 'alat_lab', 'lainnya'] as const
const KONDISI_LIST = ['baik', 'rusak_ringan', 'rusak_berat'] as const
const JENIS_MUTASI_LIST = ['masuk', 'keluar', 'pindah_lokasi', 'rusak', 'hilang', 'disposal', 'perbaikan'] as const

// Tipe input form (useForm memakai ini)
export const createInventarisFormSchema = z.object({
  nama_barang: z.string().min(2, 'Nama barang minimal 2 karakter').max(200).trim(),
  kategori: z.enum(KATEGORI_LIST, { error: 'Pilih kategori yang valid' }),
  merk: z.string().max(100).trim().optional(),
  tipe_model: z.string().max(100).trim().optional(),
  jumlah_stok: z.number().int().min(0, 'Stok tidak boleh negatif'),
  satuan: z.string().min(1, 'Satuan wajib diisi').max(50).trim(),
  kondisi: z.enum(KONDISI_LIST),
  lokasi_penempatan: z.string().min(2, 'Lokasi wajib diisi').max(200).trim(),
  tanggal_perolehan: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid'),
  sumber_dana: z.string().max(100).trim().optional(),
  nilai_perolehan: z.number().min(0).nullable().optional(),
  foto: z.string().url('URL foto tidak valid').nullable().optional(),
  catatan: z.string().max(1000).nullable().optional(),
})

// Alias createInventarisSchema = createInventarisFormSchema (untuk kompatibilitas)
export const createInventarisSchema = createInventarisFormSchema

export const updateInventarisSchema = createInventarisFormSchema.partial().extend({
  id: z.string().uuid('ID barang tidak valid'),
})

export const createPeminjamanBarangSchema = z.object({
  inventaris_id: z.string().uuid('Pilih barang'),
  jumlah_dipinjam: z.number().int().min(1, 'Jumlah minimal 1'),
  tanggal_pinjam: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid'),
  tanggal_kembali_estimasi: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid'),
  catatan_peminjam: z.string().max(500).nullable().optional(),
}).refine(
  (data) => new Date(data.tanggal_kembali_estimasi) >= new Date(data.tanggal_pinjam),
  { message: 'Tanggal kembali harus setelah tanggal pinjam', path: ['tanggal_kembali_estimasi'] }
)

export const createMutasiSchema = z.object({
  inventaris_id: z.string().uuid('Pilih barang'),
  jenis_mutasi: z.enum(JENIS_MUTASI_LIST, { error: 'Pilih jenis mutasi yang valid' }),
  jumlah: z.number().int().min(1, 'Jumlah minimal 1'),
  dari_lokasi: z.string().max(200).nullable().optional(),
  ke_lokasi: z.string().max(200).nullable().optional(),
  keterangan: z.string().min(5, 'Keterangan minimal 5 karakter').max(500),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid'),
})

export const stockOpnameItemSchema = z.object({
  inventaris_id: z.string().uuid(),
  jumlah_fisik: z.number().int().min(0, 'Jumlah fisik tidak boleh negatif'),
  keterangan: z.string().max(500).optional(),
})

export type CreateInventarisSchema = z.infer<typeof createInventarisFormSchema>
export type UpdateInventarisSchema = z.infer<typeof updateInventarisSchema>
export type CreatePeminjamanBarangSchema = z.infer<typeof createPeminjamanBarangSchema>
export type CreateMutasiSchema = z.infer<typeof createMutasiSchema>
export type StockOpnameItemSchema = z.infer<typeof stockOpnameItemSchema>
