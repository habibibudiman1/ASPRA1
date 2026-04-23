-- =============================================================================
-- Migration 005: RLS Policies untuk Fitur Baru
-- Peminjaman Ruangan + Manajemen Inventaris
-- =============================================================================

-- =============================================================================
-- AKTIFKAN RLS
-- =============================================================================
ALTER TABLE public.ruangan               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peminjaman_ruangan    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventaris            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peminjaman_barang     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mutasi_barang         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_opname          ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- POLICIES: ruangan
-- =============================================================================

-- Semua user login bisa melihat ruangan yang tidak di-soft-delete
CREATE POLICY "ruangan_select_all" ON public.ruangan
  FOR SELECT USING (auth.uid() IS NOT NULL AND NOT is_deleted);

-- Hanya IT Admin yang bisa insert/update/delete ruangan
CREATE POLICY "ruangan_insert_admin" ON public.ruangan
  FOR INSERT WITH CHECK (get_user_role() = 'it_admin');

CREATE POLICY "ruangan_update_admin" ON public.ruangan
  FOR UPDATE USING (get_user_role() = 'it_admin');

CREATE POLICY "ruangan_delete_admin" ON public.ruangan
  FOR DELETE USING (get_user_role() = 'it_admin');

-- =============================================================================
-- POLICIES: peminjaman_ruangan
-- =============================================================================

-- Staff & Sarana hanya bisa melihat booking miliknya
CREATE POLICY "pr_select_own" ON public.peminjaman_ruangan
  FOR SELECT USING (
    get_user_role() IN ('staff', 'sarana') AND user_id = auth.uid()
  );

-- IT Admin bisa melihat semua booking
CREATE POLICY "pr_select_all_admin" ON public.peminjaman_ruangan
  FOR SELECT USING (get_user_role() = 'it_admin');

-- Semua user login bisa membuat booking (validasi business rules di aplikasi)
CREATE POLICY "pr_insert_authenticated" ON public.peminjaman_ruangan
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  );

-- User bisa update booking miliknya (untuk cancel)
CREATE POLICY "pr_update_own" ON public.peminjaman_ruangan
  FOR UPDATE USING (
    get_user_role() IN ('staff', 'sarana') AND user_id = auth.uid()
  );

-- IT Admin bisa update semua booking (untuk approve/reject)
CREATE POLICY "pr_update_admin" ON public.peminjaman_ruangan
  FOR UPDATE USING (get_user_role() = 'it_admin');

-- =============================================================================
-- POLICIES: inventaris
-- =============================================================================

-- Semua user login bisa melihat inventaris (non-deleted)
CREATE POLICY "inv_select_all" ON public.inventaris
  FOR SELECT USING (auth.uid() IS NOT NULL AND NOT is_deleted);

-- Admin juga bisa melihat yang deleted (untuk audit)
CREATE POLICY "inv_select_deleted_admin" ON public.inventaris
  FOR SELECT USING (get_user_role() = 'it_admin');

-- Hanya Sarana yang bisa insert/update
CREATE POLICY "inv_insert_sarana" ON public.inventaris
  FOR INSERT WITH CHECK (get_user_role() = 'sarana');

CREATE POLICY "inv_update_sarana" ON public.inventaris
  FOR UPDATE USING (get_user_role() = 'sarana');

-- Sarana bisa "delete" (soft delete via update is_deleted)
-- Hard delete tidak diizinkan via RLS — gunakan soft delete
CREATE POLICY "inv_delete_sarana" ON public.inventaris
  FOR DELETE USING (FALSE); -- Tidak pernah hard delete

-- =============================================================================
-- POLICIES: peminjaman_barang
-- =============================================================================

-- Staff & Sarana lihat miliknya
CREATE POLICY "pb_select_own" ON public.peminjaman_barang
  FOR SELECT USING (
    get_user_role() IN ('staff', 'sarana') AND user_id = auth.uid()
  );

-- Sarana lihat semua (untuk approval)
CREATE POLICY "pb_select_sarana_all" ON public.peminjaman_barang
  FOR SELECT USING (get_user_role() = 'sarana');

-- IT Admin lihat semua
CREATE POLICY "pb_select_admin" ON public.peminjaman_barang
  FOR SELECT USING (get_user_role() = 'it_admin');

-- Semua user login bisa ajukan peminjaman
CREATE POLICY "pb_insert_authenticated" ON public.peminjaman_barang
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

-- User bisa update miliknya (untuk cancel)
CREATE POLICY "pb_update_own" ON public.peminjaman_barang
  FOR UPDATE USING (
    get_user_role() IN ('staff', 'sarana') AND user_id = auth.uid()
  );

-- Sarana bisa update semua (untuk approve/reject/konfirmasi kembali)
CREATE POLICY "pb_update_sarana" ON public.peminjaman_barang
  FOR UPDATE USING (get_user_role() = 'sarana');

-- =============================================================================
-- POLICIES: mutasi_barang (immutable — hanya insert & select)
-- =============================================================================

-- Semua user login bisa melihat mutasi
CREATE POLICY "mb_select_all" ON public.mutasi_barang
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Sarana bisa insert mutasi
CREATE POLICY "mb_insert_sarana" ON public.mutasi_barang
  FOR INSERT WITH CHECK (
    get_user_role() IN ('sarana', 'it_admin')
    AND user_id = auth.uid()
  );

-- UPDATE & DELETE dilarang total (immutable audit trail)

-- =============================================================================
-- POLICIES: stock_opname
-- =============================================================================

-- Sarana & Admin bisa melihat semua stock opname
CREATE POLICY "so_select_sarana_admin" ON public.stock_opname
  FOR SELECT USING (get_user_role() IN ('sarana', 'it_admin'));

-- Sarana bisa insert stock opname
CREATE POLICY "so_insert_sarana" ON public.stock_opname
  FOR INSERT WITH CHECK (
    get_user_role() = 'sarana' AND user_id = auth.uid()
  );

-- Sarana bisa update keterangan (jika tidak sesuai)
CREATE POLICY "so_update_sarana" ON public.stock_opname
  FOR UPDATE USING (get_user_role() = 'sarana');

-- =============================================================================
-- UPDATE POLICY: profiles — tambah sarana bisa SELECT semua (untuk form autocomplete)
-- =============================================================================

-- Sarana bisa lihat semua profil (untuk keperluan form & notifikasi)
CREATE POLICY "profiles_select_all_sarana" ON public.profiles
  FOR SELECT USING (get_user_role() = 'sarana');

-- =============================================================================
-- UPDATE POLICY: notifications — sarana bisa lihat notifikasi tipe inventaris ke semua
-- (insert by server via service role — policy existing sudah cukup)
-- =============================================================================
