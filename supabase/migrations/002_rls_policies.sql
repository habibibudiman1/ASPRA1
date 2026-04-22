-- =============================================================================
-- Migration 002: Row Level Security (RLS) Policies
-- Semua tabel menggunakan RLS untuk keamanan data
-- =============================================================================

-- =============================================================================
-- AKTIFKAN RLS PADA SEMUA TABEL
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
-- POLICIES: profiles
-- =============================================================================

-- Semua user yang sudah login bisa melihat profil sendiri
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- IT Admin bisa melihat semua profil
CREATE POLICY "profiles_select_all_admin" ON public.profiles
  FOR SELECT USING (get_user_role() = 'it_admin');

-- User hanya bisa update profil sendiri
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- IT Admin bisa update semua profil
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (get_user_role() = 'it_admin');

-- Hanya service role yang bisa insert (via trigger handle_new_user)
-- INSERT policy tidak diperlukan karena trigger berjalan sebagai SECURITY DEFINER

-- IT Admin bisa insert profil baru (untuk create user manual)
CREATE POLICY "profiles_insert_admin" ON public.profiles
  FOR INSERT WITH CHECK (get_user_role() = 'it_admin');

-- =============================================================================
-- POLICIES: categories
-- =============================================================================

-- Semua user yang sudah login bisa melihat kategori aktif
CREATE POLICY "categories_select_all" ON public.categories
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Hanya IT Admin yang bisa insert/update/delete kategori
CREATE POLICY "categories_write_admin" ON public.categories
  FOR INSERT WITH CHECK (get_user_role() = 'it_admin');

CREATE POLICY "categories_update_admin" ON public.categories
  FOR UPDATE USING (get_user_role() = 'it_admin');

CREATE POLICY "categories_delete_admin" ON public.categories
  FOR DELETE USING (get_user_role() = 'it_admin');

-- =============================================================================
-- POLICIES: sla_policies
-- =============================================================================

-- Semua user yang sudah login bisa melihat SLA policies
CREATE POLICY "sla_select_all" ON public.sla_policies
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Hanya IT Admin yang bisa update SLA policies
CREATE POLICY "sla_update_admin" ON public.sla_policies
  FOR UPDATE USING (get_user_role() = 'it_admin');

CREATE POLICY "sla_insert_admin" ON public.sla_policies
  FOR INSERT WITH CHECK (get_user_role() = 'it_admin');

-- =============================================================================
-- POLICIES: tickets
-- =============================================================================

-- Staff hanya bisa melihat tiket miliknya sendiri
CREATE POLICY "tickets_select_own_staff" ON public.tickets
  FOR SELECT USING (
    get_user_role() = 'staff' AND reporter_id = auth.uid()
  );

-- IT Admin bisa melihat semua tiket
CREATE POLICY "tickets_select_all_admin" ON public.tickets
  FOR SELECT USING (get_user_role() = 'it_admin');

-- Staff bisa membuat tiket baru (reporter_id harus = auth.uid())
CREATE POLICY "tickets_insert_staff" ON public.tickets
  FOR INSERT WITH CHECK (
    reporter_id = auth.uid()
  );

-- IT Admin bisa update tiket manapun
CREATE POLICY "tickets_update_admin" ON public.tickets
  FOR UPDATE USING (get_user_role() = 'it_admin');

-- Staff bisa update tiket miliknya (hanya untuk rating dan reopen)
CREATE POLICY "tickets_update_own_staff" ON public.tickets
  FOR UPDATE USING (
    get_user_role() = 'staff' AND reporter_id = auth.uid()
  );

-- =============================================================================
-- POLICIES: ticket_comments
-- =============================================================================

-- Staff hanya bisa melihat komentar NON-internal pada tiket miliknya
CREATE POLICY "comments_select_staff" ON public.ticket_comments
  FOR SELECT USING (
    get_user_role() = 'staff'
    AND is_internal = FALSE
    AND ticket_id IN (
      SELECT id FROM public.tickets WHERE reporter_id = auth.uid()
    )
  );

-- IT Admin bisa melihat semua komentar (termasuk internal)
CREATE POLICY "comments_select_admin" ON public.ticket_comments
  FOR SELECT USING (get_user_role() = 'it_admin');

-- Staff bisa menambah komentar pada tiket miliknya (non-internal)
CREATE POLICY "comments_insert_staff" ON public.ticket_comments
  FOR INSERT WITH CHECK (
    get_user_role() = 'staff'
    AND author_id = auth.uid()
    AND is_internal = FALSE
    AND ticket_id IN (
      SELECT id FROM public.tickets WHERE reporter_id = auth.uid()
    )
  );

-- IT Admin bisa menambah komentar (termasuk internal) ke tiket manapun
CREATE POLICY "comments_insert_admin" ON public.ticket_comments
  FOR INSERT WITH CHECK (
    get_user_role() = 'it_admin'
    AND author_id = auth.uid()
  );

-- User hanya bisa delete komentar miliknya sendiri
CREATE POLICY "comments_delete_own" ON public.ticket_comments
  FOR DELETE USING (author_id = auth.uid());

-- IT Admin bisa delete komentar manapun
CREATE POLICY "comments_delete_admin" ON public.ticket_comments
  FOR DELETE USING (get_user_role() = 'it_admin');

-- =============================================================================
-- POLICIES: ticket_attachments
-- =============================================================================

-- Staff hanya bisa melihat attachment pada tiket miliknya
CREATE POLICY "attachments_select_staff" ON public.ticket_attachments
  FOR SELECT USING (
    get_user_role() = 'staff'
    AND ticket_id IN (
      SELECT id FROM public.tickets WHERE reporter_id = auth.uid()
    )
  );

-- IT Admin bisa melihat semua attachment
CREATE POLICY "attachments_select_admin" ON public.ticket_attachments
  FOR SELECT USING (get_user_role() = 'it_admin');

-- User bisa upload attachment pada tiket yang relevan
CREATE POLICY "attachments_insert" ON public.ticket_attachments
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid()
    AND (
      get_user_role() = 'it_admin'
      OR ticket_id IN (
        SELECT id FROM public.tickets WHERE reporter_id = auth.uid()
      )
    )
  );

-- =============================================================================
-- POLICIES: ticket_activity_log
-- =============================================================================

-- Staff hanya bisa melihat activity log tiket miliknya
CREATE POLICY "activity_select_staff" ON public.ticket_activity_log
  FOR SELECT USING (
    get_user_role() = 'staff'
    AND ticket_id IN (
      SELECT id FROM public.tickets WHERE reporter_id = auth.uid()
    )
  );

-- IT Admin bisa melihat semua activity log
CREATE POLICY "activity_select_admin" ON public.ticket_activity_log
  FOR SELECT USING (get_user_role() = 'it_admin');

-- Semua user yang authenticated bisa insert activity log (dengan actor_id = auth.uid())
CREATE POLICY "activity_insert" ON public.ticket_activity_log
  FOR INSERT WITH CHECK (actor_id = auth.uid());

-- =============================================================================
-- POLICIES: notifications
-- =============================================================================

-- User hanya bisa melihat notifikasi miliknya sendiri
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

-- User hanya bisa update notifikasi miliknya (untuk mark as read)
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Server actions (service role) bisa insert notifikasi untuk siapapun
-- Policy ini mengizinkan insert jika user_id adalah user yang valid
CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- User bisa delete notifikasi miliknya
CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());
