const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/');
  const ls = await page.evaluate(() => JSON.stringify(localStorage));
  console.log("LocalStorage:", ls);
  await browser.close();
})();
