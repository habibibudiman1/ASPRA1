-- =============================================================================
-- Migration 008: RLS Policies INSERT/UPDATE/DELETE untuk Role 'admin' di Inventaris
-- Migration 007 hanya memberikan SELECT — admin juga perlu bisa mengelola barang.
-- DROP IF EXISTS: aman dijalankan ulang jika policy sudah pernah dibuat.
-- =============================================================================

-- Admin bisa menambah barang inventaris
DROP POLICY IF EXISTS "inv_insert_admin_role" ON public.inventaris;
CREATE POLICY "inv_insert_admin_role" ON public.inventaris
  FOR INSERT WITH CHECK (get_user_role() = 'admin');

-- Admin bisa mengupdate data barang inventaris
DROP POLICY IF EXISTS "inv_update_admin_role" ON public.inventaris;
CREATE POLICY "inv_update_admin_role" ON public.inventaris
  FOR UPDATE USING (get_user_role() = 'admin');

-- Admin bisa soft-delete barang inventaris
DROP POLICY IF EXISTS "inv_delete_admin_role" ON public.inventaris;
CREATE POLICY "inv_delete_admin_role" ON public.inventaris
  FOR DELETE USING (get_user_role() = 'admin');

-- Admin bisa update mutasi barang
DROP POLICY IF EXISTS "mb_update_admin_role" ON public.mutasi_barang;
CREATE POLICY "mb_update_admin_role" ON public.mutasi_barang
  FOR UPDATE USING (get_user_role() = 'admin');
