const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'dev-screenshot.png' });
  await browser.close();
})();
