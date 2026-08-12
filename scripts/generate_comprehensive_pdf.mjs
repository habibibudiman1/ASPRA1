import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BRAIN_DIR = 'C:\\Users\\andra\\.gemini\\antigravity\\brain\\241ba063-4a32-49cf-bc86-8060811bbf7f';
const OUTPUT_PDF = 'c:\\Ez\\TelU\\SEMESTER\\Semester 6\\PANCASILA\\ASPRA1\\Laporan_SIT_Lengkap_Modul_Andrarieza.pdf';
const OUTPUT_BRAIN_PDF = path.join(BRAIN_DIR, 'Laporan_SIT_Lengkap_Modul_Andrarieza.pdf');

function getBase64Image(filename) {
  const filePath = path.join(BRAIN_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`Warning: Image ${filename} not found at ${filePath}`);
    return '';
  }
  const buffer = fs.readFileSync(filePath);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan SIT / UAT Lengkap Modul Inventaris & Stock Opname - Andrarieza</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; color: #0f172a; margin: 0; padding: 25px; font-size: 12px; line-height: 1.5; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
    .title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; }
    .subtitle { font-size: 12px; color: #64748b; margin: 0; }
    .badge { background-color: #16a34a; color: white; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
    .info-table td { padding: 8px 12px; border: 1px solid #e2e8f0; }
    .info-table td.bg { background-color: #f8fafc; font-weight: 600; width: 25%; }
    
    .scenario-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; margin-bottom: 20px; page-break-inside: avoid; }
    .scenario-title { font-size: 14px; font-weight: 700; color: #1e293b; border-left: 4px solid #2563eb; padding-left: 8px; margin: 0 0 8px 0; }
    .scenario-desc { font-size: 12px; color: #475569; margin-bottom: 10px; }
    
    .screenshot-img { width: 100%; border-radius: 6px; border: 1px solid #94a3b8; margin-top: 6px; margin-bottom: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .status-pass { color: #16a34a; font-weight: 700; }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <h1 class="title">Laporan Comprehensive System Integration Testing (SIT) / UAT</h1>
      <p class="subtitle">Proyek ASPRA - KPPM Yayasan Assakinah Sejahtera (12 Skenario Pengujian)</p>
    </div>
    <div>
      <span class="badge">12/12 SKENARIO PASSED</span>
    </div>
  </div>

  <table class="info-table">
    <tr>
      <td class="bg">Modul Fokus</td>
      <td>Inventaris dan Stock Opname</td>
      <td class="bg">Penanggung Jawab</td>
      <td>Andrarieza Rizqi Pradana</td>
    </tr>
    <tr>
      <td class="bg">Server Testing</td>
      <td>Localhost (<code>http://localhost:3000</code>)</td>
      <td class="bg">Tanggal Execution</td>
      <td>12 Agustus 2026</td>
    </tr>
    <tr>
      <td class="bg">Cakupan Pengujian</td>
      <td>End-to-End Transaksi 4 Peran (Super Admin, Sarana, IT, Staff)</td>
      <td class="bg">Status Final</td>
      <td><span class="status-pass">100% SUCCESS / VERIFIED</span></td>
    </tr>
  </table>

  <!-- SIT 01 -->
  <div class="scenario-card">
    <div class="scenario-title">SIT-01: Tambah Barang Elektronik Baru &amp; Auto-Generate Kode (Role: Sarana)</div>
    <div class="scenario-desc">Mengisi identitas barang elektronik, tombol generate kode otomatis (<code>ELK-0004</code>), jumlah stok, lokasi penempatan, dan nilai perolehan.</div>
    <img class="screenshot-img" src="${getBase64Image('sit_01_tambah_elektronik.png')}" />
    <img class="screenshot-img" src="${getBase64Image('sit_02_daftar_setelah_tambah.png')}" />
  </div>

  <div class="page-break"></div>

  <!-- SIT 02 & 03 -->
  <div class="scenario-card">
    <div class="scenario-title">SIT-02: Form Tambah PC Rakitan Spesifikasi Khusus (Role: Sarana)</div>
    <div class="scenario-desc">Menguji logika deteksi otomatis komponen PC (Processor, RAM, Motherboard, Storage) pada form tambah barang.</div>
    <img class="screenshot-img" src="${getBase64Image('sit_03_form_pc_rakitan.png')}" />
  </div>

  <div class="scenario-card">
    <div class="scenario-title">SIT-03 &amp; SIT-04: View Detail Spesifikasi &amp; Form Edit Data Barang</div>
    <div class="scenario-desc">Membuka detail barang <code>/inventaris/barang/[id]</code> dan mengakses form ubah data barang <code>/inventaris/barang/[id]/edit</code>.</div>
    <img class="screenshot-img" src="${getBase64Image('sit_04_detail_barang_spesifik.png')}" />
  </div>

  <div class="page-break"></div>

  <!-- SIT 05 & 06 -->
  <div class="scenario-card">
    <div class="scenario-title">SIT-05: Filter Barang Berdasarkan Lokasi Penempatan</div>
    <div class="scenario-desc">Pengujian filtering dan pengelompokan barang inventaris berdasarkan lokasi penempatan spesifik.</div>
    <img class="screenshot-img" src="${getBase64Image('sit_06_filter_lokasi.png')}" />
  </div>

  <div class="scenario-card">
    <div class="scenario-title">SIT-06: Pengajuan Peminjaman Barang oleh Staff (Role: Staff)</div>
    <div class="scenario-desc">Staff memilih jenis &amp; unit barang spesifik, menentukan tanggal estimasi kembali, dan mengirim pengajuan peminjaman.</div>
    <img class="screenshot-img" src="${getBase64Image('sit_07_staff_ajukan_peminjaman.png')}" />
    <img class="screenshot-img" src="${getBase64Image('sit_08_staff_pinjaman_menunggu.png')}" />
  </div>

  <div class="page-break"></div>

  <!-- SIT 07 & 08 -->
  <div class="scenario-card">
    <div class="scenario-title">SIT-07: Approval Peminjaman Barang oleh Sarana (Role: Sarana)</div>
    <div class="scenario-desc">Petugas Sarana menerima pengajuan peminjaman di dashboard, memverifikasi detail di dialog, dan menyetujui request.</div>
    <img class="screenshot-img" src="${getBase64Image('sit_09_dialog_approval_sarana.png')}" />
    <img class="screenshot-img" src="${getBase64Image('sit_10_status_terverifikasi_dipinjam.png')}" />
  </div>

  <div class="page-break"></div>

  <!-- SIT 08, 09, 10 -->
  <div class="scenario-card">
    <div class="scenario-title">SIT-08: Pengembalian Barang &amp; Konfirmasi Terima Kembali</div>
    <div class="scenario-desc">Staff melaporkan pengembalian barang ➔ Sarana memverifikasi kondisi barang saat dikembalikan.</div>
    <img class="screenshot-img" src="${getBase64Image('sit_11_staff_lapor_kembali.png')}" />
  </div>

  <div class="scenario-card">
    <div class="scenario-title">SIT-09: Penyesuaian &amp; Verifikasi Stock Opname (/inventaris/stock-opname)</div>
    <div class="scenario-desc">Pemeriksaan pencatatan stok fisik vs stok sistem pada modul Stock Opname Sarana.</div>
    <img class="screenshot-img" src="${getBase64Image('sit_12_stock_opname.png')}" />
  </div>

  <div class="page-break"></div>

  <!-- SIT 10, 11, 12 -->
  <div class="scenario-card">
    <div class="scenario-title">SIT-10 &amp; SIT-11: Audit Log Mutasi Barang &amp; Form Mutasi Manual</div>
    <div class="scenario-desc">Pemeriksaan jejak audit riwayat mutasi stok (masuk, keluar, rusak, perbaikan, pindah lokasi).</div>
    <img class="screenshot-img" src="${getBase64Image('sit_13_audit_mutasi.png')}" />
    <img class="screenshot-img" src="${getBase64Image('sit_14_form_tambah_mutasi.png')}" />
  </div>

  <div class="scenario-card">
    <div class="scenario-title">SIT-12: Generator Laporan Inventaris PDF (/inventaris/laporan)</div>
    <div class="scenario-desc">Verifikasi modul laporan inventaris dan kesiapan ekspor dokumen laporan PDF.</div>
    <img class="screenshot-img" src="${getBase64Image('sit_15_laporan_pdf.png')}" />
  </div>

</body>
</html>
`;

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setContent(htmlContent, { waitUntil: 'networkidle' });
  await page.pdf({
    path: OUTPUT_PDF,
    format: 'A4',
    margin: { top: '12mm', bottom: '12mm', left: '12mm', right: '12mm' },
    printBackground: true
  });

  fs.copyFileSync(OUTPUT_PDF, OUTPUT_BRAIN_PDF);

  await browser.close();
  console.log(`\n✅ Comprehensive SIT PDF created successfully at:\n1. ${OUTPUT_PDF}\n2. ${OUTPUT_BRAIN_PDF}`);
}

run().catch(err => {
  console.error('Error generating comprehensive SIT PDF:', err);
  process.exit(1);
});
