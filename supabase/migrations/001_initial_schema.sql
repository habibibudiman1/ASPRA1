-- =============================================================================
-- Migration 001: Schema Awal Sistem Ticketing Yayasan Assakinah Sejahtera
-- =============================================================================

-- Aktifkan ekstensi yang diperlukan
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Fungsi untuk mendapatkan role user saat ini dari tabel profiles
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Fungsi untuk auto-update kolom updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fungsi untuk generate ticket number otomatis: TKT-YYYYMMDD-XXXX
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
  date_part TEXT;
  seq_part TEXT;
  count_today INT;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Hitung tiket yang dibuat hari ini
  SELECT COUNT(*) + 1 INTO count_today
  FROM public.tickets
  WHERE created_at::DATE = NOW()::DATE;
  
  seq_part := LPAD(count_today::TEXT, 4, '0');
  NEW.ticket_number := 'TKT-' || date_part || '-' || seq_part;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fungsi untuk hitung SLA deadline saat tiket dibuat
CREATE OR REPLACE FUNCTION calculate_sla_deadlines()
RETURNS TRIGGER AS $$
DECLARE
  policy RECORD;
BEGIN
  -- Ambil policy SLA berdasarkan prioritas tiket
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

-- =============================================================================
-- TABEL: profiles
-- Menyimpan data profil user (ekstensi dari auth.users Supabase)
-- =============================================================================
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

-- Trigger auto-update updated_at pada profiles
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fungsi & trigger untuk auto-create profile saat user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- TABEL: categories
-- Kategori tiket (Hardware, Software, Jaringan, dll)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,
  description   TEXT,
  color         TEXT DEFAULT '#6366f1',
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABEL: sla_policies
-- Kebijakan SLA per prioritas tiket
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.sla_policies (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  priority                  TEXT NOT NULL UNIQUE CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  response_time_minutes     INT NOT NULL DEFAULT 480,   -- 8 jam default
  resolution_time_minutes   INT NOT NULL DEFAULT 2880,  -- 48 jam default
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger auto-update updated_at pada sla_policies
CREATE TRIGGER sla_policies_updated_at
  BEFORE UPDATE ON public.sla_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABEL: tickets
-- Tiket IT support utama
-- =============================================================================
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
  -- SLA tracking
  sla_response_deadline   TIMESTAMPTZ,
  sla_resolution_deadline TIMESTAMPTZ,
  sla_response_met        BOOLEAN,
  sla_resolution_met      BOOLEAN,
  first_responded_at      TIMESTAMPTZ,
  -- Status timestamps
  resolved_at             TIMESTAMPTZ,
  closed_at               TIMESTAMPTZ,
  -- Rating dari staff setelah resolved
  rating                  INT CHECK (rating BETWEEN 1 AND 5),
  rating_comment          TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger untuk generate ticket_number otomatis
CREATE TRIGGER tickets_generate_number
  BEFORE INSERT ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION generate_ticket_number();

-- Trigger untuk hitung SLA deadlines saat tiket dibuat
CREATE TRIGGER tickets_calculate_sla
  BEFORE INSERT ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION calculate_sla_deadlines();

-- Trigger auto-update updated_at pada tickets
CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_tickets_reporter_id ON public.tickets(reporter_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee_id ON public.tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at DESC);

-- =============================================================================
-- TABEL: ticket_comments
-- Komentar dan internal notes pada tiket
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  content     TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE, -- Internal note: hanya terlihat IT Admin
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_ticket_id ON public.ticket_comments(ticket_id);

-- =============================================================================
-- TABEL: ticket_attachments
-- File lampiran pada tiket
-- =============================================================================
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

CREATE INDEX IF NOT EXISTS idx_attachments_ticket_id ON public.ticket_attachments(ticket_id);

-- =============================================================================
-- TABEL: ticket_activity_log
-- Audit trail setiap perubahan pada tiket
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.ticket_activity_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  actor_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  action      TEXT NOT NULL, -- 'created', 'status_changed', 'assigned', 'commented', 'rated', 'attachment_added'
  old_value   TEXT,
  new_value   TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_ticket_id ON public.ticket_activity_log(ticket_id);
CREATE INDEX IF NOT EXISTS idx_activity_actor_id ON public.ticket_activity_log(actor_id);

-- =============================================================================
-- TABEL: notifications
-- Notifikasi in-app untuk user
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticket_id   UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, is_read);
