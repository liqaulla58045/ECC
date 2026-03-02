const { chromium } = require('playwright');
const path = require('path');

(async () => {
    console.log('Starting browser...');
    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await context.newPage();

    console.log('Navigating to app...');
    await page.goto('http://localhost:5173');

    // Login
    console.log('Logging in...');
    await page.fill('input[type="email"]', 'chairman@startupvarsity.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for Dashboard to load
    await page.waitForSelector('.db-sidebar', { timeout: 10000 });

    // Click on AI Assistant sidebar link
    console.log('Navigating to AI Assistant...');
    await page.click('text=AI Assistant');

    // Wait for AI Assistant to load and take a screenshot
    console.log('Waiting for AI Assistant panel...');
    await page.waitForSelector('.cb-root', { timeout: 10000 });

    // Slight delay to ensure animations finish
    await page.waitForTimeout(1000);

    const screenshotPath = path.join(process.cwd(), '..', '..', '.gemini', 'antigravity', 'brain', 'eff25c09-8021-4267-be67-5f620ac284f3', 'ai_assistant_full_page.webp');
    await page.screenshot({ path: screenshotPath });
    console.log('Saved screenshot to:', screenshotPath);

    await browser.close();
    console.log('Done!');
})().catch(err => {
    console.error(err);
    process.exit(1);
});
