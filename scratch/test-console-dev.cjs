const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', async msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', error => {
    console.log(`[pageerror] ${error.message}`);
  });
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(5000);
  await browser.close();
})();
