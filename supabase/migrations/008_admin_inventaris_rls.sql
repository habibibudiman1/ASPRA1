-- =============================================================================
-- Migration 008: RLS Policies INSERT/UPDATE/DELETE untuk Role 'admin' di Inventaris
-- Migration 007 hanya memberikan SELECT — admin juga perlu bisa mengelola barang.
-- =============================================================================

-- Admin bisa menambah barang inventaris
CREATE POLICY "inv_insert_admin_role" ON public.inventaris
  FOR INSERT WITH CHECK (get_user_role() = 'admin');

-- Admin bisa mengupdate data barang inventaris
CREATE POLICY "inv_update_admin_role" ON public.inventaris
  FOR UPDATE USING (get_user_role() = 'admin');

-- Admin bisa soft-delete barang inventaris
CREATE POLICY "inv_delete_admin_role" ON public.inventaris
  FOR DELETE USING (get_user_role() = 'admin');

-- Admin bisa insert mutasi barang (diperlukan saat update stok / pindah lokasi)
-- (sudah ada di migration 007, tapi pastikan UPDATE juga ada)
CREATE POLICY "mb_update_admin_role" ON public.mutasi_barang
  FOR UPDATE USING (get_user_role() = 'admin');
