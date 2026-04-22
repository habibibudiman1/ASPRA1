-- =============================================================================
-- MASTER MIGRATION: Jalankan file ini SEKALI di Supabase SQL Editor
-- Menggabungkan 001 + 002 + 003 dengan urutan yang benar
-- Project: Sistem Ticketing Yayasan Assakinah Sejahtera
-- =============================================================================

-- Aktifkan ekstensi yang diperlukan
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- STEP 1: BUAT SEMUA TABEL DAHULU
-- =============================================================================

-- TABEL: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  role          TEXT NOT NULL CHECK (role IN ('staff', 'it_admin')) DEFAULT 'staff',
  avatar_url    TEXT,
  department    TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- TABEL: categories
CREATE TABLE IF NOT EXISTS public.categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,
  description   TEXT,
  color         TEXT DEFAULT '#6366f1',
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- TABEL: sla_policies
CREATE TABLE IF NOT EXISTS public.sla_policies (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  priority                  TEXT NOT NULL UNIQUE CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  response_time_minutes     INT NOT NULL DEFAULT 480,
  resolution_time_minutes   INT NOT NULL DEFAULT 2880,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

-- TABEL: tickets
CREATE TABLE IF NOT EXISTS public.tickets (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number           TEXT NOT NULL UNIQUE,
  title                   TEXT NOT NULL,
  description             TEXT NOT NULL,
  status                  TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'reopened')) DEFAULT 'open',
  priority                TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  category_id             UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  reporter_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  assignee_id             UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sla_response_deadline   TIMESTAMPTZ,
  sla_resolution_deadline TIMESTAMPTZ,
  sla_response_met        BOOLEAN,
  sla_resolution_met      BOOLEAN,
  first_responded_at      TIMESTAMPTZ,
  resolved_at             TIMESTAMPTZ,
  closed_at               TIMESTAMPTZ,
  rating                  INT CHECK (rating BETWEEN 1 AND 5),
  rating_comment          TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- TABEL: ticket_comments
CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  content     TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- TABEL: ticket_attachments
CREATE TABLE IF NOT EXISTS public.ticket_attachments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id     UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  uploaded_by   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  file_name     TEXT NOT NULL,
  file_url      TEXT NOT NULL,
  file_size     INT,
  mime_type     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- TABEL: ticket_activity_log
CREATE TABLE IF NOT EXISTS public.ticket_activity_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  actor_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  action      TEXT NOT NULL,
  old_value   TEXT,
  new_value   TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- TABEL: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticket_id   UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- STEP 2: BUAT HELPER FUNCTIONS (setelah tabel ada)
-- =============================================================================

-- Fungsi untuk mendapatkan role user saat ini
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Fungsi untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fungsi generate ticket number: TKT-YYYYMMDD-XXXX
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
  date_part TEXT;
  seq_part TEXT;
  count_today INT;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO count_today
  FROM public.tickets
  WHERE created_at::DATE = NOW()::DATE;
  seq_part := LPAD(count_today::TEXT, 4, '0');
  NEW.ticket_number := 'TKT-' || date_part || '-' || seq_part;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fungsi hitung SLA deadline saat tiket dibuat
CREATE OR REPLACE FUNCTION calculate_sla_deadlines()
RETURNS TRIGGER AS $$
DECLARE
  policy RECORD;
BEGIN
  SELECT * INTO policy
  FROM public.sla_policies
  WHERE priority = NEW.priority;
  IF FOUND THEN
    NEW.sla_response_deadline := NOW() + (policy.response_time_minutes || ' minutes')::INTERVAL;
    NEW.sla_resolution_deadline := NOW() + (policy.resolution_time_minutes || ' minutes')::INTERVAL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fungsi auto-create profile saat user signup Supabase Auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- STEP 3: BUAT TRIGGERS
-- =============================================================================

-- Drop trigger jika sudah ada (idempotent)
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS sla_policies_updated_at ON public.sla_policies;
DROP TRIGGER IF EXISTS tickets_generate_number ON public.tickets;
DROP TRIGGER IF EXISTS tickets_calculate_sla ON public.tickets;
DROP TRIGGER IF EXISTS tickets_updated_at ON public.tickets;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER sla_policies_updated_at
  BEFORE UPDATE ON public.sla_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tickets_generate_number
  BEFORE INSERT ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION generate_ticket_number();

CREATE TRIGGER tickets_calculate_sla
  BEFORE INSERT ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION calculate_sla_deadlines();

CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- STEP 4: INDEX
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_tickets_reporter_id ON public.tickets(reporter_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee_id ON public.tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_ticket_id ON public.ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_attachments_ticket_id ON public.ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_activity_ticket_id ON public.ticket_activity_log(ticket_id);
CREATE INDEX IF NOT EXISTS idx_activity_actor_id ON public.ticket_activity_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, is_read);

-- =============================================================================
-- STEP 5: AKTIFKAN RLS
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 6: RLS POLICIES
-- =============================================================================

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
DROP POLICY IF EXISTS "categories_select_all" ON public.categories;
DROP POLICY IF EXISTS "categories_write_admin" ON public.categories;
DROP POLICY IF EXISTS "categories_update_admin" ON public.categories;
DROP POLICY IF EXISTS "categories_delete_admin" ON public.categories;
DROP POLICY IF EXISTS "sla_select_all" ON public.sla_policies;
DROP POLICY IF EXISTS "sla_update_admin" ON public.sla_policies;
DROP POLICY IF EXISTS "sla_insert_admin" ON public.sla_policies;
DROP POLICY IF EXISTS "tickets_select_own_staff" ON public.tickets;
DROP POLICY IF EXISTS "tickets_select_all_admin" ON public.tickets;
DROP POLICY IF EXISTS "tickets_insert_staff" ON public.tickets;
DROP POLICY IF EXISTS "tickets_update_admin" ON public.tickets;
DROP POLICY IF EXISTS "tickets_update_own_staff" ON public.tickets;
DROP POLICY IF EXISTS "comments_select_staff" ON public.ticket_comments;
DROP POLICY IF EXISTS "comments_select_admin" ON public.ticket_comments;
DROP POLICY IF EXISTS "comments_insert_staff" ON public.ticket_comments;
DROP POLICY IF EXISTS "comments_insert_admin" ON public.ticket_comments;
DROP POLICY IF EXISTS "comments_delete_own" ON public.ticket_comments;
DROP POLICY IF EXISTS "comments_delete_admin" ON public.ticket_comments;
DROP POLICY IF EXISTS "attachments_select_staff" ON public.ticket_attachments;
DROP POLICY IF EXISTS "attachments_select_admin" ON public.ticket_attachments;
DROP POLICY IF EXISTS "attachments_insert" ON public.ticket_attachments;
DROP POLICY IF EXISTS "activity_select_staff" ON public.ticket_activity_log;
DROP POLICY IF EXISTS "activity_select_admin" ON public.ticket_activity_log;
DROP POLICY IF EXISTS "activity_insert" ON public.ticket_activity_log;
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;

-- ---- PROFILES ----
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_all_admin" ON public.profiles
  FOR SELECT USING (get_user_role() = 'it_admin');
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (get_user_role() = 'it_admin');
CREATE POLICY "profiles_insert_admin" ON public.profiles
  FOR INSERT WITH CHECK (get_user_role() = 'it_admin');

-- ---- CATEGORIES ----
CREATE POLICY "categories_select_all" ON public.categories
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "categories_write_admin" ON public.categories
  FOR INSERT WITH CHECK (get_user_role() = 'it_admin');
CREATE POLICY "categories_update_admin" ON public.categories
  FOR UPDATE USING (get_user_role() = 'it_admin');
CREATE POLICY "categories_delete_admin" ON public.categories
  FOR DELETE USING (get_user_role() = 'it_admin');

-- ---- SLA POLICIES ----
CREATE POLICY "sla_select_all" ON public.sla_policies
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "sla_update_admin" ON public.sla_policies
  FOR UPDATE USING (get_user_role() = 'it_admin');
CREATE POLICY "sla_insert_admin" ON public.sla_policies
  FOR INSERT WITH CHECK (get_user_role() = 'it_admin');

-- ---- TICKETS ----
CREATE POLICY "tickets_select_own_staff" ON public.tickets
  FOR SELECT USING (get_user_role() = 'staff' AND reporter_id = auth.uid());
CREATE POLICY "tickets_select_all_admin" ON public.tickets
  FOR SELECT USING (get_user_role() = 'it_admin');
CREATE POLICY "tickets_insert_staff" ON public.tickets
  FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "tickets_update_admin" ON public.tickets
  FOR UPDATE USING (get_user_role() = 'it_admin');
CREATE POLICY "tickets_update_own_staff" ON public.tickets
  FOR UPDATE USING (get_user_role() = 'staff' AND reporter_id = auth.uid());

-- ---- TICKET COMMENTS ----
CREATE POLICY "comments_select_staff" ON public.ticket_comments
  FOR SELECT USING (
    get_user_role() = 'staff' AND is_internal = FALSE
    AND ticket_id IN (SELECT id FROM public.tickets WHERE reporter_id = auth.uid())
  );
CREATE POLICY "comments_select_admin" ON public.ticket_comments
  FOR SELECT USING (get_user_role() = 'it_admin');
CREATE POLICY "comments_insert_staff" ON public.ticket_comments
  FOR INSERT WITH CHECK (
    get_user_role() = 'staff' AND author_id = auth.uid() AND is_internal = FALSE
    AND ticket_id IN (SELECT id FROM public.tickets WHERE reporter_id = auth.uid())
  );
CREATE POLICY "comments_insert_admin" ON public.ticket_comments
  FOR INSERT WITH CHECK (get_user_role() = 'it_admin' AND author_id = auth.uid());
CREATE POLICY "comments_delete_own" ON public.ticket_comments
  FOR DELETE USING (author_id = auth.uid());
CREATE POLICY "comments_delete_admin" ON public.ticket_comments
  FOR DELETE USING (get_user_role() = 'it_admin');

-- ---- TICKET ATTACHMENTS ----
CREATE POLICY "attachments_select_staff" ON public.ticket_attachments
  FOR SELECT USING (
    get_user_role() = 'staff'
    AND ticket_id IN (SELECT id FROM public.tickets WHERE reporter_id = auth.uid())
  );
CREATE POLICY "attachments_select_admin" ON public.ticket_attachments
  FOR SELECT USING (get_user_role() = 'it_admin');
CREATE POLICY "attachments_insert" ON public.ticket_attachments
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid()
    AND (get_user_role() = 'it_admin' OR ticket_id IN (SELECT id FROM public.tickets WHERE reporter_id = auth.uid()))
  );

-- ---- TICKET ACTIVITY LOG ----
CREATE POLICY "activity_select_staff" ON public.ticket_activity_log
  FOR SELECT USING (
    get_user_role() = 'staff'
    AND ticket_id IN (SELECT id FROM public.tickets WHERE reporter_id = auth.uid())
  );
CREATE POLICY "activity_select_admin" ON public.ticket_activity_log
  FOR SELECT USING (get_user_role() = 'it_admin');
CREATE POLICY "activity_insert" ON public.ticket_activity_log
  FOR INSERT WITH CHECK (actor_id = auth.uid());

-- ---- NOTIFICATIONS ----
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());

-- =============================================================================
-- STEP 7: SEED DATA
-- =============================================================================

-- SLA Policies default
INSERT INTO public.sla_policies (priority, response_time_minutes, resolution_time_minutes)
VALUES
  ('low',      480,  2880),   -- 8 jam respon, 48 jam resolusi
  ('medium',   240,  1440),   -- 4 jam respon, 24 jam resolusi
  ('high',     60,   480),    -- 1 jam respon, 8 jam resolusi
  ('critical', 30,   240)     -- 30 menit respon, 4 jam resolusi
ON CONFLICT (priority) DO UPDATE SET
  response_time_minutes   = EXCLUDED.response_time_minutes,
  resolution_time_minutes = EXCLUDED.resolution_time_minutes;

-- Kategori tiket default
INSERT INTO public.categories (name, description, color)
VALUES
  ('Hardware',    'Masalah perangkat keras: komputer, printer, monitor, keyboard, dll.',    '#F44336'),
  ('Software',    'Masalah perangkat lunak: aplikasi, sistem operasi, lisensi, dll.',       '#2196F3'),
  ('Jaringan',    'Masalah koneksi internet, WiFi, LAN, VPN, dll.',                         '#FF9800'),
  ('Email',       'Masalah email, email client, atau akun email.',                           '#9C27B0'),
  ('Akses & Akun','Masalah login, reset password, hak akses aplikasi.',                     '#4CAF50'),
  ('CCTV & Telp', 'Masalah CCTV, telepon kantor, atau sistem komunikasi.',                  '#795548'),
  ('Lainnya',     'Masalah IT lain yang tidak termasuk kategori di atas.',                  '#607D8B')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- STEP 8: GRANT permissions untuk service role
-- =============================================================================
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- =============================================================================
-- SELESAI! Cek hasil:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- =============================================================================
