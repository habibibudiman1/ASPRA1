-- =============================================================================
-- Migration 009: Tambah status 'ditolak' untuk peminjaman_barang
-- Status ini digunakan ketika Sarana menolak pengajuan peminjaman.
-- Sebelumnya salah menggunakan 'dikembalikan' yang bermakna barang sudah kembali.
-- =============================================================================

ALTER TABLE public.peminjaman_barang
  DROP CONSTRAINT IF EXISTS peminjaman_barang_status_check;

ALTER TABLE public.peminjaman_barang
  ADD CONSTRAINT peminjaman_barang_status_check
  CHECK (status IN ('menunggu', 'dipinjam', 'dikembalikan', 'terlambat', 'hilang', 'ditolak'));
