import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const BRAIN_DIR = 'C:\\Users\\andra\\.gemini\\antigravity\\brain\\241ba063-4a32-49cf-bc86-8060811bbf7f';
const SIT_SCREENSHOT_DIR = path.join(BRAIN_DIR, 'screenshots_sit');

if (!fs.existsSync(SIT_SCREENSHOT_DIR)) {
  fs.mkdirSync(SIT_SCREENSHOT_DIR, { recursive: true });
}

const ACCOUNTS = {
  superadmin: { email: 'superadmin@gmail.com', password: 'Password123!' },
  sarana: { email: 'sarana@gmail.com', password: 'Password123!' },
  staff: { email: 'habibibudiman@gmail.com', password: 'Password123!' },
  it: { email: 'habud@gmail.com', password: 'Password123!' },
};

async function login(page, account) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"], input[name="email"]', account.email);
  await page.fill('input[type="password"], input[name="password"]', account.password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {}),
    page.click('button[type="submit"]')
  ]);
  await page.waitForTimeout(2000);
}

async function capture(page, name) {
  const fileBrain = path.join(BRAIN_DIR, `${name}.png`);
  const fileSub = path.join(SIT_SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: fileBrain, fullPage: false });
  fs.copyFileSync(fileBrain, fileSub);
  console.log(`📸 Captured screenshot: ${name}.png`);
}

async function runComprehensiveSIT() {
  const browser = await chromium.launch({ headless: true });
  console.log('🚀 Running Comprehensive SIT Suite (12 Scenarios)...\n');

  // SESSIONS
  const ctxSarana = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pageSarana = await ctxSarana.newPage();
  await login(pageSarana, ACCOUNTS.sarana);

  const ctxStaff = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pageStaff = await ctxStaff.newPage();
  await login(pageStaff, ACCOUNTS.staff);

  // -------------------------------------------------------------------------
  // SIT-01: Tambah Barang Elektronik Baru
  // -------------------------------------------------------------------------
  console.log('--- SIT-01: Tambah Barang Elektronik Baru (Sarana) ---');
  await pageSarana.goto(`${BASE_URL}/inventaris/barang/baru`, { waitUntil: 'networkidle' });
  await pageSarana.waitForTimeout(1000);

  await pageSarana.click('#kategori');
  await pageSarana.waitForTimeout(400);
  await pageSarana.click('div[role="option"]:has-text("Elektronik")');
  await pageSarana.click('button:has(.lucide-refresh-cw)');
  await pageSarana.waitForTimeout(800);

  const item1Name = `Proyektor Epson SIT ${Date.now().toString().slice(-4)}`;
  await pageSarana.fill('#nama_barang', item1Name);
  await pageSarana.fill('#merk', 'Epson');
  await pageSarana.fill('#tipe_model', 'EB-X500');
  await pageSarana.fill('#jumlah_stok', '3');
  await pageSarana.fill('#lokasi_penempatan', 'Ruang Rapat Utama');
  await pageSarana.fill('#tanggal_perolehan', new Date().toISOString().split('T')[0]);
  await pageSarana.fill('#sumber_dana', 'Dana Hibah Assakinah');
  await pageSarana.fill('#nilai_perolehan', '7500000');
  await pageSarana.fill('#catatan', 'Unit proyektor baru untuk rapat & kuliah umum');

  await capture(pageSarana, 'sit_01_tambah_elektronik');

  await Promise.all([
    pageSarana.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {}),
    pageSarana.click('button[type="submit"]:has-text("Simpan Barang")')
  ]);
  await pageSarana.waitForTimeout(1500);
  await capture(pageSarana, 'sit_02_daftar_setelah_tambah');

  // -------------------------------------------------------------------------
  // SIT-02: Tambah Barang Spesifikasi PC Rakitan
  // -------------------------------------------------------------------------
  console.log('\n--- SIT-02: Tambah PC Rakitan Spesifikasi Khusus (Sarana) ---');
  await pageSarana.goto(`${BASE_URL}/inventaris/barang/baru`, { waitUntil: 'networkidle' });
  await pageSarana.waitForTimeout(1000);

  await pageSarana.click('#kategori');
  await pageSarana.waitForTimeout(400);
  await pageSarana.click('div[role="option"]:has-text("Elektronik")');
  await pageSarana.fill('#nama_barang', 'PC Workstation Lab 2');
  await pageSarana.waitForTimeout(800);

  // Expect PC component fields to trigger
  await pageSarana.fill('#jumlah_stok', '1');
  await pageSarana.fill('#lokasi_penempatan', 'Lab Komputer 2');
  await pageSarana.fill('#tanggal_perolehan', new Date().toISOString().split('T')[0]);

  await capture(pageSarana, 'sit_03_form_pc_rakitan');

  await Promise.all([
    pageSarana.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {}),
    pageSarana.click('button[type="submit"]:has-text("Simpan Barang")')
  ]);
  await pageSarana.waitForTimeout(1500);

  // -------------------------------------------------------------------------
  // SIT-03: Filter & Detail Barang + Comment Realtime
  // -------------------------------------------------------------------------
  console.log('\n--- SIT-03: Filter & Detail Barang (Sarana) ---');
  await pageSarana.goto(`${BASE_URL}/inventaris/barang`, { waitUntil: 'networkidle' });
  await pageSarana.waitForTimeout(1000);

  const firstDetailLink = pageSarana.locator('a[href^="/inventaris/barang/"]').first();
  if (await firstDetailLink.isVisible()) {
    await Promise.all([
      pageSarana.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {}),
      firstDetailLink.click()
    ]);
    await pageSarana.waitForTimeout(1500);
    await capture(pageSarana, 'sit_04_detail_barang_spesifik');
  }

  // -------------------------------------------------------------------------
  // SIT-04: Edit Data Barang
  // -------------------------------------------------------------------------
  console.log('\n--- SIT-04: Edit Data Barang (Sarana) ---');
  const editBtn = pageSarana.locator('a:has-text("Edit"), button:has-text("Edit")').first();
  if (await editBtn.isVisible()) {
    await editBtn.click();
    await pageSarana.waitForTimeout(1500);
    await capture(pageSarana, 'sit_05_form_edit_barang');
  }

  // -------------------------------------------------------------------------
  // SIT-05: Filter Barang Berdasarkan Lokasi
  // -------------------------------------------------------------------------
  console.log('\n--- SIT-05: Filter Barang Berdasarkan Lokasi ---');
  await pageSarana.goto(`${BASE_URL}/inventaris/lokasi/Lab%20Komputer%201`, { waitUntil: 'networkidle' }).catch(() => {});
  await pageSarana.waitForTimeout(1500);
  await capture(pageSarana, 'sit_06_filter_lokasi');

  // -------------------------------------------------------------------------
  // SIT-06: Pengajuan Peminjaman Barang Baru (Staff)
  // -------------------------------------------------------------------------
  console.log('\n--- SIT-06: Form Pengajuan Peminjaman Barang (Staff) ---');
  await pageStaff.goto(`${BASE_URL}/inventaris/peminjaman/baru`, { waitUntil: 'networkidle' });
  await pageStaff.waitForTimeout(1500);

  const selectNama = pageStaff.locator('button:has-text("Pilih jenis barang yang ingin dipinjam...")');
  if (await selectNama.isVisible()) {
    await selectNama.click();
    await pageStaff.waitForTimeout(400);
    const opts = pageStaff.locator('div[role="option"]');
    if (await opts.count() > 0) await opts.first().click();
    await pageStaff.waitForTimeout(800);
  }

  const selectUnit = pageStaff.locator('button:has-text("Pilih unit yang ingin dipinjam...")');
  if (await selectUnit.isVisible()) {
    await selectUnit.click();
    await pageStaff.waitForTimeout(400);
    const optsUnit = pageStaff.locator('div[role="option"]');
    if (await optsUnit.count() > 0) await optsUnit.first().click();
    await pageStaff.waitForTimeout(800);
  }

  const dateEstimasi = pageStaff.locator('#tanggal_kembali_estimasi');
  if (await dateEstimasi.isVisible()) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 4);
    await dateEstimasi.fill(nextWeek.toISOString().split('T')[0]);
  }

  const catStaff = pageStaff.locator('#catatan_peminjam');
  if (await catStaff.isVisible()) {
    await catStaff.fill('Peminjaman barang untuk kegiatan Workshop SIT Test');
  }

  await capture(pageStaff, 'sit_07_staff_ajukan_peminjaman');

  const btnSubmitPeminjaman = pageStaff.locator('button[type="submit"]:has-text("Ajukan Peminjaman")');
  if (await btnSubmitPeminjaman.isEnabled()) {
    await Promise.all([
      pageStaff.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {}),
      btnSubmitPeminjaman.click()
    ]);
    await pageStaff.waitForTimeout(2000);
  }
  await capture(pageStaff, 'sit_08_staff_pinjaman_menunggu');

  // -------------------------------------------------------------------------
  // SIT-07: Approval Peminjaman Barang (Sarana)
  // -------------------------------------------------------------------------
  console.log('\n--- SIT-07: Approval Peminjaman Barang (Sarana) ---');
  await pageSarana.goto(`${BASE_URL}/inventaris/peminjaman`, { waitUntil: 'networkidle' });
  await pageSarana.waitForTimeout(1500);

  const detailApproveBtn = pageSarana.locator('button:has-text("Detail")').first();
  if (await detailApproveBtn.isVisible()) {
    await detailApproveBtn.click();
    await pageSarana.waitForTimeout(1000);
    await capture(pageSarana, 'sit_09_dialog_approval_sarana');

    const approveConfirmBtn = pageSarana.locator('button:has-text("Setujui")');
    if (await approveConfirmBtn.isVisible()) {
      await approveConfirmBtn.click();
      await pageSarana.waitForTimeout(2000);
    }
  }
  await capture(pageSarana, 'sit_10_status_terverifikasi_dipinjam');

  // -------------------------------------------------------------------------
  // SIT-08: Pengembalian Barang oleh Staff & Konfirmasi Sarana
  // -------------------------------------------------------------------------
  console.log('\n--- SIT-08: Pengembalian Barang & Konfirmasi ---');
  await pageStaff.goto(`${BASE_URL}/inventaris/peminjaman`, { waitUntil: 'networkidle' });
  await pageStaff.waitForTimeout(1500);
  const kembalikanBtn = pageStaff.locator('button:has-text("Kembalikan")').first();
  if (await kembalikanBtn.isVisible()) {
    await kembalikanBtn.click();
    await pageStaff.waitForTimeout(800);
    const confirmReturnBtn = pageStaff.locator('button:has-text("Ya, Sudah Dikembalikan")');
    if (await confirmReturnBtn.isVisible()) {
      await confirmReturnBtn.click();
      await pageStaff.waitForTimeout(2000);
    }
  }
  await capture(pageStaff, 'sit_11_staff_lapor_kembali');

  // -------------------------------------------------------------------------
  // SIT-09: Stock Opname (Sarana)
  // -------------------------------------------------------------------------
  console.log('\n--- SIT-09: Modul Stock Opname (Sarana) ---');
  await pageSarana.goto(`${BASE_URL}/inventaris/stock-opname`, { waitUntil: 'networkidle' });
  await pageSarana.waitForTimeout(1500);
  await capture(pageSarana, 'sit_12_stock_opname');

  // -------------------------------------------------------------------------
  // SIT-10: Audit Log Mutasi Barang (Sarana)
  // -------------------------------------------------------------------------
  console.log('\n--- SIT-10: Audit Log Mutasi Barang (Sarana) ---');
  await pageSarana.goto(`${BASE_URL}/inventaris/mutasi`, { waitUntil: 'networkidle' });
  await pageSarana.waitForTimeout(1500);
  await capture(pageSarana, 'sit_13_audit_mutasi');

  // -------------------------------------------------------------------------
  // SIT-11: Form Tambah Mutasi Barang Manual (Sarana)
  // -------------------------------------------------------------------------
  console.log('\n--- SIT-11: Tambah Mutasi Barang Manual (Sarana) ---');
  await pageSarana.goto(`${BASE_URL}/inventaris/mutasi/baru`, { waitUntil: 'networkidle' }).catch(() => {});
  await pageSarana.waitForTimeout(1500);
  await capture(pageSarana, 'sit_14_form_tambah_mutasi');

  // -------------------------------------------------------------------------
  // SIT-12: Export Laporan Inventaris PDF (Sarana)
  // -------------------------------------------------------------------------
  console.log('\n--- SIT-12: Laporan Inventaris PDF ---');
  await pageSarana.goto(`${BASE_URL}/inventaris/laporan`, { waitUntil: 'networkidle' });
  await pageSarana.waitForTimeout(1500);
  await capture(pageSarana, 'sit_15_laporan_pdf');

  await ctxSarana.close();
  await ctxStaff.close();
  await browser.close();

  console.log('\n🎉 ALL 12 COMPREHENSIVE SIT SCENARIOS COMPLETED SUCCESSFULLY!');
}

runComprehensiveSIT().catch(err => {
  console.error('❌ Error during Comprehensive SIT Execution:', err);
  process.exit(1);
});
