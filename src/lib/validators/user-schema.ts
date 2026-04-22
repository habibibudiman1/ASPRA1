// =============================================================================
// lib/validators/user-schema.ts
// Zod schemas untuk validasi user dan profil
// =============================================================================

import { z } from 'zod'

// Schema untuk membuat user baru (IT Admin only)
export const createUserSchema = z.object({
  full_name: z
    .string()
    .min(3, 'Nama lengkap minimal 3 karakter')
    .max(100, 'Nama lengkap maksimal 100 karakter')
    .trim(),
  email: z
    .string()
    .email('Format email tidak valid')
    .toLowerCase()
    .trim(),
  role: z.enum(['staff', 'it_admin'], {
    error: 'Role tidak valid',
  }),
  department: z
    .string()
    .max(100, 'Departemen maksimal 100 karakter')
    .trim()
    .optional(),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password harus mengandung huruf besar, huruf kecil, dan angka'
    ),
})

// Schema untuk update user (IT Admin only)
export const updateUserSchema = z.object({
  id: z.string().uuid('ID user tidak valid'),
  full_name: z
    .string()
    .min(3, 'Nama lengkap minimal 3 karakter')
    .max(100, 'Nama lengkap maksimal 100 karakter')
    .trim()
    .optional(),
  role: z.enum(['staff', 'it_admin']).optional(),
  department: z
    .string()
    .max(100)
    .trim()
    .optional(),
  is_active: z.boolean().optional(),
})

// Schema untuk update profil sendiri
export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .min(3, 'Nama lengkap minimal 3 karakter')
    .max(100, 'Nama lengkap maksimal 100 karakter')
    .trim()
    .optional(),
  department: z
    .string()
    .max(100, 'Departemen maksimal 100 karakter')
    .trim()
    .optional(),
})

// Schema untuk ganti password
export const changePasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(8, 'Password minimal 8 karakter')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password harus mengandung huruf besar, huruf kecil, dan angka'
      ),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Konfirmasi password tidak cocok',
    path: ['confirm_password'],
  })

// Schema untuk kategori
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, 'Nama kategori minimal 2 karakter')
    .max(50, 'Nama kategori maksimal 50 karakter')
    .trim(),
  description: z
    .string()
    .max(200, 'Deskripsi maksimal 200 karakter')
    .trim()
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Format warna tidak valid (gunakan hex color)')
    .default('#6366f1'),
})

// Types yang diinfer dari schemas
export type CreateUserSchema = z.infer<typeof createUserSchema>
export type UpdateUserSchema = z.infer<typeof updateUserSchema>
export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>
export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>
export type CreateCategorySchema = z.infer<typeof createCategorySchema>
