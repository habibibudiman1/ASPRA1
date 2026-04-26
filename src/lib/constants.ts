// =============================================================================
// lib/constants.ts
// Konstanta-konstanta yang digunakan di seluruh aplikasi
// =============================================================================

import type { TicketStatus, TicketPriority, UserRole, RuanganStatus, BookingStatus, InventarisKategori, InventarisKondisi, JenisMutasi, PeminjamanBarangStatus } from './types'

// =============================================================================
// TICKET STATUS
// =============================================================================

export const TICKET_STATUS: Record<TicketStatus, { label: string; color: string; bgColor: string; description: string }> = {
  open: {
    label: 'Open',
    color: '#4CAF50',
    bgColor: '#E8F5E9',
    description: 'Tiket baru, belum ditangani',
  },
  in_progress: {
    label: 'In Progress',
    color: '#FFC107',
    bgColor: '#FFF8E1',
    description: 'Sedang ditangani oleh IT Admin',
  },
  resolved: {
    label: 'Resolved',
    color: '#1E3A2F',
    bgColor: '#E8F5E9',
    description: 'Tiket telah diselesaikan',
  },
  closed: {
    label: 'Closed',
    color: '#9E9E9E',
    bgColor: '#F5F5F5',
    description: 'Tiket ditutup setelah konfirmasi staff',
  },
  reopened: {
    label: 'Reopened',
    color: '#F44336',
    bgColor: '#FFEBEE',
    description: 'Tiket dibuka kembali oleh staff',
  },
}

export const TICKET_STATUS_LIST: TicketStatus[] = [
  'open',
  'in_progress',
  'resolved',
  'closed',
  'reopened',
]

// =============================================================================
// TICKET PRIORITY
// =============================================================================

export const TICKET_PRIORITY: Record<TicketPriority, { label: string; color: string; bgColor: string; description: string }> = {
  low: {
    label: 'Low',
    color: '#9E9E9E',
    bgColor: '#F5F5F5',
    description: 'Prioritas rendah, tidak mendesak',
  },
  medium: {
    label: 'Medium',
    color: '#1E3A2F',
    bgColor: '#E8F5E9',
    description: 'Prioritas sedang, perlu ditangani dalam waktu normal',
  },
  high: {
    label: 'High',
    color: '#FF9800',
    bgColor: '#FFF3E0',
    description: 'Prioritas tinggi, perlu segera ditangani',
  },
  critical: {
    label: 'Critical',
    color: '#F44336',
    bgColor: '#FFEBEE',
    description: 'Prioritas kritis, harus ditangani segera',
  },
}

export const TICKET_PRIORITY_LIST: TicketPriority[] = [
  'low',
  'medium',
  'high',
  'critical',
]

// =============================================================================
// USER ROLES
// =============================================================================

export const USER_ROLES: Record<UserRole, { label: string; description: string; color: string }> = {
  staff: {
    label: 'Staff',
    description: 'Pengguna biasa yang dapat membuat tiket, booking ruangan, dan pinjam barang',
    color: '#3b82f6',
  },
  it_admin: {
    label: 'IT',
    description: 'Staff IT yang mengelola tiket, kategori, SLA, dan laporan IT',
    color: '#8b5cf6',
  },
  admin: {
    label: 'Admin',
    description: 'Administrator sistem yang dapat mengakses semua fitur kecuali approval peminjaman',
    color: '#ef4444',
  },
  sarana: {
    label: 'Sarana',
    description: 'Pengelola sarana dan inventaris, bisa approve booking ruangan dan peminjaman barang',
    color: '#f97316',
  },
}

// =============================================================================
// RUANGAN STATUS
// =============================================================================

export const RUANGAN_STATUS: Record<RuanganStatus, { label: string; color: string; bgColor: string }> = {
  tersedia: {
    label: 'Tersedia',
    color: '#16a34a',
    bgColor: '#dcfce7',
  },
  maintenance: {
    label: 'Maintenance',
    color: '#92400e',
    bgColor: '#fef3c7',
  },
  tidak_aktif: {
    label: 'Tidak Aktif',
    color: '#6b7280',
    bgColor: '#f3f4f6',
  },
}

// =============================================================================
// BOOKING STATUS
// =============================================================================

export const BOOKING_STATUS: Record<BookingStatus, { label: string; color: string; bgColor: string }> = {
  menunggu: {
    label: 'Menunggu',
    color: '#d97706',
    bgColor: '#fef3c7',
  },
  disetujui: {
    label: 'Disetujui',
    color: '#16a34a',
    bgColor: '#dcfce7',
  },
  ditolak: {
    label: 'Ditolak',
    color: '#dc2626',
    bgColor: '#fee2e2',
  },
  selesai: {
    label: 'Selesai',
    color: '#6b7280',
    bgColor: '#f3f4f6',
  },
  dibatalkan: {
    label: 'Dibatalkan',
    color: '#9ca3af',
    bgColor: '#f9fafb',
  },
}

// Warna kalender per status booking
export const BOOKING_CALENDAR_COLOR: Record<BookingStatus, string> = {
  menunggu:   '#f59e0b',  // kuning
  disetujui:  '#ef4444',  // merah (sedang terpakai)
  ditolak:    '#9ca3af',  // abu-abu
  selesai:    '#6b7280',  // abu-abu gelap
  dibatalkan: '#d1d5db',  // abu-abu muda
}

// =============================================================================
// INVENTARIS KATEGORI
// =============================================================================

export const INVENTARIS_KATEGORI: Record<InventarisKategori, { label: string; prefix: string; color: string }> = {
  elektronik:    { label: 'Elektronik',     prefix: 'ELK', color: '#3b82f6' },
  furniture:     { label: 'Furniture',      prefix: 'FRN', color: '#8b5cf6' },
  atk:           { label: 'ATK',            prefix: 'ATK', color: '#06b6d4' },
  kendaraan:     { label: 'Kendaraan',      prefix: 'KDR', color: '#f97316' },
  alat_olahraga: { label: 'Alat Olahraga', prefix: 'OLR', color: '#22c55e' },
  alat_lab:      { label: 'Alat Lab',       prefix: 'LAB', color: '#ec4899' },
  lainnya:       { label: 'Lainnya',        prefix: 'LNY', color: '#6b7280' },
}

// =============================================================================
// INVENTARIS KONDISI
// =============================================================================

export const INVENTARIS_KONDISI: Record<InventarisKondisi, { label: string; color: string; bgColor: string }> = {
  baik: {
    label: 'Baik',
    color: '#16a34a',
    bgColor: '#dcfce7',
  },
  rusak_ringan: {
    label: 'Rusak Ringan',
    color: '#d97706',
    bgColor: '#fef3c7',
  },
  rusak_berat: {
    label: 'Rusak Berat',
    color: '#dc2626',
    bgColor: '#fee2e2',
  },
}

// =============================================================================
// PEMINJAMAN BARANG STATUS
// =============================================================================

export const PEMINJAMAN_BARANG_STATUS: Record<PeminjamanBarangStatus, { label: string; color: string; bgColor: string }> = {
  menunggu: {
    label: 'Menunggu',
    color: '#d97706',
    bgColor: '#fef3c7',
  },
  dipinjam: {
    label: 'Dipinjam',
    color: '#2563eb',
    bgColor: '#dbeafe',
  },
  dikembalikan: {
    label: 'Dikembalikan',
    color: '#16a34a',
    bgColor: '#dcfce7',
  },
  terlambat: {
    label: 'Terlambat',
    color: '#dc2626',
    bgColor: '#fee2e2',
  },
  hilang: {
    label: 'Hilang',
    color: '#7c3aed',
    bgColor: '#ede9fe',
  },
}

// =============================================================================
// JENIS MUTASI
// =============================================================================

export const JENIS_MUTASI: Record<JenisMutasi, { label: string; color: string; icon: string }> = {
  masuk:          { label: 'Barang Masuk',     color: '#16a34a', icon: 'ArrowDownCircle' },
  keluar:         { label: 'Barang Keluar',    color: '#dc2626', icon: 'ArrowUpCircle' },
  pindah_lokasi:  { label: 'Pindah Lokasi',   color: '#2563eb', icon: 'ArrowLeftRight' },
  rusak:          { label: 'Rusak',            color: '#d97706', icon: 'AlertTriangle' },
  hilang:         { label: 'Hilang',           color: '#7c3aed', icon: 'PackageX' },
  disposal:       { label: 'Disposal',         color: '#6b7280', icon: 'Trash2' },
  perbaikan:      { label: 'Perbaikan',        color: '#0891b2', icon: 'Wrench' },
}

// =============================================================================
// FASILITAS RUANGAN
// =============================================================================

export const FASILITAS_OPTIONS = [
  { value: 'proyektor',    label: 'Proyektor' },
  { value: 'AC',           label: 'AC' },
  { value: 'whiteboard',   label: 'Whiteboard' },
  { value: 'sound_system', label: 'Sound System' },
  { value: 'wifi',         label: 'WiFi' },
  { value: 'komputer',     label: 'Komputer' },
  { value: 'panggung',     label: 'Panggung' },
  { value: 'tv',           label: 'TV / Monitor' },
  { value: 'printer',      label: 'Printer' },
]

// =============================================================================
// SATUAN BARANG
// =============================================================================

export const SATUAN_OPTIONS = [
  'unit', 'buah', 'set', 'lembar', 'rim', 'pack', 'lusin',
  'box', 'roll', 'meter', 'liter', 'kg', 'pasang',
]

// =============================================================================
// NAVIGASI SIDEBAR — Per Role
// =============================================================================

export const STAFF_NAV_ITEMS = [
  {
    group: 'Tiket IT',
    items: [
      { href: '/tickets',     label: 'Tiket Saya',   icon: 'Ticket' },
      { href: '/tickets/new', label: 'Buat Tiket',   icon: 'Plus' },
    ],
  },
  {
    group: 'Ruangan',
    items: [
      { href: '/ruangan',         label: 'Dashboard Ruangan', icon: 'Building2' },
      { href: '/ruangan/jadwal',  label: 'Jadwal Ruangan',    icon: 'CalendarDays' },
      { href: '/ruangan/booking', label: 'Booking Ruangan',   icon: 'CalendarPlus' },
      { href: '/ruangan/riwayat', label: 'Riwayat Booking',   icon: 'ClipboardList' },
    ],
  },
  {
    group: 'Barang',
    items: [
      { href: '/inventaris/barang',       label: 'Daftar Barang',   icon: 'Package' },
      { href: '/inventaris/peminjaman/baru', label: 'Pinjam Barang', icon: 'ShoppingCart' },
      { href: '/inventaris/peminjaman',   label: 'Pinjaman Saya',   icon: 'PackageCheck' },
    ],
  },
  {
    group: 'Akun',
    items: [
      { href: '/settings', label: 'Profil', icon: 'User' },
    ],
  },
]

// Nav untuk role IT (it_admin) — tiket saja
export const IT_NAV_ITEMS = [
  {
    group: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard IT', icon: 'LayoutDashboard' },
    ],
  },
  {
    group: 'Tiket IT',
    items: [
      { href: '/tickets',    label: 'Semua Tiket', icon: 'Ticket' },
      { href: '/categories', label: 'Kategori',    icon: 'Tag' },
      { href: '/sla',        label: 'SLA',         icon: 'Timer' },
      { href: '/reports',    label: 'Laporan IT',  icon: 'BarChart3' },
    ],
  },
  {
    group: 'Inventaris',
    items: [
      { href: '/inventaris/barang',       label: 'Semua Barang', icon: 'Package' },
      { href: '/inventaris/stock-opname', label: 'Opname',       icon: 'ClipboardList' },
    ],
  },
  {
    group: 'Ruangan',
    items: [
      { href: '/ruangan',         label: 'Daftar Ruangan',  icon: 'Building2' },
      { href: '/ruangan/booking', label: 'Booking Ruangan', icon: 'CalendarDays' },
    ],
  },
  {
    group: 'Akun',
    items: [
      { href: '/settings', label: 'Profil', icon: 'User' },
    ],
  },
]

// Nav untuk role Admin (admin) — semua kecuali approval
export const ADMIN_NAV_ITEMS = [
  {
    group: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard IT', icon: 'LayoutDashboard' },
    ],
  },
  {
    group: 'Tiket IT',
    items: [
      { href: '/tickets',    label: 'Semua Tiket', icon: 'Ticket' },
      { href: '/categories', label: 'Kategori',    icon: 'Tag' },
      { href: '/users',      label: 'Pengguna',    icon: 'Users' },
      { href: '/sla',        label: 'SLA',         icon: 'Timer' },
      { href: '/reports',    label: 'Laporan IT',  icon: 'BarChart3' },
    ],
  },
  {
    group: 'Ruangan',
    items: [
      { href: '/ruangan',         label: 'Dashboard Ruangan', icon: 'Building2' },
      { href: '/ruangan/jadwal',  label: 'Jadwal Ruangan',    icon: 'CalendarDays' },
      { href: '/ruangan/riwayat', label: 'Riwayat Booking',   icon: 'ClipboardList' },
      { href: '/ruangan/kelola',  label: 'Kelola Ruangan',    icon: 'Settings' },
    ],
  },
  {
    group: 'Inventaris',
    items: [
      { href: '/inventaris',            label: 'Dashboard Inventaris', icon: 'LayoutGrid' },
      { href: '/inventaris/barang',     label: 'Data Barang',          icon: 'Package' },
      { href: '/inventaris/peminjaman', label: 'Peminjaman Barang',    icon: 'PackageCheck' },
      { href: '/inventaris/laporan',    label: 'Laporan Inventaris',   icon: 'FileBarChart' },
    ],
  },
  {
    group: 'Akun',
    items: [
      { href: '/settings', label: 'Profil', icon: 'User' },
    ],
  },
]

export const SARANA_NAV_ITEMS = [
  {
    group: 'Approval',
    items: [
      { href: '/ruangan/approval',      label: 'Approval Ruangan',    icon: 'CheckSquare' },
      { href: '/inventaris/peminjaman', label: 'Approval Peminjaman', icon: 'PackageCheck' },
    ],
  },
  {
    group: 'Ruangan',
    items: [
      { href: '/ruangan',         label: 'Dashboard Ruangan', icon: 'Building2' },
      { href: '/ruangan/jadwal',  label: 'Jadwal Ruangan',    icon: 'CalendarDays' },
      { href: '/ruangan/booking', label: 'Booking Ruangan',   icon: 'CalendarPlus' },
      { href: '/ruangan/riwayat', label: 'Riwayat Booking',   icon: 'ClipboardList' },
    ],
  },
  {
    group: 'Inventaris',
    items: [
      { href: '/inventaris',              label: 'Dashboard Inventaris', icon: 'LayoutGrid' },
      { href: '/inventaris/barang',       label: 'Data Barang',          icon: 'Package' },
      { href: '/inventaris/mutasi',       label: 'Mutasi Barang',        icon: 'ArrowLeftRight' },
      { href: '/inventaris/stock-opname', label: 'Stock Opname',         icon: 'ClipboardCheck' },
      { href: '/inventaris/laporan',      label: 'Laporan',              icon: 'FileBarChart' },
    ],
  },
  {
    group: 'Akun',
    items: [
      { href: '/settings', label: 'Profil', icon: 'User' },
    ],
  },
]

// =============================================================================
// PAGINATION
// =============================================================================

export const DEFAULT_PAGE_SIZE = 20
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// =============================================================================
// FILE UPLOAD
// =============================================================================

export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]

export const ALLOWED_FILE_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt',
]

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
export const MAX_FILES_PER_TICKET = 5

// =============================================================================
// DATE PERIOD OPTIONS
// =============================================================================

export const DATE_PERIOD_OPTIONS = [
  { value: '7d',     label: '7 Hari Terakhir' },
  { value: '30d',    label: '30 Hari Terakhir' },
  { value: '90d',    label: '90 Hari Terakhir' },
  { value: 'custom', label: 'Periode Custom' },
] as const

// =============================================================================
// SLA DEFAULT
// =============================================================================

export const SLA_DEFAULTS = {
  low:      { response: 480,  resolution: 2880 },
  medium:   { response: 240,  resolution: 1440 },
  high:     { response: 60,   resolution: 480  },
  critical: { response: 30,   resolution: 240  },
}

// =============================================================================
// BUSINESS RULES
// =============================================================================

export const BOOKING_RULES = {
  MAX_DAYS_AHEAD: 14,           // Staff bisa booking maks 14 hari ke depan
  MIN_DURATION_MINUTES: 30,     // Durasi minimal 30 menit
  MAX_DURATION_HOURS: 8,        // Durasi maksimal 8 jam
  MAX_ACTIVE_BOOKINGS: 3,       // Maks 3 booking aktif bersamaan
} as const

export const PEMINJAMAN_BARANG_RULES = {
  MAX_ACTIVE_ITEMS: 5,          // Maks 5 item aktif bersamaan per staff
  MAX_DURATION_DAYS: 30,        // Maks 30 hari peminjaman
  LATE_WARNING_DAYS: 7,         // > 7 hari terlambat → status terlambat
  REMINDER_DAYS_BEFORE: 3,      // Notifikasi H-3 sebelum deadline
} as const

export const STOK_RENDAH_THRESHOLD = 5  // Alert stok rendah < 5 unit

// =============================================================================
// SUPABASE REALTIME CHANNELS
// =============================================================================

export const REALTIME_CHANNELS = {
  TICKETS:            'tickets-channel',
  NOTIFICATIONS:      'notifications-channel',
  COMMENTS:           'comments-channel',
  BOOKING_RUANGAN:    'booking-ruangan-channel',
  PEMINJAMAN_BARANG:  'peminjaman-barang-channel',
  INVENTARIS:         'inventaris-channel',
}

// =============================================================================
// SUPABASE STORAGE BUCKETS
// =============================================================================

export const STORAGE_BUCKETS = {
  ATTACHMENTS:        'attachments',
  AVATARS:            'avatars',
  ROOM_PHOTOS:        'room-photos',
  INVENTORY_PHOTOS:   'inventory-photos',
  MUTATION_PROOFS:    'mutation-proofs',
}

// =============================================================================
// APP METADATA
// =============================================================================

export const APP_NAME = 'ASPRA'
export const APP_DESCRIPTION = 'Sistem Terpadu IT & Sarana Yayasan Assakinah Sejahtera'
export const APP_ORG = 'Yayasan Assakinah Sejahtera'
