-- =============================================================================
-- Migration 004: Schema Baru — Peminjaman Ruangan + Manajemen Inventaris + Role Sarana
-- Yayasan Assakinah Sejahtera
-- =============================================================================

-- =============================================================================
-- STEP 1: Tambah role 'sarana' ke profiles
-- =============================================================================
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('staff', 'it_admin', 'sarana'));

-- =============================================================================
-- STEP 2: Update tabel notifications — tambah kolom tipe & reference_id
-- =============================================================================
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS tipe TEXT CHECK (tipe IN ('tiket', 'booking_ruangan', 'peminjaman_barang', 'inventaris', 'sistem')) DEFAULT 'tiket',
  ADD COLUMN IF NOT EXISTS reference_id TEXT;

-- =============================================================================
-- STEP 3: TABEL ruangan
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.ruangan (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_ruangan      TEXT NOT NULL UNIQUE,
  lokasi_gedung     TEXT NOT NULL,
  lantai            INT,
  kapasitas         INT NOT NULL CHECK (kapasitas > 0),
  fasilitas         JSONB DEFAULT '[]'::JSONB,   -- ["proyektor","AC","whiteboard"]
  status            TEXT NOT NULL CHECK (status IN ('tersedia', 'maintenance', 'tidak_aktif')) DEFAULT 'tersedia',
  foto              TEXT,
  keterangan        TEXT,
  is_deleted        BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER ruangan_updated_at
  BEFORE UPDATE ON public.ruangan
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_ruangan_status   ON public.ruangan(status)   WHERE NOT is_deleted;
CREATE INDEX IF NOT EXISTS idx_ruangan_gedung   ON public.ruangan(lokasi_gedung) WHERE NOT is_deleted;

-- =============================================================================
-- STEP 4: TABEL peminjaman_ruangan
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.peminjaman_ruangan (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ruangan_id          UUID NOT NULL REFERENCES public.ruangan(id) ON DELETE RESTRICT,
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  tanggal             DATE NOT NULL,
  jam_mulai           TIME NOT NULL,
  jam_selesai         TIME NOT NULL,
  keperluan           TEXT NOT NULL CHECK (LENGTH(keperluan) >= 10),
  jumlah_peserta      INT CHECK (jumlah_peserta > 0),
  status              TEXT NOT NULL CHECK (status IN ('menunggu', 'disetujui', 'ditolak', 'selesai', 'dibatalkan')) DEFAULT 'menunggu',
  catatan_admin       TEXT,
  approved_by         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at         TIMESTAMPTZ,
  cancelled_reason    TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  -- Validasi: jam_selesai harus setelah jam_mulai
  CONSTRAINT chk_jam_valid CHECK (jam_selesai > jam_mulai)
);

CREATE TRIGGER peminjaman_ruangan_updated_at
  BEFORE UPDATE ON public.peminjaman_ruangan
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_pr_ruangan_id    ON public.peminjaman_ruangan(ruangan_id);
CREATE INDEX IF NOT EXISTS idx_pr_user_id       ON public.peminjaman_ruangan(user_id);
CREATE INDEX IF NOT EXISTS idx_pr_status        ON public.peminjaman_ruangan(status);
CREATE INDEX IF NOT EXISTS idx_pr_tanggal       ON public.peminjaman_ruangan(tanggal);
CREATE INDEX IF NOT EXISTS idx_pr_ruangan_tanggal ON public.peminjaman_ruangan(ruangan_id, tanggal);

-- =============================================================================
-- STEP 5: TABEL inventaris
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.inventaris (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_barang           TEXT NOT NULL UNIQUE,
  nama_barang           TEXT NOT NULL,
  kategori              TEXT NOT NULL CHECK (kategori IN ('elektronik', 'furniture', 'atk', 'kendaraan', 'alat_olahraga', 'alat_lab', 'lainnya')),
  merk                  TEXT,
  tipe_model            TEXT,
  jumlah_stok           INT NOT NULL DEFAULT 0 CHECK (jumlah_stok >= 0),
  satuan                TEXT NOT NULL,
  kondisi               TEXT NOT NULL CHECK (kondisi IN ('baik', 'rusak_ringan', 'rusak_berat')) DEFAULT 'baik',
  lokasi_penempatan     TEXT NOT NULL,
  tanggal_perolehan     DATE NOT NULL,
  sumber_dana           TEXT,
  nilai_perolehan       NUMERIC(15, 2),
  foto                  TEXT,
  catatan               TEXT,
  is_deleted            BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER inventaris_updated_at
  BEFORE UPDATE ON public.inventaris
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_inv_kategori   ON public.inventaris(kategori)  WHERE NOT is_deleted;
CREATE INDEX IF NOT EXISTS idx_inv_kondisi    ON public.inventaris(kondisi)   WHERE NOT is_deleted;
CREATE INDEX IF NOT EXISTS idx_inv_lokasi     ON public.inventaris(lokasi_penempatan) WHERE NOT is_deleted;
CREATE INDEX IF NOT EXISTS idx_inv_kode       ON public.inventaris(kode_barang);

-- Fungsi auto-generate kode_barang
CREATE OR REPLACE FUNCTION generate_kode_barang(p_kategori TEXT)
RETURNS TEXT AS $$
DECLARE
  prefix    TEXT;
  seq_num   INT;
  kode      TEXT;
BEGIN
  prefix := CASE p_kategori
    WHEN 'elektronik'    THEN 'ELK'
    WHEN 'furniture'     THEN 'FRN'
    WHEN 'atk'           THEN 'ATK'
    WHEN 'kendaraan'     THEN 'KDR'
    WHEN 'alat_olahraga' THEN 'OLR'
    WHEN 'alat_lab'      THEN 'LAB'
    ELSE 'LNY'
  END;

  SELECT COALESCE(MAX(CAST(SUBSTRING(kode_barang FROM 9) AS INT)), 0) + 1
    INTO seq_num
    FROM public.inventaris
   WHERE kode_barang LIKE 'INV-' || prefix || '-%';

  kode := 'INV-' || prefix || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN kode;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- STEP 6: TABEL peminjaman_barang
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.peminjaman_barang (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventaris_id               UUID NOT NULL REFERENCES public.inventaris(id) ON DELETE RESTRICT,
  user_id                     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  jumlah_dipinjam             INT NOT NULL CHECK (jumlah_dipinjam >= 1),
  tanggal_pinjam              DATE NOT NULL,
  tanggal_kembali_estimasi    DATE NOT NULL,
  tanggal_dikembalikan_aktual DATE,
  status                      TEXT NOT NULL CHECK (status IN ('menunggu', 'dipinjam', 'dikembalikan', 'terlambat', 'hilang')) DEFAULT 'menunggu',
  kondisi_saat_kembali        TEXT CHECK (kondisi_saat_kembali IN ('baik', 'rusak_ringan', 'rusak_berat', 'hilang')),
  catatan_peminjam            TEXT,
  catatan_sarana              TEXT,
  approved_by                 UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at                 TIMESTAMPTZ,
  returned_to                 UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  returned_at                 TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_tgl_kembali CHECK (tanggal_kembali_estimasi >= tanggal_pinjam)
);

CREATE TRIGGER peminjaman_barang_updated_at
  BEFORE UPDATE ON public.peminjaman_barang
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_pb_inventaris_id ON public.peminjaman_barang(inventaris_id);
CREATE INDEX IF NOT EXISTS idx_pb_user_id       ON public.peminjaman_barang(user_id);
CREATE INDEX IF NOT EXISTS idx_pb_status        ON public.peminjaman_barang(status);

-- =============================================================================
-- STEP 7: TABEL mutasi_barang (immutable audit trail)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.mutasi_barang (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventaris_id   UUID NOT NULL REFERENCES public.inventaris(id) ON DELETE RESTRICT,
  jenis_mutasi    TEXT NOT NULL CHECK (jenis_mutasi IN ('masuk', 'keluar', 'pindah_lokasi', 'rusak', 'hilang', 'disposal', 'perbaikan')),
  jumlah          INT NOT NULL CHECK (jumlah > 0),
  stok_sebelum    INT NOT NULL CHECK (stok_sebelum >= 0),
  stok_sesudah    INT NOT NULL CHECK (stok_sesudah >= 0),
  dari_lokasi     TEXT,
  ke_lokasi       TEXT,
  keterangan      TEXT NOT NULL,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  tanggal         DATE NOT NULL,
  bukti_foto      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
  -- TIDAK ADA updated_at — immutable
);

CREATE INDEX IF NOT EXISTS idx_mb_inventaris_id ON public.mutasi_barang(inventaris_id);
CREATE INDEX IF NOT EXISTS idx_mb_jenis         ON public.mutasi_barang(jenis_mutasi);
CREATE INDEX IF NOT EXISTS idx_mb_tanggal       ON public.mutasi_barang(tanggal DESC);

-- =============================================================================
-- STEP 8: TABEL stock_opname
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.stock_opname (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventaris_id   UUID NOT NULL REFERENCES public.inventaris(id) ON DELETE RESTRICT,
  jumlah_sistem   INT NOT NULL CHECK (jumlah_sistem >= 0),
  jumlah_fisik    INT NOT NULL CHECK (jumlah_fisik >= 0),
  selisih         INT GENERATED ALWAYS AS (jumlah_fisik - jumlah_sistem) STORED,
  status          TEXT GENERATED ALWAYS AS (
                    CASE WHEN (jumlah_fisik - jumlah_sistem) = 0 THEN 'sesuai' ELSE 'tidak_sesuai' END
                  ) STORED,
  keterangan      TEXT,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  tanggal_opname  DATE NOT NULL,
  sesi_id         UUID NOT NULL DEFAULT gen_random_uuid(), -- Grouping per sesi opname
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_so_inventaris_id ON public.stock_opname(inventaris_id);
CREATE INDEX IF NOT EXISTS idx_so_tanggal       ON public.stock_opname(tanggal_opname DESC);
CREATE INDEX IF NOT EXISTS idx_so_sesi          ON public.stock_opname(sesi_id);
