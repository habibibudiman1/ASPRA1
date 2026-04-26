-- =============================================================================
-- Enable Supabase Realtime on ticket_comments
-- Jalankan di Supabase SQL Editor atau via CLI
-- =============================================================================

-- Tambahkan ticket_comments ke publikasi realtime (jika belum ada)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'ticket_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_comments;
  END IF;
END;
$$;

-- REPLICA IDENTITY FULL agar payload DELETE menyertakan data baris lengkap
ALTER TABLE public.ticket_comments REPLICA IDENTITY FULL;
