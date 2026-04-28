-- Add keterangan and harga_penyusutan columns to inventaris
ALTER TABLE public.inventaris
  ADD COLUMN IF NOT EXISTS keterangan        TEXT,
  ADD COLUMN IF NOT EXISTS harga_penyusutan  NUMERIC(15, 2);
