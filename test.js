const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('PAGE ERROR LOG:', msg.text());
    }
  });
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
  });
  
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  
  const content = await page.content();
  if (content.includes('Reconnecting to your session')) {
    console.log('Found Reconnecting to your session...');
    // Extract the runtime error we added
    const errorText = await page.evaluate(() => {
      const el = document.querySelector('.bg-destructive\\/10');
      return el ? el.innerText : null;
    });
    console.log('EXTRACTED ERROR FROM DOM:', errorText);
  }
  
  await browser.close();
})();
