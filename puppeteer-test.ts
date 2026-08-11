import puppeteer from 'puppeteer';

(async () => {
  console.log("Starting Puppeteer check for http://localhost:8080/");
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });

  let reachedDashboard = false;
  let testOwnerSessionCreated = false;

  try {
    const response = await page.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log("Page HTTP Status:", response?.status());

    // Wait a moment for rendering and auth bypass
    await new Promise(r => setTimeout(r, 3000));

    const currentUrl = page.url();
    console.log("Current URL after load:", currentUrl);
    
    // Check if we hit dashboard instead of login
    if (currentUrl.endsWith("/") || currentUrl.includes("/dashboard")) {
      reachedDashboard = true;
    }

    const html = await page.content();
    if (html.includes("Test Owner") || html.includes("test-owner@local.test")) {
      testOwnerSessionCreated = true;
    }

    // Try routing to /login, should redirect to /
    await page.goto('http://localhost:8080/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    const urlAfterLogin = page.url();
    console.log("/login Route redirected to:", urlAfterLogin);

    // Try routing to /settings
    await page.goto('http://localhost:8080/settings', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    const htmlSettings = await page.content();
    console.log("Settings Route accessible:", htmlSettings.includes("Settings") && !page.url().includes("/login"));

    // Try routing to /admin
    await page.goto('http://localhost:8080/admin', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    const htmlAdmin = await page.content();
    console.log("Admin Route accessible:", htmlAdmin.includes("Admin") && !page.url().includes("/login"));

    console.log("Reached Dashboard:", reachedDashboard);

    // Check if DEV_TEST_MODE logic fired by checking for "Test Owner" in the DOM
    const hasTestOwner = await page.evaluate(() => {
      return document.body.innerText.includes('Test Owner') || document.body.innerText.includes('test-owner@local.test');
    });

    console.log("Test Owner Session Created:", hasTestOwner);
    
    console.log("Console Errors:", consoleErrors.length > 0 ? consoleErrors : "None");
    
  } catch (err) {
    console.error("Test script failed:", err);
  } finally {
    await browser.close();
  }
})();
