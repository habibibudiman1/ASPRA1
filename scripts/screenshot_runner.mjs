import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'C:\\Users\\andra\\.gemini\\antigravity\\brain\\241ba063-4a32-49cf-bc86-8060811bbf7f\\screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const ROLES = [
  {
    name: 'super_admin',
    label: 'Super Admin',
    email: 'superadmin@gmail.com',
    password: 'Password123!',
    routes: [
      { name: 'superadmin_dashboard_inventaris', url: '/inventaris' },
      { name: 'superadmin_daftar_barang', url: '/inventaris/barang' },
      { name: 'superadmin_tambah_barang', url: '/inventaris/barang/baru' },
      { name: 'superadmin_stock_opname', url: '/inventaris/stock-opname' },
      { name: 'superadmin_mutasi', url: '/inventaris/mutasi' },
      { name: 'superadmin_laporan', url: '/inventaris/laporan' }
    ]
  },
  {
    name: 'sarana',
    label: 'Sarana',
    email: 'sarana@gmail.com',
    password: 'Password123!',
    routes: [
      { name: 'sarana_dashboard_inventaris', url: '/inventaris' },
      { name: 'sarana_daftar_barang', url: '/inventaris/barang' },
      { name: 'sarana_stock_opname', url: '/inventaris/stock-opname' },
      { name: 'sarana_mutasi_barang', url: '/inventaris/mutasi' },
      { name: 'sarana_approval_peminjaman', url: '/inventaris/peminjaman' }
    ]
  },
  {
    name: 'it',
    label: 'IT Admin',
    email: 'habud@gmail.com',
    password: 'Password123!',
    routes: [
      { name: 'it_dashboard', url: '/dashboard' },
      { name: 'it_daftar_barang', url: '/inventaris/barang' },
      { name: 'it_tickets', url: '/tickets' }
    ]
  },
  {
    name: 'staff',
    label: 'Staff',
    email: 'habibibudiman@gmail.com',
    password: 'Password123!',
    routes: [
      { name: 'staff_daftar_barang', url: '/inventaris/barang' },
      { name: 'staff_pinjam_barang_baru', url: '/inventaris/peminjaman/baru' },
      { name: 'staff_pinjaman_saya', url: '/inventaris/peminjaman' }
    ]
  }
];

async function run() {
  const browser = await chromium.launch({ headless: true });
  console.log('Browser launched');

  for (const role of ROLES) {
    console.log(`\n=== Testing Role: ${role.label} (${role.email}) ===`);
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    // Go to login page
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"], input[name="email"]', role.email);
    await page.fill('input[type="password"], input[name="password"]', role.password);
    
    // Click submit/login
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {}),
      page.click('button[type="submit"]')
    ]);

    await page.waitForTimeout(2000);

    for (const route of role.routes) {
      console.log(`Visiting [${role.label}] ${route.url}...`);
      await page.goto(`${BASE_URL}${route.url}`, { waitUntil: 'networkidle' }).catch(() => {});
      await page.waitForTimeout(1500);

      const filePath = path.join(SCREENSHOT_DIR, `${route.name}.png`);
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`Saved screenshot: ${filePath}`);
    }

    await context.close();
  }

  await browser.close();
  console.log('\nAll screenshots captured successfully!');
}

run().catch(err => {
  console.error('Error running screenshot test:', err);
  process.exit(1);
});
