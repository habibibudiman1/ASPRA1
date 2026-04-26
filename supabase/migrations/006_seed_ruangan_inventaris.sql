-- =============================================================================
-- Migration 006: Seed Data — Ruangan & Inventaris
-- Data contoh untuk testing
-- =============================================================================

-- =============================================================================
-- SEED RUANGAN (5 ruangan contoh)
-- =============================================================================
INSERT INTO public.ruangan (nama_ruangan, lokasi_gedung, lantai, kapasitas, fasilitas, status, keterangan) VALUES
  (
    'Ruang Rapat Utama',
    'Gedung A',
    2,
    30,
    '["proyektor", "AC", "whiteboard", "sound_system", "wifi"]',
    'tersedia',
    'Ruang rapat besar untuk pertemuan seluruh divisi'
  ),
  (
    'Ruang Kelas 1A',
    'Gedung B',
    1,
    40,
    '["proyektor", "AC", "whiteboard", "wifi"]',
    'tersedia',
    'Ruang kelas utama lantai 1'
  ),
  (
    'Ruang Kelas 2B',
    'Gedung B',
    2,
    40,
    '["proyektor", "AC", "whiteboard"]',
    'tersedia',
    NULL
  ),
  (
    'Aula Serbaguna',
    'Gedung C',
    1,
    200,
    '["proyektor", "AC", "sound_system", "wifi", "panggung"]',
    'tersedia',
    'Aula besar untuk acara yayasan'
  ),
  (
    'Ruang Lab Komputer',
    'Gedung A',
    3,
    25,
    '["AC", "wifi", "komputer", "proyektor"]',
    'maintenance',
    'Sedang dalam maintenance perangkat komputer'
  )
ON CONFLICT (nama_ruangan) DO NOTHING;

-- =============================================================================
-- SEED INVENTARIS (10 item contoh)
-- =============================================================================
INSERT INTO public.inventaris (kode_barang, nama_barang, kategori, merk, tipe_model, jumlah_stok, satuan, kondisi, lokasi_penempatan, tanggal_perolehan, sumber_dana, nilai_perolehan) VALUES
  ('INV-ELK-0001', 'Laptop',               'elektronik',    'Lenovo',    'IdeaPad 3',      10, 'unit',  'baik',        'Ruang Guru Lt.2',  '2023-01-15', 'Dana BOS',   8500000.00),
  ('INV-ELK-0002', 'Proyektor',             'elektronik',    'Epson',     'EB-S41',          5, 'unit',  'baik',        'Gudang A',         '2022-08-20', 'APBD',       4500000.00),
  ('INV-ELK-0003', 'Printer Laser',         'elektronik',    'HP',        'LaserJet P1102',  3, 'unit',  'baik',        'Ruang TU',         '2021-03-10', 'Dana BOS',   2200000.00),
  ('INV-FRN-0001', 'Meja Kerja',            'furniture',     NULL,        NULL,             20, 'unit',  'baik',        'Gudang B',         '2020-06-01', 'APBD',        750000.00),
  ('INV-FRN-0002', 'Kursi Lipat',           'furniture',     NULL,        NULL,            100, 'unit',  'baik',        'Gudang A',         '2022-02-14', 'Sumbangan',   125000.00),
  ('INV-FRN-0003', 'Lemari Arsip',          'furniture',     'Olympic',   NULL,              8, 'unit',  'baik',        'Ruang TU',         '2021-09-30', 'APBD',        850000.00),
  ('INV-ATK-0001', 'Kertas A4 80gsm',       'atk',           'Sinar Dunia', NULL,           50, 'rim',   'baik',        'Gudang ATK',       '2024-01-05', 'Dana BOS',     45000.00),
  ('INV-ATK-0002', 'Spidol Whiteboard',     'atk',           'Snowman',   NULL,             30, 'pack',  'baik',        'Gudang ATK',       '2024-02-10', 'Dana BOS',     35000.00),
  ('INV-OLR-0001', 'Bola Sepak',            'alat_olahraga', 'Adidas',    'Tango',           5, 'buah',  'baik',        'Gudang Olahraga',  '2023-07-17', 'Sumbangan',   350000.00),
  ('INV-LAB-0001', 'Mikroskop',             'alat_lab',      'Olympus',   'CX23',            4, 'unit',  'rusak_ringan','Lab IPA',          '2019-11-20', 'APBD',       3500000.00)
ON CONFLICT (kode_barang) DO NOTHING;
