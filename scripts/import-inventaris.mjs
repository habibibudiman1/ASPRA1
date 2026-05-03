// scripts/import-inventaris.mjs
// Import data inventaris dari Glide ke Supabase
// Jalankan: node scripts/import-inventaris.mjs

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const SUPABASE_URL = 'https://wxmqenerozeuxhyhyrkj.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4bXFlbmVyb3pldXhoeWh5cmtqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjU3NTgyOCwiZXhwIjoyMDkyMTUxODI4fQ.au5H_J7QEQxp5c6RuU6L03z1eY8qHwsi68eALdQacQk'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const JENIS_TO_KATEGORI = {
  'elektronik':     'elektronik',
  'mebelair':       'furniture',
  'furniture':      'furniture',
  'lain-lain':      'lainnya',
  'bangunan':       'lainnya',
  'bagunan':        'lainnya',
  'tanah':          'lainnya',
  'surat berharga': 'lainnya',
  'mobil':          'kendaraan',
  'motor':          'kendaraan',
}

const KONDISI_MAP = {
  'baik':      'baik',
  'perbaikan': 'rusak_ringan',
  'rusak':     'rusak_berat',
}

const BULAN_MAP = {
  'januari': '01', 'februari': '02', 'maret': '03', 'april': '04',
  'mei': '05', 'juni': '06', 'juli': '07', 'agustus': '08',
  'september': '09', 'oktober': '10', 'november': '11', 'desember': '12',
}

const PREFIX_MAP = {
  elektronik: 'ELK', furniture: 'FRN', atk: 'ATK',
  kendaraan: 'KDR', alat_olahraga: 'OLR', alat_lab: 'LAB', lainnya: 'LNY',
}

function parseTanggal(tahun, bulan) {
  const y = parseInt(tahun)
  if (!y || y < 1900 || y > 2100) return '2000-01-01'
  const m = BULAN_MAP[bulan?.toLowerCase()?.trim()] ?? '01'
  return `${y}-${m}-01`
}

function extractMerk(spesifikasi) {
  if (!spesifikasi) return null
  const brand = spesifikasi.split(/[_\s,/]/)[0]?.trim()
  return brand && brand.length > 1 && brand.length < 50 ? brand : null
}

function buildCatatan(raw) {
  const parts = []
  if (raw.ruang && raw.ruang !== '-') parts.push(`Ruang: ${raw.ruang}`)
  if (raw.status) parts.push(`Status: ${raw.status}`)
  if (raw.keterangan) parts.push(raw.keterangan)
  return parts.join(' | ') || null
}

async function getLastSeq(kategori) {
  const prefix = PREFIX_MAP[kategori] ?? 'LNY'
  const { data } = await supabase
    .from('inventaris')
    .select('kode_barang')
    .like('kode_barang', `INV-${prefix}-%`)
    .order('kode_barang', { ascending: false })
    .limit(1)
    .single()
  if (!data?.kode_barang) return 0
  const parts = data.kode_barang.split('-')
  return parseInt(parts[2] ?? '0', 10) || 0
}

async function main() {
  // 1. Hapus semua data inventaris
  console.log('Menghapus semua data inventaris lama...')
  const { error: delErr } = await supabase.from('inventaris').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (delErr) { console.error('Gagal hapus:', delErr.message); process.exit(1) }
  console.log('Semua data lama berhasil dihapus.')

  // 2. Load data v3
  const raw = JSON.parse(JSON.parse(readFileSync('./inventaris_v3.json', 'utf-8')))
  const items = raw.items.filter(i => i.sub_jenis?.trim() || i.spesifikasi?.trim())
  console.log(`Item valid: ${items.length}`)

  // 3. Preload seq per kategori (semuanya 0 karena sudah dihapus)
  const seqMap = {}
  // Untuk item MPA dengan No field, kode = "MPA-{No}"
  // Untuk yang lain, auto-generate

  let imported = 0
  let errors = 0
  const BATCH = 50

  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH)
    const rows = batch.map(raw => {
      const jenis = raw.jenis?.toLowerCase().trim()
      const kategori = JENIS_TO_KATEGORI[jenis] ?? 'lainnya'

      // kode_barang: pakai No field jika ada (MPA), else auto-generate
      let kode_barang
      if (raw.no !== null && raw.no !== undefined) {
        kode_barang = `${raw.lokasi}-${String(raw.no).padStart(4, '0')}`
      } else {
        seqMap[kategori] = (seqMap[kategori] || 0) + 1
        const prefix = PREFIX_MAP[kategori] ?? 'LNY'
        kode_barang = `INV-${prefix}-${String(seqMap[kategori]).padStart(4, '0')}`
      }

      return {
        kode_barang,
        nama_barang: raw.sub_jenis?.trim() || raw.spesifikasi?.split(/[_\s]/)[0] || 'Tidak Diketahui',
        kategori,
        merk: extractMerk(raw.spesifikasi),
        tipe_model: raw.spesifikasi?.substring(0, 200) || null,
        jumlah_stok: Math.max(1, Number(raw.jumlah) || 1),
        satuan: 'unit',
        kondisi: KONDISI_MAP[raw.kondisi?.toLowerCase().trim()] ?? 'baik',
        lokasi_penempatan: raw.lokasi || 'Tidak Diketahui',
        tanggal_perolehan: parseTanggal(raw.tahun_pelaporan, raw.bulan_pelaporan),
        sumber_dana: raw.sumber_dana || null,
        nilai_perolehan: raw.harga_perolehan > 0 ? raw.harga_perolehan : null,
        catatan: buildCatatan(raw),
      }
    })

    const { error } = await supabase.from('inventaris').insert(rows)
    if (error) {
      console.error(`Batch ${Math.floor(i/BATCH)+1} error:`, error.message)
      errors += batch.length
    } else {
      imported += batch.length
      process.stdout.write(`\rProgress: ${imported}/${items.length}...`)
    }
  }

  console.log(`\n\nSelesai! Berhasil: ${imported}, Gagal: ${errors}`)
}

main().catch(console.error)
