// =============================================================================
// lib/types.ts
// TypeScript interfaces dan types untuk seluruh aplikasi
// =============================================================================

// =============================================================================
// DATABASE TYPES
// =============================================================================

export type UserRole = 'staff' | 'it_admin' | 'admin' | 'sarana'

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

// Ruangan
export type RuanganStatus = 'tersedia' | 'maintenance' | 'tidak_aktif'
export type BookingStatus = 'menunggu' | 'disetujui' | 'ditolak' | 'selesai' | 'dibatalkan'

// Inventaris
export type InventarisKategori = 'elektronik' | 'furniture' | 'atk' | 'kendaraan' | 'alat_olahraga' | 'alat_lab' | 'lainnya'
export type InventarisKondisi  = 'baik' | 'rusak_ringan' | 'rusak_berat'
export type PeminjamanBarangStatus = 'menunggu' | 'dipinjam' | 'dikembalikan' | 'terlambat' | 'hilang'
export type KondisiSaatKembali = 'baik' | 'rusak_ringan' | 'rusak_berat' | 'hilang'
export type JenisMutasi = 'masuk' | 'keluar' | 'pindah_lokasi' | 'rusak' | 'hilang' | 'disposal' | 'perbaikan'
export type NotifikasiTipe = 'tiket' | 'booking_ruangan' | 'peminjaman_barang' | 'inventaris' | 'sistem'

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
  tipe: NotifikasiTipe
  reference_id: string | null
  is_read: boolean
  created_at: string
  // Relasi
  ticket?: Ticket | null
}

// =============================================================================
// TABEL: ruangan
// =============================================================================
export interface Ruangan {
  id: string
  nama_ruangan: string
  lokasi_gedung: string
  lantai: number | null
  kapasitas: number
  fasilitas: string[]
  status: RuanganStatus
  foto: string | null
  keterangan: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
}

// =============================================================================
// TABEL: peminjaman_ruangan
// =============================================================================
export interface PeminjamanRuangan {
  id: string
  ruangan_id: string
  user_id: string
  tanggal: string       // DATE → string 'YYYY-MM-DD'
  jam_mulai: string     // TIME → string 'HH:mm:ss'
  jam_selesai: string
  keperluan: string
  jumlah_peserta: number | null
  status: BookingStatus
  catatan_admin: string | null
  approved_by: string | null
  approved_at: string | null
  cancelled_reason: string | null
  created_at: string
  updated_at: string
}

export interface PeminjamanRuanganWithRelations extends PeminjamanRuangan {
  ruangan: Ruangan
  user: Profile
  approver?: Profile | null
}

// =============================================================================
// TABEL: inventaris
// =============================================================================
export interface Inventaris {
  id: string
  kode_barang: string
  nama_barang: string
  kategori: InventarisKategori
  merk: string | null
  tipe_model: string | null
  jumlah_stok: number
  satuan: string
  kondisi: InventarisKondisi
  lokasi_penempatan: string
  tanggal_perolehan: string   // DATE
  sumber_dana: string | null
  nilai_perolehan: number | null
  foto: string | null
  catatan: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
  // Computed (joined)
  stok_tersedia?: number   // jumlah_stok - yang sedang dipinjam
}

// =============================================================================
// TABEL: peminjaman_barang
// =============================================================================
export interface PeminjamanBarang {
  id: string
  inventaris_id: string
  user_id: string
  jumlah_dipinjam: number
  tanggal_pinjam: string
  tanggal_kembali_estimasi: string
  tanggal_dikembalikan_aktual: string | null
  status: PeminjamanBarangStatus
  kondisi_saat_kembali: KondisiSaatKembali | null
  catatan_peminjam: string | null
  catatan_sarana: string | null
  approved_by: string | null
  approved_at: string | null
  returned_to: string | null
  returned_at: string | null
  created_at: string
  updated_at: string
}

export interface PeminjamanBarangWithRelations extends PeminjamanBarang {
  inventaris: Inventaris
  user: Profile
  approver?: Profile | null
  receiver?: Profile | null
}

// =============================================================================
// TABEL: mutasi_barang
// =============================================================================
export interface MutasiBarang {
  id: string
  inventaris_id: string
  jenis_mutasi: JenisMutasi
  jumlah: number
  stok_sebelum: number
  stok_sesudah: number
  dari_lokasi: string | null
  ke_lokasi: string | null
  keterangan: string
  user_id: string
  tanggal: string
  bukti_foto: string | null
  created_at: string
  // Relasi
  inventaris?: Inventaris
  user?: Profile
}

// =============================================================================
// TABEL: stock_opname
// =============================================================================
export interface StockOpname {
  id: string
  inventaris_id: string
  jumlah_sistem: number
  jumlah_fisik: number
  selisih: number         // GENERATED
  status: 'sesuai' | 'tidak_sesuai'  // GENERATED
  keterangan: string | null
  user_id: string
  tanggal_opname: string
  sesi_id: string
  created_at: string
  // Relasi
  inventaris?: Inventaris
  user?: Profile
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
  comment?: string
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

// Ruangan inputs
export interface CreateRuanganInput {
  nama_ruangan: string
  lokasi_gedung: string
  lantai?: number
  kapasitas: number
  fasilitas?: string[]
  status?: RuanganStatus
  foto?: string
  keterangan?: string
}

export interface UpdateRuanganInput extends Partial<CreateRuanganInput> {
  id: string
}

export interface CreateBookingInput {
  ruangan_id: string
  tanggal: string       // 'YYYY-MM-DD'
  jam_mulai: string     // 'HH:mm'
  jam_selesai: string   // 'HH:mm'
  keperluan: string
  jumlah_peserta?: number
}

// Inventaris inputs
export interface CreateInventarisInput {
  nama_barang: string
  kategori: InventarisKategori
  merk?: string
  tipe_model?: string
  jumlah_stok: number
  satuan: string
  kondisi?: InventarisKondisi
  lokasi_penempatan: string
  tanggal_perolehan: string
  sumber_dana?: string
  nilai_perolehan?: number
  foto?: string
  catatan?: string
}

export interface CreatePeminjamanBarangInput {
  inventaris_id: string
  jumlah_dipinjam: number
  tanggal_pinjam: string
  tanggal_kembali_estimasi: string
  catatan_peminjam?: string
}

export interface CreateMutasiInput {
  inventaris_id: string
  jenis_mutasi: JenisMutasi
  jumlah: number
  dari_lokasi?: string
  ke_lokasi?: string
  keterangan: string
  tanggal: string
  bukti_foto?: string
}

export interface StockOpnameItemInput {
  inventaris_id: string
  jumlah_fisik: number
  keterangan?: string
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
  sla_response_compliance: number
  sla_resolution_compliance: number
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
  month: string
  created: number
  resolved: number
}

export interface SLAComplianceData {
  priority: TicketPriority
  response_compliance: number
  resolution_compliance: number
  total_tickets: number
}

// Dashboard Ruangan
export interface DashboardRuanganStats {
  total_ruangan: number
  tersedia: number
  sedang_dipakai: number
  maintenance: number
  booking_hari_ini: number
  booking_menunggu: number
}

export interface RuanganStatusRealtime {
  ruangan: Ruangan
  booking_aktif?: PeminjamanRuanganWithRelations | null
  booking_berikutnya?: PeminjamanRuanganWithRelations | null
}

// Dashboard Inventaris
export interface DashboardInventarisStats {
  total_jenis_barang: number
  total_unit: number
  total_nilai_aset: number
  sedang_dipinjam_item: number
  sedang_dipinjam_unit: number
  terlambat_count: number
  stok_rendah_count: number
}

export interface InventarisByKategori {
  kategori: InventarisKategori
  jumlah_jenis: number
  jumlah_unit: number
}

export interface InventarisByKondisi {
  kondisi: InventarisKondisi
  jumlah: number
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

export interface BookingFilters {
  status?: BookingStatus | 'all'
  ruangan_id?: string | 'all'
  user_id?: string | 'all'
  date_from?: string
  date_to?: string
  search?: string
}

export interface InventarisFilters {
  kategori?: InventarisKategori | 'all'
  kondisi?: InventarisKondisi | 'all'
  lokasi?: string
  search?: string
}

export interface PeminjamanBarangFilters {
  status?: PeminjamanBarangStatus | 'all'
  user_id?: string | 'all'
  date_from?: string
  date_to?: string
}

export interface MutasiFilters {
  inventaris_id?: string
  jenis_mutasi?: JenisMutasi | 'all'
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

export type DatePeriod = '7d' | '30d' | '90d' | 'custom'

// =============================================================================
// INVENTORY & ROOM TYPES
// =============================================================================

export interface Room {
  id: string
  name: string
  code: string
  capacity: number | null
  location: string | null
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ItemCategory {
  id: string
  name: string
  description: string | null
  is_electronic: boolean
  created_at: string
}

export interface Item {
  id: string
  name: string
  item_category_id: string | null
  description: string | null
  is_electronic: boolean
  created_at: string
  updated_at: string
  // relasi
  category?: ItemCategory | null
}

export type ItemCondition = 'baik' | 'rusak_ringan' | 'rusak_berat'
export type ItemUnitStatus = 'aktif' | 'nonaktif' | 'rusak'

export interface ItemUnit {
  id: string
  item_id: string
  unit_code: string
  serial_number: string | null
  specs: Record<string, string> | null
  condition: ItemCondition
  status: ItemUnitStatus
  room_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // relasi
  item?: Item
  room?: Room | null
}

export interface RoomItem {
  id: string
  room_id: string
  item_id: string
  quantity: number
  created_at: string
  updated_at: string
  // relasi
  item?: Item
  room?: Room
}

export interface RoomWithItems extends Room {
  room_items?: RoomItem[]
  item_units?: ItemUnit[]
}

export type BookingStatus = 'confirmed' | 'cancelled'

export interface RoomBooking {
  id: string
  room_id: string
  booked_by: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  status: BookingStatus
  cancelled_by: string | null
  cancelled_at: string | null
  cancel_reason: string | null
  created_at: string
  updated_at: string
  // relasi
  room?: Room
  booker?: Profile
  canceller?: Profile | null
}

export type OpnameStatus = 'draft' | 'completed'

export interface OpnameSession {
  id: string
  conducted_by: string
  notes: string | null
  status: OpnameStatus
  created_at: string
  completed_at: string | null
  // relasi
  conductor?: Profile
  opname_items?: OpnameItem[]
}

export interface OpnameItem {
  id: string
  opname_session_id: string
  item_id: string
  room_id: string | null
  expected_qty: number
  actual_qty: number
  notes: string | null
  // relasi
  item?: Item
  room?: Room | null
}

export interface ItemMutation {
  id: string
  item_id: string
  item_unit_id: string | null
  from_room_id: string | null
  to_room_id: string | null
  quantity: number
  moved_by: string
  reason: string | null
  created_at: string
  // relasi
  item?: Item
  item_unit?: ItemUnit | null
  from_room?: Room | null
  to_room?: Room | null
  mover?: Profile
}

// =============================================================================
// INPUT TYPES (form → server actions)
// =============================================================================

export interface CreateRoomInput {
  name: string
  code: string
  capacity?: number
  location?: string
  description?: string
}

export interface UpdateRoomInput extends Partial<CreateRoomInput> {
  id: string
  is_active?: boolean
}

export interface CreateItemInput {
  name: string
  item_category_id: string
  description?: string
  is_electronic: boolean
}

export interface UpdateItemInput extends Partial<CreateItemInput> {
  id: string
}

export interface CreateItemUnitInput {
  item_id: string
  unit_code: string
  serial_number?: string
  specs?: Record<string, string>
  condition?: ItemCondition
  status?: ItemUnitStatus
  room_id?: string
  notes?: string
}

export interface UpdateItemUnitInput extends Partial<Omit<CreateItemUnitInput, 'item_id'>> {
  id: string
}

export interface CreateRoomBookingInput {
  room_id: string
  title: string
  description?: string
  start_time: string
  end_time: string
}

export interface CancelBookingInput {
  id: string
  cancel_reason?: string
}

export interface MutateItemInput {
  item_id: string
  from_room_id: string | null
  to_room_id: string
  quantity: number
  item_unit_id?: string // untuk elektronik
  reason?: string
}

export interface StartOpnameInput {
  notes?: string
  items: {
    item_id: string
    room_id: string | null
    expected_qty: number
  }[]
}

export interface UpdateOpnameItemInput {
  id: string
  actual_qty: number
  notes?: string
}

// CSV import row
export interface ImportItemRow {
  nama_barang: string
  kategori: string
  ruangan?: string
  jumlah?: number
  kode_unit?: string
  nomor_seri?: string
  spesifikasi?: string
  kondisi?: string
  keterangan?: string
}
