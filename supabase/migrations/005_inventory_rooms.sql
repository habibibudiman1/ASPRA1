-- =============================================================================
-- MIGRATION 005: Inventory, Rooms, Booking, Opname
-- Jalankan di Supabase SQL Editor setelah 000_master_migration.sql
-- =============================================================================

-- =============================================================================
-- STEP 1: BUAT TABEL
-- =============================================================================

-- Ruangan / Kelas
CREATE TABLE IF NOT EXISTS public.rooms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  code        TEXT NOT NULL UNIQUE,
  capacity    INT,
  location    TEXT,
  description TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Kategori barang inventaris
CREATE TABLE IF NOT EXISTS public.item_categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,
  description   TEXT,
  is_electronic BOOLEAN DEFAULT FALSE, -- TRUE = tracking per unit (seri/spek)
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Master barang
CREATE TABLE IF NOT EXISTS public.items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  item_category_id UUID REFERENCES public.item_categories(id) ON DELETE SET NULL,
  description      TEXT,
  is_electronic    BOOLEAN DEFAULT FALSE, -- copy dari kategori untuk kemudahan query
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Unit individual untuk barang elektronik (komputer-1, laptop-2, dst)
CREATE TABLE IF NOT EXISTS public.item_units (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id       UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  unit_code     TEXT NOT NULL UNIQUE,   -- e.g. "KOMP-001", "LAPT-003"
  serial_number TEXT,
  specs         JSONB,                  -- {"processor":"i5","ram":"8GB","storage":"256GB SSD"}
  condition     TEXT NOT NULL DEFAULT 'baik'
                  CHECK (condition IN ('baik', 'rusak_ringan', 'rusak_berat')),
  status        TEXT NOT NULL DEFAULT 'aktif'
                  CHECK (status IN ('aktif', 'nonaktif', 'rusak')),
  room_id       UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Barang non-elektronik per ruangan (tracking kuantitas)
CREATE TABLE IF NOT EXISTS public.room_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  item_id    UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  quantity   INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (room_id, item_id)
);

-- Booking ruangan
CREATE TABLE IF NOT EXISTS public.room_bookings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  booked_by     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title         TEXT NOT NULL,
  description   TEXT,
  start_time    TIMESTAMPTZ NOT NULL,
  end_time      TIMESTAMPTZ NOT NULL,
  status        TEXT NOT NULL DEFAULT 'confirmed'
                  CHECK (status IN ('confirmed', 'cancelled')),
  cancelled_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  cancelled_at  TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_booking_end_after_start CHECK (end_time > start_time)
);

-- Sesi opname (stock count)
CREATE TABLE IF NOT EXISTS public.opname_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conducted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  notes        TEXT,
  status       TEXT NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft', 'completed')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Detail item per sesi opname
CREATE TABLE IF NOT EXISTS public.opname_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opname_session_id UUID NOT NULL REFERENCES public.opname_sessions(id) ON DELETE CASCADE,
  item_id           UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  room_id           UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  expected_qty      INT NOT NULL DEFAULT 0 CHECK (expected_qty >= 0),
  actual_qty        INT NOT NULL DEFAULT 0 CHECK (actual_qty >= 0),
  notes             TEXT
);

-- Log mutasi barang (perpindahan antar ruangan)
CREATE TABLE IF NOT EXISTS public.item_mutations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id      UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  item_unit_id UUID REFERENCES public.item_units(id) ON DELETE SET NULL, -- untuk elektronik
  from_room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  to_room_id   UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  quantity     INT NOT NULL DEFAULT 1 CHECK (quantity > 0), -- untuk non-elektronik
  moved_by     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reason       TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- STEP 2: TRIGGERS updated_at
-- =============================================================================

DROP TRIGGER IF EXISTS rooms_updated_at ON public.rooms;
DROP TRIGGER IF EXISTS items_updated_at ON public.items;
DROP TRIGGER IF EXISTS item_units_updated_at ON public.item_units;
DROP TRIGGER IF EXISTS room_items_updated_at ON public.room_items;
DROP TRIGGER IF EXISTS room_bookings_updated_at ON public.room_bookings;

CREATE TRIGGER rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER item_units_updated_at
  BEFORE UPDATE ON public.item_units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER room_items_updated_at
  BEFORE UPDATE ON public.room_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER room_bookings_updated_at
  BEFORE UPDATE ON public.room_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STEP 3: INDEX
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_item_units_item_id    ON public.item_units(item_id);
CREATE INDEX IF NOT EXISTS idx_item_units_room_id    ON public.item_units(room_id);
CREATE INDEX IF NOT EXISTS idx_room_items_room_id    ON public.room_items(room_id);
CREATE INDEX IF NOT EXISTS idx_room_items_item_id    ON public.room_items(item_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id      ON public.room_bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booked_by    ON public.room_bookings(booked_by);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time   ON public.room_bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status       ON public.room_bookings(status);
CREATE INDEX IF NOT EXISTS idx_mutations_item_id     ON public.item_mutations(item_id);
CREATE INDEX IF NOT EXISTS idx_mutations_from_room   ON public.item_mutations(from_room_id);
CREATE INDEX IF NOT EXISTS idx_mutations_to_room     ON public.item_mutations(to_room_id);

-- =============================================================================
-- STEP 4: ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.rooms            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_units       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_bookings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opname_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opname_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_mutations   ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS "rooms_select_all"        ON public.rooms;
DROP POLICY IF EXISTS "rooms_insert_admin"      ON public.rooms;
DROP POLICY IF EXISTS "rooms_update_admin"      ON public.rooms;
DROP POLICY IF EXISTS "rooms_delete_admin"      ON public.rooms;
DROP POLICY IF EXISTS "item_cat_select"         ON public.item_categories;
DROP POLICY IF EXISTS "item_cat_insert_admin"   ON public.item_categories;
DROP POLICY IF EXISTS "item_cat_update_admin"   ON public.item_categories;
DROP POLICY IF EXISTS "item_cat_delete_admin"   ON public.item_categories;
DROP POLICY IF EXISTS "items_select_all"        ON public.items;
DROP POLICY IF EXISTS "items_insert_admin"      ON public.items;
DROP POLICY IF EXISTS "items_update_admin"      ON public.items;
DROP POLICY IF EXISTS "items_delete_admin"      ON public.items;
DROP POLICY IF EXISTS "item_units_select"       ON public.item_units;
DROP POLICY IF EXISTS "item_units_insert_admin" ON public.item_units;
DROP POLICY IF EXISTS "item_units_update_admin" ON public.item_units;
DROP POLICY IF EXISTS "item_units_delete_admin" ON public.item_units;
DROP POLICY IF EXISTS "room_items_select"       ON public.room_items;
DROP POLICY IF EXISTS "room_items_insert_admin" ON public.room_items;
DROP POLICY IF EXISTS "room_items_update_admin" ON public.room_items;
DROP POLICY IF EXISTS "room_items_delete_admin" ON public.room_items;
DROP POLICY IF EXISTS "bookings_select"         ON public.room_bookings;
DROP POLICY IF EXISTS "bookings_insert_auth"    ON public.room_bookings;
DROP POLICY IF EXISTS "bookings_update"         ON public.room_bookings;
DROP POLICY IF EXISTS "opname_sessions_admin"   ON public.opname_sessions;
DROP POLICY IF EXISTS "opname_items_admin"      ON public.opname_items;
DROP POLICY IF EXISTS "mutations_select_all"    ON public.item_mutations;
DROP POLICY IF EXISTS "mutations_insert_admin"  ON public.item_mutations;

-- ---- ROOMS ----
CREATE POLICY "rooms_select_all"    ON public.rooms FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "rooms_insert_admin"  ON public.rooms FOR INSERT WITH CHECK (get_user_role() = 'it_admin');
CREATE POLICY "rooms_update_admin"  ON public.rooms FOR UPDATE USING (get_user_role() = 'it_admin');
CREATE POLICY "rooms_delete_admin"  ON public.rooms FOR DELETE USING (get_user_role() = 'it_admin');

-- ---- ITEM CATEGORIES ----
CREATE POLICY "item_cat_select"        ON public.item_categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "item_cat_insert_admin"  ON public.item_categories FOR INSERT WITH CHECK (get_user_role() = 'it_admin');
CREATE POLICY "item_cat_update_admin"  ON public.item_categories FOR UPDATE USING (get_user_role() = 'it_admin');
CREATE POLICY "item_cat_delete_admin"  ON public.item_categories FOR DELETE USING (get_user_role() = 'it_admin');

-- ---- ITEMS ----
CREATE POLICY "items_select_all"    ON public.items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "items_insert_admin"  ON public.items FOR INSERT WITH CHECK (get_user_role() = 'it_admin');
CREATE POLICY "items_update_admin"  ON public.items FOR UPDATE USING (get_user_role() = 'it_admin');
CREATE POLICY "items_delete_admin"  ON public.items FOR DELETE USING (get_user_role() = 'it_admin');

-- ---- ITEM UNITS ----
CREATE POLICY "item_units_select"        ON public.item_units FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "item_units_insert_admin"  ON public.item_units FOR INSERT WITH CHECK (get_user_role() = 'it_admin');
CREATE POLICY "item_units_update_admin"  ON public.item_units FOR UPDATE USING (get_user_role() = 'it_admin');
CREATE POLICY "item_units_delete_admin"  ON public.item_units FOR DELETE USING (get_user_role() = 'it_admin');

-- ---- ROOM ITEMS ----
CREATE POLICY "room_items_select"        ON public.room_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "room_items_insert_admin"  ON public.room_items FOR INSERT WITH CHECK (get_user_role() = 'it_admin');
CREATE POLICY "room_items_update_admin"  ON public.room_items FOR UPDATE USING (get_user_role() = 'it_admin');
CREATE POLICY "room_items_delete_admin"  ON public.room_items FOR DELETE USING (get_user_role() = 'it_admin');

-- ---- ROOM BOOKINGS ----
-- user bisa lihat booking sendiri; admin lihat semua
CREATE POLICY "bookings_select" ON public.room_bookings
  FOR SELECT USING (booked_by = auth.uid() OR get_user_role() = 'it_admin');
CREATE POLICY "bookings_insert_auth" ON public.room_bookings
  FOR INSERT WITH CHECK (booked_by = auth.uid());
CREATE POLICY "bookings_update" ON public.room_bookings
  FOR UPDATE USING (booked_by = auth.uid() OR get_user_role() = 'it_admin');

-- ---- OPNAME (admin only) ----
CREATE POLICY "opname_sessions_admin" ON public.opname_sessions FOR ALL USING (get_user_role() = 'it_admin');
CREATE POLICY "opname_items_admin"    ON public.opname_items    FOR ALL USING (get_user_role() = 'it_admin');

-- ---- ITEM MUTATIONS ----
CREATE POLICY "mutations_select_all"   ON public.item_mutations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "mutations_insert_admin" ON public.item_mutations FOR INSERT WITH CHECK (get_user_role() = 'it_admin');

-- =============================================================================
-- STEP 5: SEED DATA
-- =============================================================================

INSERT INTO public.item_categories (name, description, is_electronic)
VALUES
  ('Elektronik',             'Komputer, laptop, printer, proyektor, dll — tracking per unit', TRUE),
  ('Furnitur',               'Meja, kursi, lemari, rak buku, dll',                            FALSE),
  ('Alat Tulis Kantor',      'Spidol, penghapus, stapler, gunting, dll',                      FALSE),
  ('Peralatan Kebersihan',   'Sapu, pel, tempat sampah, dll',                                 FALSE),
  ('Media Pembelajaran',     'Buku teks, modul, atlas, globe, dll',                           FALSE),
  ('Peralatan Olahraga',     'Bola, matras, net, dll',                                        FALSE),
  ('Lainnya',                'Barang lain yang tidak termasuk kategori di atas',               FALSE)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- SELESAI!
-- Cek tabel baru:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- =============================================================================
