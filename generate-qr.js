const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const QR_DIR = path.join(__dirname, 'qrcode');
const COOKIES_FILE = path.join(__dirname, 'storage', 'cookies.json');

// 确保目录存在
if (!fs.existsSync(QR_DIR)) fs.mkdirSync(QR_DIR, { recursive: true });
const storageDir = path.join(__dirname, 'storage');
if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });

console.log('启动浏览器...');

(async () => {
    const browser = await chromium.launch({
        headless: true,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-blink-features=AutomationControlled']
    });
    
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        locale: 'zh-CN',
        timezoneId: 'Asia/Shanghai'
    });
    
    await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });
    
    const page = await context.newPage();
    
    console.log('访问小红书...');
    await page.goto('https://www.xiaohongshu.com/', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    
    // 尝试点击登录
    try {
        const loginBtn = await page.$('button:has-text("登录"), .login-button');
        if (loginBtn) {
            await loginBtn.click();
            console.log('✓ 点击登录按钮');
            await page.waitForTimeout(3000);
        }
    } catch (e) {}
    
    // 截图
    console.log('截取二维码...');
    const qrPath = path.join(QR_DIR, 'login-qr.png');
    await page.screenshot({ path: qrPath, fullPage: true });
    console.log(`✓ 二维码已保存：${qrPath}`);
    
    // 尝试找二维码元素
    try {
        const qrEl = await page.$('canvas, img[src*="qr"], .qrcode');
        if (qrEl) {
            const qrCodePath = path.join(QR_DIR, 'login-qr-code.png');
            await qrEl.screenshot({ path: qrCodePath });
            console.log(`✓ 二维码特写：${qrCodePath}`);
        }
    } catch (e) {}
    
    console.log('\n========================================');
    console.log('二维码已生成，请扫码登录');
    console.log('等待 5 分钟...');
    console.log('========================================\n');
    
    // 等待登录
    try {
        await page.waitForFunction(() => {
            const url = window.location.href;
            return url.includes('/explore/') || url.includes('/user/') || url.includes('/creator');
        }, { timeout: 300000 });
        console.log('✓ 检测到登录！');
    } catch (e) {
        console.log('⚠ 等待超时');
    }
    
    // 保存 cookies
    const cookies = await context.cookies();
    if (cookies.length > 0) {
        fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookies, null, 2));
        console.log(`\n✓ Cookies 已保存：${COOKIES_FILE} (${cookies.length} 个)`);
    }
    
    await browser.close();
    console.log('\n✅ 完成！');
})();
