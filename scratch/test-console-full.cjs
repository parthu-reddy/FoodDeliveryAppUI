const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', async msg => {
    const args = msg.args();
    for (const arg of args) {
      console.log(await arg.jsonValue());
    }
  });
  page.on('pageerror', error => {
    console.log('[pageerror]', error);
  });
  await page.goto('http://localhost:3001');
  await page.waitForTimeout(3000);
  await browser.close();
})();
