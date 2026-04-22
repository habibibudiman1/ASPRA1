// =============================================================================
// lib/validators/ticket-schema.ts
// Zod schemas untuk validasi tiket — kompatibel dengan Zod v4
// =============================================================================

import { z } from 'zod'

// Schema untuk membuat tiket baru
export const createTicketSchema = z.object({
  title: z
    .string()
    .min(5, 'Judul tiket minimal 5 karakter')
    .max(200, 'Judul tiket maksimal 200 karakter')
    .trim(),
  description: z
    .string()
    .min(20, 'Deskripsi minimal 20 karakter')
    .max(5000, 'Deskripsi maksimal 5000 karakter')
    .trim(),
  priority: z.enum(['low', 'medium', 'high', 'critical'], {
    error: 'Pilih prioritas yang valid',
  }),
  category_id: z.string().uuid('Pilih kategori yang valid'),
})

// Schema untuk update status tiket
export const updateTicketStatusSchema = z.object({
  ticket_id: z.string().uuid('ID tiket tidak valid'),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed', 'reopened'], {
    error: 'Status tidak valid',
  }),
  comment: z.string().max(1000).optional(),
})

// Schema untuk assign tiket
export const assignTicketSchema = z.object({
  ticket_id: z.string().uuid('ID tiket tidak valid'),
  assignee_id: z.string().uuid('ID assignee tidak valid').nullable(),
})

// Schema untuk rating tiket setelah resolved
export const rateTicketSchema = z.object({
  ticket_id: z.string().uuid('ID tiket tidak valid'),
  rating: z
    .number()
    .int()
    .min(1, 'Rating minimal 1')
    .max(5, 'Rating maksimal 5'),
  rating_comment: z
    .string()
    .max(500, 'Komentar rating maksimal 500 karakter')
    .optional(),
})

// Types yang diinfer dari schemas
export type CreateTicketSchema = z.infer<typeof createTicketSchema>
export type UpdateTicketStatusSchema = z.infer<typeof updateTicketStatusSchema>
export type AssignTicketSchema = z.infer<typeof assignTicketSchema>
export type RateTicketSchema = z.infer<typeof rateTicketSchema>
