// =============================================================================
// lib/utils.ts
// Utility functions yang digunakan di seluruh aplikasi
// =============================================================================

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isAfter, parseISO } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import type { TicketStatus, TicketPriority } from './types'
import { TICKET_STATUS, TICKET_PRIORITY } from './constants'

// =============================================================================
// TAILWIND CLASS MERGER
// =============================================================================

/**
 * Menggabungkan class Tailwind dengan aman (menghindari konflik)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// =============================================================================
// DATE FORMATTING
// =============================================================================

/**
 * Format tanggal ke format Indonesia yang readable
 * Contoh: "19 April 2025, 10:30"
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'dd MMMM yyyy, HH:mm', { locale: localeId })
  } catch {
    return '-'
  }
}

/**
 * Format tanggal singkat
 * Contoh: "19 Apr 2025"
 */
export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return '-'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'dd MMM yyyy', { locale: localeId })
  } catch {
    return '-'
  }
}

/**
 * Format waktu relatif
 * Contoh: "3 menit yang lalu", "2 jam yang lalu"
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '-'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return formatDistanceToNow(d, { addSuffix: true, locale: localeId })
  } catch {
    return '-'
  }
}

/**
 * Format durasi dalam menit menjadi teks readable
 * Contoh: 90 → "1 jam 30 menit"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} menit`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return hours === 1 ? '1 jam' : `${hours} jam`
  }
  return `${hours} jam ${remainingMinutes} menit`
}

/**
 * Format angka ke format Rupiah Indonesia
 * Contoh: 8500000 → "Rp 8.500.000"
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Hitung durasi antara dua tanggal dalam jam (pembulatan ke atas)
 */
export function calculateDurationHours(from: string, to: string): number {
  const fromDate = parseISO(from)
  const toDate = parseISO(to)
  const diffMs = toDate.getTime() - fromDate.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60))
}

// =============================================================================
// SLA UTILITIES
// =============================================================================

/**
 * Cek apakah deadline SLA sudah terlewati
 */
export function isSLABreached(deadline: string | null): boolean {
  if (!deadline) return false
  return isAfter(new Date(), parseISO(deadline))
}

/**
 * Hitung persentase waktu yang tersisa sebelum SLA breach
 * Return: 0-100, dimana 100 = masih banyak waktu, 0 = sudah breach
 */
export function getSLATimeRemainingPercent(
  createdAt: string,
  deadline: string | null
): number {
  if (!deadline) return 100
  const created = parseISO(createdAt)
  const deadlineDate = parseISO(deadline)
  const now = new Date()
  const totalDuration = deadlineDate.getTime() - created.getTime()
  const elapsed = now.getTime() - created.getTime()
  const remaining = Math.max(0, ((totalDuration - elapsed) / totalDuration) * 100)
  return Math.round(remaining)
}

// =============================================================================
// FILE UTILITIES
// =============================================================================

/**
 * Format ukuran file menjadi teks readable
 * Contoh: 1048576 → "1.0 MB"
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

/**
 * Dapatkan emoji icon berdasarkan tipe MIME file
 */
export function getFileIcon(mimeType: string | null): string {
  if (!mimeType) return '📎'
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.includes('word')) return '📝'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
  return '📎'
}

// =============================================================================
// STATUS & PRIORITY COLORS
// =============================================================================

/**
 * Dapatkan konfigurasi warna untuk status tiket
 */
export function getStatusConfig(status: TicketStatus) {
  return TICKET_STATUS[status] ?? TICKET_STATUS.open
}

/**
 * Dapatkan konfigurasi warna untuk prioritas tiket
 */
export function getPriorityConfig(priority: TicketPriority) {
  return TICKET_PRIORITY[priority] ?? TICKET_PRIORITY.medium
}

// =============================================================================
// STRING UTILITIES
// =============================================================================

/**
 * Truncate teks panjang dengan ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

/**
 * Capitalize huruf pertama setiap kata
 */
export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Dapatkan inisial nama untuk avatar fallback
 * Contoh: "Budi Santoso" → "BS"
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join('')
}

// =============================================================================
// URL & EXPORT UTILITIES
// =============================================================================

/**
 * Generate CSV dari array of objects
 */
export function generateCSV(data: Record<string, unknown>[], headers: Record<string, string>): string {
  const headerRow = Object.values(headers).join(',')
  const rows = data.map((row) =>
    Object.keys(headers)
      .map((key) => {
        const value = row[key] ?? ''
        const str = String(value)
        // Escape nilai yang mengandung koma atau newline
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      })
      .join(',')
  )
  return [headerRow, ...rows].join('\n')
}

/**
 * Download CSV file di browser
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

// =============================================================================
// MISC UTILITIES
// =============================================================================

/**
 * Delay (untuk testing dan debounce manual)
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Safe JSON parse dengan fallback
 */
export function safeJsonParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}
