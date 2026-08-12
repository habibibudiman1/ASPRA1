import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:\\Users\\andra\\.gemini\\antigravity\\brain\\241ba063-4a32-49cf-bc86-8060811bbf7f\\screenshots';
const OUTPUT_PDF = 'c:\\Ez\\TelU\\SEMESTER\\Semester 6\\PANCASILA\\ASPRA1\\Laporan_Testing_Modul_Andrarieza.pdf';

function getBase64Image(filename) {
  const filePath = path.join(SCREENSHOT_DIR, filename);
  if (!fs.existsSync(filePath)) return '';
  const buffer = fs.readFileSync(filePath);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Testing Modul Inventaris - Andrarieza Rizqi Pradana</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    body {
      font-family: 'Inter', sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 30px;
      background-color: #ffffff;
      font-size: 13px;
      line-height: 1.5;
    }

    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 15px;
      margin-bottom: 25px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .title {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 6px 0;
    }

    .subtitle {
      font-size: 13px;
      color: #64748b;
      margin: 0;
    }

    .badge {
      background-color: #0284c7;
      color: white;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      border-left: 4px solid #0284c7;
      padding-left: 10px;
      margin-top: 30px;
      margin-bottom: 15px;
      page-break-after: avoid;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 25px;
    }

    .info-item strong {
      color: #334155;
    }

    .role-card {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 25px;
      page-break-inside: avoid;
    }

    .role-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .role-name {
      font-size: 15px;
      font-weight: 600;
      color: #0f172a;
    }

    .role-email {
      font-family: monospace;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      color: #475569;
    }

    .screenshot-container {
      margin-top: 15px;
      page-break-inside: avoid;
    }

    .screenshot-title {
      font-weight: 600;
      font-size: 12px;
      color: #334155;
      margin-bottom: 6px;
    }

    .screenshot-img {
      width: 100%;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      margin-bottom: 15px;
    }

    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <h1 class="title">Laporan Pembagian Modul &amp; Bukti Testing Localhost</h1>
      <p class="subtitle">Proyek ASPRA - KPPM Yayasan Assakinah Sejahtera</p>
    </div>
    <div>
      <span class="badge">Modul Inventaris</span>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-item"><strong>Pengembang (Penanggung Jawab):</strong> Andrarieza Rizqi Pradana</div>
    <div class="info-item"><strong>Modul Utama:</strong> Inventaris &amp; Stock Opname</div>
    <div class="info-item"><strong>Fokus Produk:</strong> Data Barang, Stock Opname, Mutasi, CSV, Laporan</div>
    <div class="info-item"><strong>Status Testing:</strong> ✅ All 4 Roles Verified (Localhost:3000)</div>
  </div>

  <div class="section-title">1. Pembagian Akses Halaman Berdasarkan Peran (Role)</div>
  <p>Berikut adalah kategorisasi halaman yang menjadi tanggung jawab modul Andrarieza berdasarkan 4 akun peran (role):</p>

  <!-- Super Admin -->
  <div class="role-card">
    <div class="role-header">
      <span class="role-name">1. Super Admin (Full Access)</span>
      <span class="role-email">superadmin@gmail.com : Password123!</span>
    </div>
    <p>Akses penuh ke seluruh halaman modul inventaris, pencatatan stock opname, mutasi barang, dan cetak laporan PDF.</p>
    <ul>
      <li>Dashboard Inventaris (<code>/inventaris</code>)</li>
      <li>Data Barang (<code>/inventaris/barang</code>)</li>
      <li>Tambah Barang &amp; Impor CSV (<code>/inventaris/barang/baru</code>)</li>
      <li>Stock Opname (<code>/inventaris/stock-opname</code>)</li>
      <li>Mutasi Barang (<code>/inventaris/mutasi</code>)</li>
      <li>Laporan Inventaris PDF (<code>/inventaris/laporan</code>)</li>
    </ul>
  </div>

  <!-- Sarana -->
  <div class="role-card">
    <div class="role-header">
      <span class="role-name">2. Petugas Sarana &amp; Prasarana</span>
      <span class="role-email">sarana@gmail.com : Password123!</span>
    </div>
    <p>Pengelola operasional utama fisik inventaris, pelaksanaan stock opname, pencatatan mutasi, dan approval peminjaman barang.</p>
    <ul>
      <li>Dashboard Inventaris (<code>/inventaris</code>)</li>
      <li>Data Barang (<code>/inventaris/barang</code>)</li>
      <li>Stock Opname (<code>/inventaris/stock-opname</code>)</li>
      <li>Mutasi Barang (<code>/inventaris/mutasi</code>)</li>
      <li>Approval Peminjaman Barang (<code>/inventaris/peminjaman</code>)</li>
    </ul>
  </div>

  <!-- IT Admin -->
  <div class="role-card">
    <div class="role-header">
      <span class="role-name">3. IT Admin</span>
      <span class="role-email">habud@gmail.com : Password123!</span>
    </div>
    <p>Akses monitoring data barang (read-only) untuk mendukung operasional penanganan tiket IT.</p>
    <ul>
      <li>Dashboard IT (<code>/dashboard</code>)</li>
      <li>Daftar Barang Read-Only (<code>/inventaris/barang</code>)</li>
    </ul>
  </div>

  <!-- Staff -->
  <div class="role-card">
    <div class="role-header">
      <span class="role-name">4. Staff (Pengguna Umum)</span>
      <span class="role-email">habibibudiman@gmail.com : Password123!</span>
    </div>
    <p>Akses melihat katalog barang dan mengajukan peminjaman barang.</p>
    <ul>
      <li>Daftar Barang (<code>/inventaris/barang</code>)</li>
      <li>Form Pinjam Barang (<code>/inventaris/peminjaman/baru</code>)</li>
      <li>Riwayat Pinjaman Saya (<code>/inventaris/peminjaman</code>)</li>
    </ul>
  </div>

  <div class="page-break"></div>

  <div class="section-title">2. Tangkapan Layar (Screenshot) Testing Localhost</div>

  <h3>A. Role: Super Admin</h3>

  <div class="screenshot-container">
    <div class="screenshot-title">Dashboard Inventaris (/inventaris)</div>
    <img class="screenshot-img" src="${getBase64Image('superadmin_dashboard_inventaris.png')}" />
  </div>

  <div class="screenshot-container">
    <div class="screenshot-title">Data Barang (/inventaris/barang)</div>
    <img class="screenshot-img" src="${getBase64Image('superadmin_daftar_barang.png')}" />
  </div>

  <div class="screenshot-container">
    <div class="screenshot-title">Tambah Barang &amp; Impor CSV (/inventaris/barang/baru)</div>
    <img class="screenshot-img" src="${getBase64Image('superadmin_tambah_barang.png')}" />
  </div>

  <div class="page-break"></div>

  <div class="screenshot-container">
    <div class="screenshot-title">Stock Opname (/inventaris/stock-opname)</div>
    <img class="screenshot-img" src="${getBase64Image('superadmin_stock_opname.png')}" />
  </div>

  <div class="screenshot-container">
    <div class="screenshot-title">Mutasi Barang (/inventaris/mutasi)</div>
    <img class="screenshot-img" src="${getBase64Image('superadmin_mutasi.png')}" />
  </div>

  <div class="screenshot-container">
    <div class="screenshot-title">Laporan Inventaris (/inventaris/laporan)</div>
    <img class="screenshot-img" src="${getBase64Image('superadmin_laporan.png')}" />
  </div>

  <div class="page-break"></div>

  <h3>B. Role: Sarana</h3>

  <div class="screenshot-container">
    <div class="screenshot-title">Dashboard Inventaris Sarana (/inventaris)</div>
    <img class="screenshot-img" src="${getBase64Image('sarana_dashboard_inventaris.png')}" />
  </div>

  <div class="screenshot-container">
    <div class="screenshot-title">Stock Opname Sarana (/inventaris/stock-opname)</div>
    <img class="screenshot-img" src="${getBase64Image('sarana_stock_opname.png')}" />
  </div>

  <div class="screenshot-container">
    <div class="screenshot-title">Approval Peminjaman Barang (/inventaris/peminjaman)</div>
    <img class="screenshot-img" src="${getBase64Image('sarana_approval_peminjaman.png')}" />
  </div>

  <div class="page-break"></div>

  <h3>C. Role: IT Admin &amp; Staff</h3>

  <div class="screenshot-container">
    <div class="screenshot-title">IT Admin - Dashboard IT (/dashboard)</div>
    <img class="screenshot-img" src="${getBase64Image('it_dashboard.png')}" />
  </div>

  <div class="screenshot-container">
    <div class="screenshot-title">Staff - Form Pinjam Barang Baru (/inventaris/peminjaman/baru)</div>
    <img class="screenshot-img" src="${getBase64Image('staff_pinjam_barang_baru.png')}" />
  </div>

  <div class="screenshot-container">
    <div class="screenshot-title">Staff - Riwayat Pinjaman Saya (/inventaris/peminjaman)</div>
    <img class="screenshot-img" src="${getBase64Image('staff_pinjaman_saya.png')}" />
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
    margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
    printBackground: true
  });

  await browser.close();
  console.log(`PDF successfully created at: ${OUTPUT_PDF}`);
}

run().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
