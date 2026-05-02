-- =============================================================================
-- Migration 007: RLS Policies untuk Role 'admin' Baru
-- Role 'admin' mendapat akses yang sama dengan 'it_admin' di sebagian besar tabel,
-- KECUALI approval peminjaman ruangan (itu hak Sarana).
-- =============================================================================

-- =============================================================================
-- PROFILES
-- =============================================================================

-- Admin bisa melihat semua profil
CREATE POLICY "profiles_select_all_admin_role" ON public.profiles
  FOR SELECT USING (get_user_role() = 'admin');

-- Admin bisa update semua profil (untuk manajemen user)
CREATE POLICY "profiles_update_admin_role" ON public.profiles
  FOR UPDATE USING (get_user_role() = 'admin');

-- Admin bisa insert profil baru (untuk create user)
CREATE POLICY "profiles_insert_admin_role" ON public.profiles
  FOR INSERT WITH CHECK (get_user_role() = 'admin');

-- =============================================================================
-- CATEGORIES
-- =============================================================================

CREATE POLICY "categories_write_admin_role" ON public.categories
  FOR INSERT WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "categories_update_admin_role" ON public.categories
  FOR UPDATE USING (get_user_role() = 'admin');

CREATE POLICY "categories_delete_admin_role" ON public.categories
  FOR DELETE USING (get_user_role() = 'admin');

-- =============================================================================
-- SLA POLICIES
-- =============================================================================

CREATE POLICY "sla_update_admin_role" ON public.sla_policies
  FOR UPDATE USING (get_user_role() = 'admin');

CREATE POLICY "sla_insert_admin_role" ON public.sla_policies
  FOR INSERT WITH CHECK (get_user_role() = 'admin');

-- =============================================================================
-- TICKETS
-- =============================================================================

-- Admin bisa melihat semua tiket
CREATE POLICY "tickets_select_all_admin_role" ON public.tickets
  FOR SELECT USING (get_user_role() = 'admin');

-- Admin bisa update tiket manapun
CREATE POLICY "tickets_update_admin_role" ON public.tickets
  FOR UPDATE USING (get_user_role() = 'admin');

-- =============================================================================
-- TICKET COMMENTS
-- =============================================================================

-- Admin bisa melihat semua komentar (termasuk internal)
CREATE POLICY "comments_select_admin_role" ON public.ticket_comments
  FOR SELECT USING (get_user_role() = 'admin');

-- Admin bisa insert komentar (termasuk internal)
CREATE POLICY "comments_insert_admin_role" ON public.ticket_comments
  FOR INSERT WITH CHECK (
    get_user_role() = 'admin'
    AND author_id = auth.uid()
  );

-- Admin bisa delete komentar manapun
CREATE POLICY "comments_delete_admin_role" ON public.ticket_comments
  FOR DELETE USING (get_user_role() = 'admin');

-- =============================================================================
-- TICKET ATTACHMENTS
-- =============================================================================

-- Admin bisa melihat semua attachment
CREATE POLICY "attachments_select_admin_role" ON public.ticket_attachments
  FOR SELECT USING (get_user_role() = 'admin');

-- Admin bisa upload attachment
CREATE POLICY "attachments_insert_admin_role" ON public.ticket_attachments
  FOR INSERT WITH CHECK (
    get_user_role() = 'admin'
    AND uploaded_by = auth.uid()
  );

-- =============================================================================
-- TICKET ACTIVITY LOG
-- =============================================================================

-- Admin bisa melihat semua activity log
CREATE POLICY "activity_select_admin_role" ON public.ticket_activity_log
  FOR SELECT USING (get_user_role() = 'admin');

-- =============================================================================
-- RUANGAN
-- =============================================================================

-- Admin bisa insert/update/delete ruangan (kelola ruangan)
CREATE POLICY "ruangan_insert_admin_role" ON public.ruangan
  FOR INSERT WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "ruangan_update_admin_role" ON public.ruangan
  FOR UPDATE USING (get_user_role() = 'admin');

CREATE POLICY "ruangan_delete_admin_role" ON public.ruangan
  FOR DELETE USING (get_user_role() = 'admin');

-- =============================================================================
-- PEMINJAMAN RUANGAN
-- =============================================================================

-- Admin bisa melihat semua booking
CREATE POLICY "pr_select_all_admin_role" ON public.peminjaman_ruangan
  FOR SELECT USING (get_user_role() = 'admin');

-- Admin bisa cancel/update booking manapun (tapi TIDAK approve — itu Sarana)
CREATE POLICY "pr_update_admin_role" ON public.peminjaman_ruangan
  FOR UPDATE USING (get_user_role() = 'admin');

-- =============================================================================
-- INVENTARIS
-- =============================================================================

-- Admin bisa melihat semua inventaris (termasuk yang deleted, untuk audit)
CREATE POLICY "inv_select_deleted_admin_role" ON public.inventaris
  FOR SELECT USING (get_user_role() = 'admin');

-- =============================================================================
-- PEMINJAMAN BARANG
-- =============================================================================

-- Admin bisa melihat semua peminjaman barang
CREATE POLICY "pb_select_admin_role" ON public.peminjaman_barang
  FOR SELECT USING (get_user_role() = 'admin');

-- =============================================================================
-- MUTASI BARANG
-- =============================================================================

-- Admin bisa insert mutasi barang
CREATE POLICY "mb_insert_admin_role" ON public.mutasi_barang
  FOR INSERT WITH CHECK (
    get_user_role() = 'admin'
    AND user_id = auth.uid()
  );

-- =============================================================================
-- STOCK OPNAME
-- =============================================================================

-- Admin bisa melihat stock opname
CREATE POLICY "so_select_admin_role" ON public.stock_opname
  FOR SELECT USING (get_user_role() = 'admin');
