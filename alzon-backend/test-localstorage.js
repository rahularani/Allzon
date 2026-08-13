const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/login');
  await page.fill('input[placeholder*="9000000003"]', '9000000003');
  await page.fill('input[type="password"]', 'Password@123');
  await Promise.all([
    page.waitForResponse(r => r.url().includes('/auth/login')),
    page.click('button[type="submit"]')
  ]);
  const ls = await page.evaluate(() => JSON.stringify(localStorage));
  console.log("LocalStorage:", ls);
  await browser.close();
})();
