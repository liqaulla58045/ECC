import puppeteer from 'puppeteer';

(async () => {
    console.log('Starting browser...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    console.log('Navigating to app...');
    await page.goto('http://localhost:5173');

    // Login
    console.log('Logging in...');
    await page.type('input[type="email"]', 'chairman@startupvarsity.com');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for Dashboard to load
    await page.waitForSelector('.db-sidebar', { timeout: 10000 });

    // Click on AI Assistant sidebar link
    console.log('Navigating to AI Assistant...');
    await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('.db-sidebar-link'));
        const aiLink = links.find(el => el.textContent.includes('AI Assistant'));
        if (aiLink) aiLink.click();
    });

    // Wait for AI Assistant to load and take a screenshot
    console.log('Waiting for AI Assistant panel...');
    await page.waitForSelector('.cb-root', { timeout: 10000 });

    // Slight delay to ensure animations finish
    await new Promise(r => setTimeout(r, 1000));

    const screenshotPath = 'C:\\Users\\Sinchana Hegde\\.gemini\\antigravity\\brain\\eff25c09-8021-4267-be67-5f620ac284f3\\ai_assistant_full_page.webp';
    await page.screenshot({ path: screenshotPath, type: 'webp' });
    console.log('Saved screenshot to:', screenshotPath);

    await browser.close();
    console.log('Done!');
})().catch(err => {
    console.error(err);
    process.exit(1);
});
