import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SIT_DIR = 'C:\\Users\\andra\\.gemini\\antigravity\\brain\\241ba063-4a32-49cf-bc86-8060811bbf7f\\screenshots_sit';
const OUTPUT_PDF = 'c:\\Ez\\TelU\\SEMESTER\\Semester 6\\PANCASILA\\ASPRA1\\Laporan_SIT_Modul_Andrarieza.pdf';
const OUTPUT_BRAIN_PDF = 'C:\\Users\\andra\\.gemini\\antigravity\\brain\\241ba063-4a32-49cf-bc86-8060811bbf7f\\Laporan_SIT_Modul_Andrarieza.pdf';

function getBase64Image(filename) {
  const filePath = path.join(SIT_DIR, filename);
  if (!fs.existsSync(filePath)) return '';
  const buffer = fs.readFileSync(filePath);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan SIT / UAT Modul Inventaris & Stock Opname - Andrarieza Rizqi Pradana</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; color: #0f172a; margin: 0; padding: 25px; font-size: 13px; line-height: 1.5; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
    .title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; }
    .subtitle { font-size: 12px; color: #64748b; margin: 0; }
    .badge { background-color: #16a34a; color: white; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
    .info-table td { padding: 8px 12px; border: 1px solid #e2e8f0; }
    .info-table td.bg { background-color: #f8fafc; font-weight: 600; width: 25%; }
    .scenario-title { font-size: 14px; font-weight: 700; color: #1e293b; background-color: #f1f5f9; padding: 8px 12px; border-left: 4px solid #2563eb; margin-top: 25px; margin-bottom: 12px; border-radius: 0 4px 4px 0; page-break-after: avoid; }
    .step-desc { font-weight: 600; font-size: 12px; color: #334155; margin-top: 10px; margin-bottom: 4px; }
    .screenshot-img { width: 100%; border-radius: 6px; border: 1px solid #cbd5e1; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .status-pass { color: #16a34a; font-weight: 700; }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <h1 class="title">Laporan System Integration Testing (SIT) / UAT</h1>
      <p class="subtitle">Proyek ASPRA - KPPM Yayasan Assakinah Sejahtera</p>
    </div>
    <div>
      <span class="badge">SIT STATUS: PASSED</span>
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
      <td class="bg">Skenario Diuji</td>
      <td>End-to-End Multi-Role (Sarana &amp; Staff)</td>
      <td class="bg">Hasil SIT</td>
      <td><span class="status-pass">100% Passed (5 dari 5 Skenario Selesai)</span></td>
    </tr>
  </table>

  <!-- SCENARIO 1 -->
  <div class="scenario-title">SKENARIO 1: End-to-End Tambah Barang Inventaris Baru (Role: Sarana)</div>
  <p><strong>Deskripsi</strong>: Petugas Sarana melakukan pengisian form barang baru (elektronik), auto-generate kode barang, pengisian harga &amp; lokasi, dan penyimpanan data ke database Supabase.</p>

  <div class="step-desc">Tahap 1.1: Pengisian Form Identitas, Stok, &amp; Perolehan Barang Baru</div>
  <img class="screenshot-img" src="${getBase64Image('sit_01_form_tambah_barang.png')}" />

  <div class="step-desc">Tahap 1.2: Verifikasi Barang Baru Muncul di Daftar Inventaris (/inventaris/barang)</div>
  <img class="screenshot-img" src="${getBase64Image('sit_02_daftar_barang_terupdate.png')}" />

  <div class="page-break"></div>

  <!-- SCENARIO 2 & 3 -->
  <div class="scenario-title">SKENARIO 2 &amp; 3: Alur Integrasi Transaksi Peminjaman (Staff) ➔ Approval (Sarana)</div>
  <p><strong>Deskripsi</strong>: Staff mengajukan peminjaman barang inventaris ➔ Data tersimpan dengan status <em>Menunggu</em> ➔ Sarana membuka popup detail dan menyetujui peminjaman (status berubah menjadi <em>Dipinjam</em>).</p>

  <div class="step-desc">Tahap 2.1: Staff Memilih Unit &amp; Mengisi Form Peminjaman (/inventaris/peminjaman/baru)</div>
  <img class="screenshot-img" src="${getBase64Image('sit_03_form_pinjam_barang_staff.png')}" />

  <div class="step-desc">Tahap 2.2: Verifikasi Status Peminjaman Staff 'Menunggu' (/inventaris/peminjaman)</div>
  <img class="screenshot-img" src="${getBase64Image('sit_04_status_peminjaman_staff.png')}" />

  <div class="page-break"></div>

  <div class="step-desc">Tahap 3.1: Dashboard Sarana Menerima Pengajuan Peminjaman Baru</div>
  <img class="screenshot-img" src="${getBase64Image('sit_05_daftar_peminjaman_sarana.png')}" />

  <div class="step-desc">Tahap 3.2: Sarana Membuka Dialog Detail &amp; Menekan Tombol 'Setujui'</div>
  <img class="screenshot-img" src="${getBase64Image('sit_06_dialog_detail_peminjaman.png')}" />

  <div class="step-desc">Tahap 3.3: Verifikasi Status Peminjaman Berhasil Berubah Menjadi 'Dipinjam'</div>
  <img class="screenshot-img" src="${getBase64Image('sit_07_peminjaman_after_approval.png')}" />

  <div class="page-break"></div>

  <!-- SCENARIO 4 & 5 -->
  <div class="scenario-title">SKENARIO 4 &amp; 5: Stock Opname, Audit Log Mutasi, &amp; Export Laporan PDF</div>
  <p><strong>Deskripsi</strong>: Pengujian fitur pencocokan fisik stok barang (Stock Opname), verifikasi catatan audit perubahan stok (Mutasi Barang), dan pengujian generator laporan PDF.</p>

  <div class="step-desc">Tahap 4.1: Pengujian Antarmuka Stock Opname (/inventaris/stock-opname)</div>
  <img class="screenshot-img" src="${getBase64Image('sit_08_stock_opname_verification.png')}" />

  <div class="step-desc">Tahap 4.2: Audit Log Mutasi Barang Otomatis Tercatat (/inventaris/mutasi)</div>
  <img class="screenshot-img" src="${getBase64Image('sit_09_audit_mutasi_barang.png')}" />

  <div class="step-desc">Tahap 5.1: Pengujian Ekspor Laporan Inventaris PDF (/inventaris/laporan)</div>
  <img class="screenshot-img" src="${getBase64Image('sit_10_laporan_inventaris_pdf.png')}" />

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

  fs.copyFileSync(OUTPUT_PDF, OUTPUT_BRAIN_PDF);

  await browser.close();
  console.log(`SIT PDF successfully created at:\n1. ${OUTPUT_PDF}\n2. ${OUTPUT_BRAIN_PDF}`);
}

run().catch(err => {
  console.error('Error generating SIT PDF:', err);
  process.exit(1);
});
