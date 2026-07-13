const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('response', response => {
    console.log(`[${response.status()}] ${response.url()}`);
  });
  await page.goto('http://localhost:3001');
  await page.waitForTimeout(3000);
  await browser.close();
})();
