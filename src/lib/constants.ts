// =============================================================================
// lib/constants.ts
// Konstanta-konstanta yang digunakan di seluruh aplikasi
// =============================================================================

import type { TicketStatus, TicketPriority, UserRole } from './types'

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

export const USER_ROLES: Record<UserRole, { label: string; description: string }> = {
  staff: {
    label: 'Staff',
    description: 'Pengguna biasa yang dapat membuat dan memantau tiket miliknya',
  },
  it_admin: {
    label: 'IT Admin',
    description: 'Administrator IT yang dapat mengelola semua tiket dan konfigurasi sistem',
  },
}

// =============================================================================
// NAVIGASI SIDEBAR
// =============================================================================

export const STAFF_NAV_ITEMS = [
  { href: '/tickets', label: 'Tiket Saya', icon: 'Ticket' },
  { href: '/tickets/new', label: 'Buat Tiket', icon: 'Plus' },
  { href: '/settings', label: 'Profil', icon: 'User' },
]

export const ADMIN_NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/tickets', label: 'Semua Tiket', icon: 'Ticket' },
  { href: '/categories', label: 'Kategori', icon: 'Tag' },
  { href: '/users', label: 'Pengguna', icon: 'Users' },
  { href: '/sla', label: 'SLA', icon: 'Timer' },
  { href: '/reports', label: 'Laporan', icon: 'BarChart3' },
  { href: '/settings', label: 'Profil', icon: 'User' },
]

// =============================================================================
// PAGINATION
// =============================================================================

export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

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
// DATE PERIOD OPTIONS (untuk filter dashboard)
// =============================================================================

export const DATE_PERIOD_OPTIONS = [
  { value: '7d', label: '7 Hari Terakhir' },
  { value: '30d', label: '30 Hari Terakhir' },
  { value: '90d', label: '90 Hari Terakhir' },
  { value: 'custom', label: 'Periode Custom' },
] as const

// =============================================================================
// SLA DEFAULT (fallback jika belum ada di database)
// =============================================================================

export const SLA_DEFAULTS = {
  low:      { response: 480,  resolution: 2880 },
  medium:   { response: 240,  resolution: 1440 },
  high:     { response: 60,   resolution: 480  },
  critical: { response: 30,   resolution: 240  },
}

// =============================================================================
// SUPABASE REALTIME CHANNELS
// =============================================================================

export const REALTIME_CHANNELS = {
  TICKETS: 'tickets-channel',
  NOTIFICATIONS: 'notifications-channel',
  COMMENTS: 'comments-channel',
}

// =============================================================================
// SUPABASE STORAGE BUCKETS
// =============================================================================

export const STORAGE_BUCKETS = {
  ATTACHMENTS: 'attachments',
  AVATARS: 'avatars',
}

// =============================================================================
// APP METADATA
// =============================================================================

export const APP_NAME = 'Helpdesk IT'
export const APP_DESCRIPTION = 'Sistem Ticketing IT Internal Yayasan Assakinah Sejahtera'
export const APP_ORG = 'Yayasan Assakinah Sejahtera'
