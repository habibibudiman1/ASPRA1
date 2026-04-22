-- =============================================================================
-- Migration 003: Seed Data untuk Testing
-- 3 IT Admin, 10 Staff, 5 Kategori, 4 SLA Policies, 30 Tiket
-- CATATAN: Jalankan ini di Supabase SQL Editor setelah migration 001 dan 002
-- Password untuk semua user: Password123!
-- =============================================================================

-- =============================================================================
-- INSERT SLA POLICIES (Default)
-- =============================================================================
INSERT INTO public.sla_policies (priority, response_time_minutes, resolution_time_minutes) VALUES
  ('low',      480,  2880),  -- 8 jam respon, 48 jam resolusi
  ('medium',   240,  1440),  -- 4 jam respon, 24 jam resolusi
  ('high',     60,   480),   -- 1 jam respon, 8 jam resolusi
  ('critical', 30,   240)    -- 30 menit respon, 4 jam resolusi
ON CONFLICT (priority) DO UPDATE SET
  response_time_minutes = EXCLUDED.response_time_minutes,
  resolution_time_minutes = EXCLUDED.resolution_time_minutes;

-- =============================================================================
-- INSERT KATEGORI
-- =============================================================================
INSERT INTO public.categories (name, description, color) VALUES
  ('Hardware',        'Masalah perangkat keras: komputer, printer, monitor, dll',    '#ef4444'),
  ('Software',        'Masalah perangkat lunak: aplikasi, OS, driver, dll',          '#3b82f6'),
  ('Jaringan',        'Masalah koneksi internet, WiFi, LAN, VPN',                    '#f97316'),
  ('Email & Akun',    'Masalah email, akun, password, dan hak akses',               '#8b5cf6'),
  ('Lainnya',         'Masalah IT lainnya yang tidak termasuk kategori di atas',     '#6b7280')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- CATATAN UNTUK SEED USER:
-- Karena Supabase Auth memerlukan proses khusus untuk create user via SQL,
-- gunakan script berikut di Supabase Dashboard > Authentication > Users
-- atau gunakan Supabase Admin API.
-- 
-- Alternatif: Jalankan SQL berikut dengan service_role key di Edge Function.
-- 
-- Untuk kemudahan testing, user bisa dibuat manual di Supabase Dashboard:
-- IT Admin 1: admin1@assakinah.or.id / Password123!
-- IT Admin 2: admin2@assakinah.or.id / Password123!
-- IT Admin 3: admin3@assakinah.or.id / Password123!
-- Staff 1-10: staff1@assakinah.or.id s/d staff10@assakinah.or.id / Password123!
-- =============================================================================

-- =============================================================================
-- SEED TIKET (Akan berfungsi setelah profiles terisi via auth)
-- Script di bawah menggunakan placeholder UUID yang perlu diganti
-- dengan UUID aktual dari tabel profiles setelah user dibuat.
--
-- Uncomment dan sesuaikan UUID setelah user selesai dibuat:
-- =============================================================================

/*
-- Contoh insert tiket (sesuaikan reporter_id, assignee_id, category_id):
INSERT INTO public.tickets (
  title, description, status, priority, category_id, reporter_id, assignee_id
) VALUES
  (
    'Printer lantai 2 tidak bisa print',
    'Printer HP di lantai 2 ruang keuangan menampilkan error "offline" padahal kabel sudah terhubung. Sudah dicoba restart printer tapi masalah tetap ada.',
    'open', 'medium',
    (SELECT id FROM categories WHERE name = 'Hardware'),
    (SELECT id FROM profiles WHERE email = 'staff1@assakinah.or.id'),
    NULL
  ),
  (
    'Tidak bisa akses aplikasi SIAK',
    'Aplikasi SIAK tidak bisa dibuka sejak tadi pagi. Muncul error "Connection timeout" setiap kali login.',
    'in_progress', 'high',
    (SELECT id FROM categories WHERE name = 'Software'),
    (SELECT id FROM profiles WHERE email = 'staff2@assakinah.or.id'),
    (SELECT id FROM profiles WHERE email = 'admin1@assakinah.or.id')
  ),
  (
    'WiFi di ruang rapat tidak ada sinyal',
    'WiFi di ruang rapat lantai 3 tidak muncul di daftar jaringan. Sudah dicek dengan beberapa device hasilnya sama.',
    'resolved', 'high',
    (SELECT id FROM categories WHERE name = 'Jaringan'),
    (SELECT id FROM profiles WHERE email = 'staff3@assakinah.or.id'),
    (SELECT id FROM profiles WHERE email = 'admin2@assakinah.or.id')
  );
*/
