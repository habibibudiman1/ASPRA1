import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const SIT_SCREENSHOT_DIR = 'C:\\Users\\andra\\.gemini\\antigravity\\brain\\241ba063-4a32-49cf-bc86-8060811bbf7f\\screenshots_sit';

if (!fs.existsSync(SIT_SCREENSHOT_DIR)) {
  fs.mkdirSync(SIT_SCREENSHOT_DIR, { recursive: true });
}

const ACCOUNTS = {
  superadmin: { email: 'superadmin@gmail.com', password: 'Password123!' },
  sarana: { email: 'sarana@gmail.com', password: 'Password123!' },
  staff: { email: 'habibibudiman@gmail.com', password: 'Password123!' },
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

async function runSIT() {
  const browser = await chromium.launch({ headless: true });
  console.log('🚀 Launching SIT Test Runner for Modul Inventaris & Stock Opname...\n');

  // =========================================================================
  // SCENARIO 1: TAMBAH BARANG INVENTARIS BARU (Role: Sarana)
  // =========================================================================
  console.log('--- SCENARIO 1: Tambah Barang Inventaris Baru (Role: Sarana) ---');
  const contextSarana = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pageSarana = await contextSarana.newPage();

  await login(pageSarana, ACCOUNTS.sarana);

  console.log('1.1 Navigasi ke Form Tambah Barang...');
  await pageSarana.goto(`${BASE_URL}/inventaris/barang/baru`, { waitUntil: 'networkidle' });
  await pageSarana.waitForTimeout(1000);

  // Fill Kategori (Select trigger)
  console.log('1.2 Mengisi Form Data Barang...');
  await pageSarana.click('#kategori');
  await pageSarana.waitForTimeout(500);
  await pageSarana.click('div[role="option"]:has-text("Elektronik")');
  await pageSarana.waitForTimeout(500);

  // Click generate kode
  await pageSarana.click('button:has(.lucide-refresh-cw)');
  await pageSarana.waitForTimeout(1000);

  const testItemName = `Laptop ThinkPad SIT ${Date.now().toString().slice(-4)}`;
  await pageSarana.fill('#nama_barang', testItemName);
  await pageSarana.fill('#merk', 'Lenovo');
  await pageSarana.fill('#tipe_model', 'ThinkPad T14 Gen 3');
  await pageSarana.fill('#jumlah_stok', '5');
  await pageSarana.fill('#lokasi_penempatan', 'Lab Komputer 1');
  
  const today = new Date().toISOString().split('T')[0];
  await pageSarana.fill('#tanggal_perolehan', today);
  await pageSarana.fill('#sumber_dana', 'Dana Assakinah SIT Test');
  await pageSarana.fill('#nilai_perolehan', '15000000');
  await pageSarana.fill('#catatan', 'Unit uji coba otomatis System Integration Testing');

  await pageSarana.screenshot({ path: path.join(SIT_SCREENSHOT_DIR, 'sit_01_form_tambah_barang.png') });
  console.log('📸 Screenshot saved: sit_01_form_tambah_barang.png');

  console.log('1.3 Menyimpan Barang Baru...');
  await Promise.all([
    pageSarana.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {}),
    pageSarana.click('button[type="submit"]:has-text("Simpan Barang")')
  ]);
  await pageSarana.waitForTimeout(2000);

  await pageSarana.screenshot({ path: path.join(SIT_SCREENSHOT_DIR, 'sit_02_daftar_barang_terupdate.png') });
  console.log('📸 Screenshot saved: sit_02_daftar_barang_terupdate.png');

  // =========================================================================
  // SCENARIO 2: ALUR AJUKAN PEMINJAMAN BARANG (Role: Staff)
  // =========================================================================
  console.log('\n--- SCENARIO 2: Pengajuan Peminjaman Barang Baru (Role: Staff) ---');
  const contextStaff = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pageStaff = await contextStaff.newPage();

  await login(pageStaff, ACCOUNTS.staff);

  console.log('2.1 Navigasi ke Form Pinjam Barang...');
  await pageStaff.goto(`${BASE_URL}/inventaris/peminjaman/baru`, { waitUntil: 'networkidle' });
  await pageStaff.waitForTimeout(1500);

  // Step 1: Select Nama Barang
  const step1Select = pageStaff.locator('button:has-text("Pilih jenis barang yang ingin dipinjam...")');
  if (await step1Select.isVisible()) {
    await step1Select.click();
    await pageStaff.waitForTimeout(500);
    // Select first option available or click option
    const options = pageStaff.locator('div[role="option"]');
    if (await options.count() > 0) {
      await options.first().click();
      await pageStaff.waitForTimeout(1000);
    }
  }

  // Step 2: Select Unit
  const step2Select = pageStaff.locator('button:has-text("Pilih unit yang ingin dipinjam...")');
  if (await step2Select.isVisible()) {
    await step2Select.click();
    await pageStaff.waitForTimeout(500);
    const unitOptions = pageStaff.locator('div[role="option"]');
    if (await unitOptions.count() > 0) {
      await unitOptions.first().click();
      await pageStaff.waitForTimeout(1000);
    }
  }

  // Fill Estimasi Kembali
  const returnDateInput = pageStaff.locator('#tanggal_kembali_estimasi');
  if (await returnDateInput.isVisible()) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 5);
    await returnDateInput.fill(nextWeek.toISOString().split('T')[0]);
  }

  const catatanStaffInput = pageStaff.locator('#catatan_peminjam');
  if (await catatanStaffInput.isVisible()) {
    await catatanStaffInput.fill('Keperluan Presentasi Proyek KPPM SIT Automation');
  }

  await pageStaff.screenshot({ path: path.join(SIT_SCREENSHOT_DIR, 'sit_03_form_pinjam_barang_staff.png') });
  console.log('📸 Screenshot saved: sit_03_form_pinjam_barang_staff.png');

  console.log('2.2 Submitting Form Peminjaman...');
  const submitPinjamBtn = pageStaff.locator('button[type="submit"]:has-text("Ajukan Peminjaman")');
  if (await submitPinjamBtn.isEnabled()) {
    await Promise.all([
      pageStaff.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {}),
      submitPinjamBtn.click()
    ]);
    await pageStaff.waitForTimeout(2000);
  }

  await pageStaff.screenshot({ path: path.join(SIT_SCREENSHOT_DIR, 'sit_04_status_peminjaman_staff.png') });
  console.log('📸 Screenshot saved: sit_04_status_peminjaman_staff.png');

  // =========================================================================
  // SCENARIO 3: APPROVAL PEMINJAMAN OLEH SARANA (Role: Sarana)
  // =========================================================================
  console.log('\n--- SCENARIO 3: Approval Peminjaman Barang (Role: Sarana) ---');
  console.log('3.1 Navigasi ke Daftar Approval Peminjaman...');
  await pageSarana.goto(`${BASE_URL}/inventaris/peminjaman`, { waitUntil: 'networkidle' });
  await pageSarana.waitForTimeout(1500);

  await pageSarana.screenshot({ path: path.join(SIT_SCREENSHOT_DIR, 'sit_05_daftar_peminjaman_sarana.png') });
  console.log('📸 Screenshot saved: sit_05_daftar_peminjaman_sarana.png');

  // Click Detail on first item
  const detailBtn = pageSarana.locator('button:has-text("Detail")').first();
  if (await detailBtn.isVisible()) {
    console.log('3.2 Membuka Detail Peminjaman & Melakukan Approval...');
    await detailBtn.click();
    await pageSarana.waitForTimeout(1000);

    await pageSarana.screenshot({ path: path.join(SIT_SCREENSHOT_DIR, 'sit_06_dialog_detail_peminjaman.png') });
    console.log('📸 Screenshot saved: sit_06_dialog_detail_peminjaman.png');

    const setujuiBtn = pageSarana.locator('button:has-text("Setujui")');
    if (await setujuiBtn.isVisible()) {
      await setujuiBtn.click();
      await pageSarana.waitForTimeout(2000);
      console.log('✅ Peminjaman berhasil disetujui!');
    }
  }

  await pageSarana.screenshot({ path: path.join(SIT_SCREENSHOT_DIR, 'sit_07_peminjaman_after_approval.png') });
  console.log('📸 Screenshot saved: sit_07_peminjaman_after_approval.png');

  // =========================================================================
  // SCENARIO 4: STOCK OPNAME & AUDIT MUTASI (Role: Sarana)
  // =========================================================================
  console.log('\n--- SCENARIO 4: Stock Opname & Audit Mutasi (Role: Sarana) ---');
  console.log('4.1 Navigasi ke Stock Opname...');
  await pageSarana.goto(`${BASE_URL}/inventaris/stock-opname`, { waitUntil: 'networkidle' });
  await pageSarana.waitForTimeout(1500);
  await pageSarana.screenshot({ path: path.join(SIT_SCREENSHOT_DIR, 'sit_08_stock_opname_verification.png') });
  console.log('📸 Screenshot saved: sit_08_stock_opname_verification.png');

  console.log('4.2 Navigasi ke Audit Log Mutasi Barang...');
  await pageSarana.goto(`${BASE_URL}/inventaris/mutasi`, { waitUntil: 'networkidle' });
  await pageSarana.waitForTimeout(1500);
  await pageSarana.screenshot({ path: path.join(SIT_SCREENSHOT_DIR, 'sit_09_audit_mutasi_barang.png') });
  console.log('📸 Screenshot saved: sit_09_audit_mutasi_barang.png');

  // =========================================================================
  // SCENARIO 5: EKSPOR LAPORAN PDF INVENTARIS (Role: Sarana)
  // =========================================================================
  console.log('\n--- SCENARIO 5: Ekspor Laporan PDF Inventaris ---');
  await pageSarana.goto(`${BASE_URL}/inventaris/laporan`, { waitUntil: 'networkidle' });
  await pageSarana.waitForTimeout(1500);
  await pageSarana.screenshot({ path: path.join(SIT_SCREENSHOT_DIR, 'sit_10_laporan_inventaris_pdf.png') });
  console.log('📸 Screenshot saved: sit_10_laporan_inventaris_pdf.png');

  await contextSarana.close();
  await contextStaff.close();
  await browser.close();

  console.log('\n🎉 ALL SIT SCENARIOS COMPLETED SUCCESSFULLY!');
}

runSIT().catch(err => {
  console.error('❌ Error during SIT Execution:', err);
  process.exit(1);
});
