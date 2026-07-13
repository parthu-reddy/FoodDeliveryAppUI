const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', error => {
    console.log(`[pageerror] ${error.message}`);
  });
  await page.goto('http://localhost:3001');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshot.png' });
  await browser.close();
})();
