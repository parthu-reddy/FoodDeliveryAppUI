const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');
  // ... run exactly what CustomerRoutingUiTest does
  // wait wait, I can just write a quick playwright script to login as customer and see what happens when I click the button!
})();
