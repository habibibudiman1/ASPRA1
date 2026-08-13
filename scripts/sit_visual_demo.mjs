import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';

const ACCOUNTS = {
  sarana: { email: 'sarana@gmail.com', password: 'Password123!' },
  staff: { email: 'habibibudiman@gmail.com', password: 'Password123!' },
};

async function login(page, account) {
  console.log(`🔑 Logging in as ${account.email}...`);
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"], input[name="email"]', account.email);
  await page.fill('input[type="password"], input[name="password"]', account.password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {}),
    page.click('button[type="submit"]')
  ]);
  await page.waitForTimeout(1500);
}

async function runVisualSIT() {
  console.log('🚀 Launching VISUAL AUTOMATED SIT DEMO (Headful Browser)...');
  console.log('💡 Browser window will pop up on your screen and execute all scenarios automatically!\n');

  // Launch HEADFUL browser with slowMo so you can watch live!
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1200, // 1.2 second delay between actions for comfortable viewing
  });

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // -------------------------------------------------------------------------
  // SCENARIO 1: MANAJEMEN INVENTARIS & TAMBAH BARANG (ROLE: SARANA)
  // -------------------------------------------------------------------------
  console.log('📌 [1/5] LOGIN & TAMBAH BARANG BARU (Role: Sarana)');
  await login(page, ACCOUNTS.sarana);

  console.log('➜ Opening /inventaris/barang...');
  await page.goto(`${BASE_URL}/inventaris/barang`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  console.log('➜ Navigating to Form Tambah Barang (/inventaris/barang/baru)...');
  await page.goto(`${BASE_URL}/inventaris/barang/baru`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  console.log('➜ Selecting Kategori Elektronik & Auto-Generate Kode...');
  await page.click('#kategori');
  await page.click('div[role="option"]:has-text("Elektronik")');
  await page.click('button:has(.lucide-refresh-cw)');
  await page.waitForTimeout(1000);

  const demoName = `Laptop Lenovo ThinkPad Visual ${Date.now().toString().slice(-4)}`;
  console.log(`➜ Filling Item Form: ${demoName}...`);
  await page.fill('#nama_barang', demoName);
  await page.fill('#merk', 'Lenovo');
  await page.fill('#tipe_model', 'ThinkPad T14 Gen 3');
  await page.fill('#jumlah_stok', '5');
  await page.fill('#lokasi_penempatan', 'Lab Komputer 1');
  await page.fill('#tanggal_perolehan', new Date().toISOString().split('T')[0]);
  await page.fill('#sumber_dana', 'Dana Assakinah Visual Demo');
  await page.fill('#nilai_perolehan', '15000000');
  await page.fill('#catatan', 'Unit baru uji coba otomatis visual browser');

  console.log('➜ Submitting Form (Saving Item)...');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {}),
    page.click('button[type="submit"]:has-text("Simpan Barang")')
  ]);
  await page.waitForTimeout(2000);

  // -------------------------------------------------------------------------
  // SCENARIO 2: PENGAJUAN PEMINJAMAN (ROLE: STAFF)
  // -------------------------------------------------------------------------
  console.log('\n📌 [2/5] PENGAJUAN PEMINJAMAN BARANG (Role: Staff)');
  await login(page, ACCOUNTS.staff);

  console.log('➜ Navigating to Form Pinjam Barang (/inventaris/peminjaman/baru)...');
  await page.goto(`${BASE_URL}/inventaris/peminjaman/baru`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  console.log('➜ Selecting Barang & Unit...');
  const selectNama = page.locator('button:has-text("Pilih jenis barang yang ingin dipinjam...")');
  if (await selectNama.isVisible()) {
    await selectNama.click();
    const opts = page.locator('div[role="option"]');
    if (await opts.count() > 0) await opts.first().click();
  }

  const selectUnit = page.locator('button:has-text("Pilih unit yang ingin dipinjam...")');
  if (await selectUnit.isVisible()) {
    await selectUnit.click();
    const optsUnit = page.locator('div[role="option"]');
    if (await optsUnit.count() > 0) await optsUnit.first().click();
  }

  const dateEstimasi = page.locator('#tanggal_kembali_estimasi');
  if (await dateEstimasi.isVisible()) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 5);
    await dateEstimasi.fill(nextWeek.toISOString().split('T')[0]);
  }

  const catStaff = page.locator('#catatan_peminjam');
  if (await catStaff.isVisible()) {
    await catStaff.fill('Keperluan Rapat Akademik - Visual Demo Testing');
  }

  console.log('➜ Submitting Peminjaman Request...');
  const submitBtn = page.locator('button[type="submit"]:has-text("Ajukan Peminjaman")');
  if (await submitBtn.isEnabled()) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {}),
      submitBtn.click()
    ]);
    await page.waitForTimeout(2000);
  }

  // -------------------------------------------------------------------------
  // SCENARIO 3: APPROVAL PEMINJAMAN (ROLE: SARANA)
  // -------------------------------------------------------------------------
  console.log('\n📌 [3/5] APPROVAL PEMINJAMAN BARANG (Role: Sarana)');
  await login(page, ACCOUNTS.sarana);

  console.log('➜ Opening Approval Dashboard (/inventaris/peminjaman)...');
  await page.goto(`${BASE_URL}/inventaris/peminjaman`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('➜ Opening Detail Dialog...');
  const detailBtn = page.locator('button:has-text("Detail")').first();
  if (await detailBtn.isVisible()) {
    await detailBtn.click();
    await page.waitForTimeout(1500);

    console.log('➜ Clicking SETUJUI (Approve)...');
    const setujuiBtn = page.locator('button:has-text("Setujui")');
    if (await setujuiBtn.isVisible()) {
      await setujuiBtn.click();
      await page.waitForTimeout(2500);
    }
  }

  // -------------------------------------------------------------------------
  // SCENARIO 4: STOCK OPNAME & AUDIT MUTASI
  // -------------------------------------------------------------------------
  console.log('\n📌 [4/5] VERIFIKASI STOCK OPNAME & AUDIT MUTASI');
  console.log('➜ Navigating to /inventaris/stock-opname...');
  await page.goto(`${BASE_URL}/inventaris/stock-opname`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('➜ Navigating to /inventaris/mutasi (Audit Log)...');
  await page.goto(`${BASE_URL}/inventaris/mutasi`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // -------------------------------------------------------------------------
  // SCENARIO 5: EKSPOR LAPORAN PDF INVENTARIS
  // -------------------------------------------------------------------------
  console.log('\n📌 [5/5] TESTING EKSPOR LAPORAN PDF INVENTARIS');
  await page.goto(`${BASE_URL}/inventaris/laporan`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  console.log('➜ Clicking Export PDF Button...');
  const exportBtn = page.locator('button:has-text("Export PDF")');
  if (await exportBtn.isVisible()) {
    await exportBtn.click();
    await page.waitForTimeout(3000);
  }

  console.log('\n🎉 VISUAL AUTOMATED DEMO COMPLETE! Closing browser in 3 seconds...');
  await page.waitForTimeout(3000);
  await browser.close();
}

runVisualSIT().catch(err => {
  console.error('❌ Error during Visual SIT:', err);
  process.exit(1);
});
