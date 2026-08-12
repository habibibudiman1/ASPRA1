import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const DOWNLOAD_DIR = 'C:\\Users\\andra\\.gemini\\antigravity\\brain\\241ba063-4a32-49cf-bc86-8060811bbf7f';

async function testDownload() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  console.log('1. Logging in as Sarana...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'sarana@gmail.com');
  await page.fill('input[type="password"]', 'Password123!');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.click('button[type="submit"]')
  ]);

  console.log('2. Navigating to /inventaris/laporan...');
  await page.goto(`${BASE_URL}/inventaris/laporan`, { waitUntil: 'networkidle' });

  console.log('3. Clicking Export PDF button and waiting for browser download event...');
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 15000 }),
    page.click('button:has-text("Export PDF")')
  ]);

  const suggestedName = download.suggestedFilename();
  console.log(`✅ Download triggered! Suggested filename: ${suggestedName}`);

  const savePath = path.join(DOWNLOAD_DIR, suggestedName);
  await download.saveAs(savePath);
  console.log(`✅ PDF file saved successfully to: ${savePath}`);

  const stats = fs.statSync(savePath);
  console.log(`📄 Downloaded PDF File Size: ${stats.size} bytes`);

  await browser.close();
}

testDownload().catch(err => {
  console.error('❌ Download test error:', err);
  process.exit(1);
});
