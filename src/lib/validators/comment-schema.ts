// =============================================================================
// lib/validators/comment-schema.ts
// Zod schemas untuk validasi komentar
// =============================================================================

import { z } from 'zod'

// Schema untuk menambah komentar
export const createCommentSchema = z.object({
  ticket_id: z.string().uuid('ID tiket tidak valid'),
  content: z
    .string()
    .min(1, 'Komentar tidak boleh kosong')
    .max(2000, 'Komentar maksimal 2000 karakter')
    .trim(),
  is_internal: z.boolean().default(false),
})

// Types yang diinfer dari schema
export type CreateCommentSchema = z.infer<typeof createCommentSchema>
