const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/login');
  await page.fill('input[placeholder*="9000000003"]', '9000000003');
  await page.fill('input[type="password"]', 'Password@123');
  
  await Promise.all([
    page.waitForURL('**/dashboard'),
    page.click('button[type="submit"]')
  ]);
  
  const ls = await page.evaluate(() => JSON.stringify(localStorage));
  console.log("LocalStorage after login:", ls);
  
  const ss = await page.evaluate(() => JSON.stringify(sessionStorage));
  console.log("SessionStorage after login:", ss);
  
  await browser.close();
})();
