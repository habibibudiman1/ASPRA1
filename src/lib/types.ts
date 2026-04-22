// =============================================================================
// lib/types.ts
// TypeScript interfaces dan types untuk seluruh aplikasi
// =============================================================================

// =============================================================================
// DATABASE TYPES
// =============================================================================

export type UserRole = 'staff' | 'it_admin'

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'reopened'

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical'

export type ActivityAction =
  | 'created'
  | 'status_changed'
  | 'assigned'
  | 'unassigned'
  | 'commented'
  | 'rated'
  | 'attachment_added'
  | 'attachment_removed'
  | 'reopened'

// =============================================================================
// TABEL: profiles
// =============================================================================
export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  avatar_url: string | null
  department: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// =============================================================================
// TABEL: categories
// =============================================================================
export interface Category {
  id: string
  name: string
  description: string | null
  color: string
  is_active: boolean
  created_at: string
}

// =============================================================================
// TABEL: sla_policies
// =============================================================================
export interface SLAPolicy {
  id: string
  priority: TicketPriority
  response_time_minutes: number
  resolution_time_minutes: number
  created_at: string
  updated_at: string
}

// =============================================================================
// TABEL: tickets
// =============================================================================
export interface Ticket {
  id: string
  ticket_number: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category_id: string | null
  reporter_id: string
  assignee_id: string | null
  // SLA tracking
  sla_response_deadline: string | null
  sla_resolution_deadline: string | null
  sla_response_met: boolean | null
  sla_resolution_met: boolean | null
  first_responded_at: string | null
  // Status timestamps
  resolved_at: string | null
  closed_at: string | null
  // Rating
  rating: number | null
  rating_comment: string | null
  created_at: string
  updated_at: string
}

// Tiket dengan relasi yang sudah di-join
export interface TicketWithRelations extends Ticket {
  category: Category | null
  reporter: Profile
  assignee: Profile | null
  comments?: TicketComment[]
  attachments?: TicketAttachment[]
  activity_log?: TicketActivityLog[]
  _count?: {
    comments: number
    attachments: number
  }
}

// =============================================================================
// TABEL: ticket_comments
// =============================================================================
export interface TicketComment {
  id: string
  ticket_id: string
  author_id: string
  content: string
  is_internal: boolean
  created_at: string
  // Relasi
  author?: Profile
}

// =============================================================================
// TABEL: ticket_attachments
// =============================================================================
export interface TicketAttachment {
  id: string
  ticket_id: string
  uploaded_by: string
  file_name: string
  file_url: string
  file_size: number | null
  mime_type: string | null
  created_at: string
  // Relasi
  uploader?: Profile
}

// =============================================================================
// TABEL: ticket_activity_log
// =============================================================================
export interface TicketActivityLog {
  id: string
  ticket_id: string
  actor_id: string
  action: ActivityAction
  old_value: string | null
  new_value: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  // Relasi
  actor?: Profile
}

// =============================================================================
// TABEL: notifications
// =============================================================================
export interface Notification {
  id: string
  user_id: string
  ticket_id: string | null
  title: string
  message: string
  is_read: boolean
  created_at: string
  // Relasi
  ticket?: Ticket | null
}

// =============================================================================
// SERVER ACTION RETURN TYPES
// =============================================================================

export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

// =============================================================================
// FORM DATA TYPES (input ke Server Actions)
// =============================================================================

export interface CreateTicketInput {
  title: string
  description: string
  priority: TicketPriority
  category_id: string
}

export interface UpdateTicketStatusInput {
  ticket_id: string
  status: TicketStatus
  comment?: string // Komentar opsional saat update status
}

export interface AssignTicketInput {
  ticket_id: string
  assignee_id: string | null
}

export interface RateTicketInput {
  ticket_id: string
  rating: number
  rating_comment?: string
}

export interface CreateCommentInput {
  ticket_id: string
  content: string
  is_internal?: boolean
}

export interface CreateCategoryInput {
  name: string
  description?: string
  color?: string
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {
  id: string
  is_active?: boolean
}

export interface CreateUserInput {
  full_name: string
  email: string
  role: UserRole
  department?: string
  password: string
}

export interface UpdateUserInput {
  id: string
  full_name?: string
  role?: UserRole
  department?: string
  is_active?: boolean
}

export interface UpdateProfileInput {
  full_name?: string
  department?: string
  avatar_url?: string
}

export interface UpdateSLAPolicyInput {
  id: string
  response_time_minutes: number
  resolution_time_minutes: number
}

// =============================================================================
// DASHBOARD / ANALYTICS TYPES
// =============================================================================

export interface DashboardStats {
  total_tickets: number
  open_tickets: number
  in_progress_tickets: number
  resolved_tickets: number
  closed_tickets: number
  avg_resolution_hours: number
  sla_response_compliance: number   // persentase 0-100
  sla_resolution_compliance: number // persentase 0-100
}

export interface TicketsByStatus {
  status: TicketStatus
  count: number
}

export interface TicketsByCategory {
  category_name: string
  count: number
  color: string
}

export interface TicketsByMonth {
  month: string  // Format: 'Jan 2025'
  created: number
  resolved: number
}

export interface SLAComplianceData {
  priority: TicketPriority
  response_compliance: number
  resolution_compliance: number
  total_tickets: number
}

// =============================================================================
// FILTER & PAGINATION TYPES
// =============================================================================

export interface TicketFilters {
  status?: TicketStatus | 'all'
  priority?: TicketPriority | 'all'
  category_id?: string | 'all'
  assignee_id?: string | 'all'
  search?: string
  date_from?: string
  date_to?: string
}

export interface PaginationState {
  page: number
  per_page: number
  total: number
  total_pages: number
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: PaginationState
}

// Periode filter untuk dashboard
export type DatePeriod = '7d' | '30d' | '90d' | 'custom'
