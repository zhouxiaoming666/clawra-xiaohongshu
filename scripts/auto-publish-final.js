const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const COOKIES_FILE = path.join(__dirname, '../storage/cookies.json');
const QR_DIR = path.join(__dirname, '../qrcode');

// 发布内容配置
const POSTS = [
    {
        photos: [
            '/tmp/scarlett_01_bikini_final.png',
            '/tmp/scarlett_02_office_final.png',
            '/tmp/scarlett_03_sports_final.png'
        ],
        title: '💋 斯嘉丽的夏日穿搭合集',
        desc: `📏 身高：170cm\n👗 三围：37E-100cm 完美 S 曲线\n\n今日分享 3 套不同风格的穿搭～\n\nLOOK 1️⃣：比基尼海滩风 🏖️\nLOOK 2️⃣：职业 OL 风 💼\nLOOK 3️⃣：运动健身风 🏋️‍♀️\n\n展现自信美丽的自己！✨\n\n#每日穿搭 #OOTD #穿搭分享 #新疆美女 #身材管理 #夏日穿搭`
    }
];

(async () => {
    console.log('📕 小红书自动化发布 - 最终版\n');
    
    // 确保目录存在
    if (!fs.existsSync(QR_DIR)) fs.mkdirSync(QR_DIR, { recursive: true });
    const storageDir = path.join(__dirname, '../storage');
    if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });
    
    const browser = await chromium.launch({
        headless: true,
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-gpu']
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
    
    // ========== 登录流程 ==========
    console.log('【1/4】登录小红书...');
    await page.goto('https://www.xiaohongshu.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    // 点击登录
    try {
        const loginBtn = await page.$('button:has-text("登录")');
        if (loginBtn) {
            await loginBtn.click();
            console.log('✓ 点击登录按钮');
            await page.waitForTimeout(5000);
        }
    } catch (e) {}
    
    // 切换到二维码登录
    try {
        const qrToggle = await page.$('span:has-text("二维码"), img[src*="qr"]');
        if (qrToggle) {
            await qrToggle.click();
            console.log('✓ 切换到二维码登录');
            await page.waitForTimeout(3000);
        }
    } catch (e) {}
    
    await page.waitForTimeout(3000);
    
    // 截图二维码
    await page.screenshot({ path: path.join(QR_DIR, 'login-qr.png') });
    try {
        const qrEl = await page.$('canvas');
        if (qrEl) {
            await qrEl.screenshot({ path: path.join(QR_DIR, 'login-qr-code.png') });
        }
    } catch (e) {}
    
    console.log('\n📱 二维码已生成，请扫码登录（180 秒）...\n');
    
    // 等待扫码
    let loggedIn = false;
    for (let i = 0; i < 36; i++) {
        await page.waitForTimeout(5000);
        const url = page.url();
        
        if (!url.includes('login') && !url.includes('captcha')) {
            console.log('✓ 扫码成功！');
            console.log('  URL:', url);
            loggedIn = true;
            
            // 保存 cookies
            const cookies = await context.cookies();
            fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookies, null, 2));
            console.log('✓ Cookies 已保存:', cookies.length, '个\n');
            break;
        }
    }
    
    if (!loggedIn) {
        console.log('❌ 等待超时，未检测到登录');
        await browser.close();
        process.exit(1);
    }
    
    // ========== 导航到发布页面 ==========
    console.log('【2/4】导航到创作者中心...');
    await page.goto('https://creator.xiaohongshu.com/publish/publish', { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
    });
    await page.waitForTimeout(10000);
    
    const publishUrl = page.url();
    console.log('当前 URL:', publishUrl);
    
    if (publishUrl.includes('login')) {
        console.log('⚠️  创作者中心需要额外验证，尝试从首页进入...');
        await page.goto('https://www.xiaohongshu.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(3000);
        
        // 尝试找到发布入口
        try {
            const publishLink = await page.$('a[href*="publish"], a[href*="creator"]');
            if (publishLink) {
                await publishLink.click();
                await page.waitForTimeout(5000);
            }
        } catch (e) {}
    }
    
    // 截图当前页面
    await page.screenshot({ path: '/tmp/publish-page.png' });
    console.log('✓ 页面截图：/tmp/publish-page.png\n');
    
    // ========== 发布内容 ==========
    console.log('【3/4】发布内容...');
    const post = POSTS[0];
    
    // 检查照片
    console.log('检查照片文件...');
    for (const photo of post.photos) {
        if (fs.existsSync(photo)) {
            console.log('✓', path.basename(photo));
        } else {
            console.log('✗', path.basename(photo), '(不存在)');
        }
    }
    
    // 上传照片
    console.log('\n上传照片...');
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
        await fileInput.setInputFiles(post.photos);
        console.log('✓ 已上传', post.photos.length, '张照片');
        await page.waitForTimeout(8000);  // 等待上传完成
    } else {
        console.log('⚠️  未找到文件输入框，尝试点击上传区域...');
        // 尝试点击上传区域
        const uploadArea = await page.$('[class*="upload"], [class*="Upload"], .upload-btn');
        if (uploadArea) {
            await uploadArea.click();
            await page.waitForTimeout(2000);
            const fileInput2 = await page.$('input[type="file"]');
            if (fileInput2) {
                await fileInput2.setInputFiles(post.photos);
                console.log('✓ 照片上传成功');
                await page.waitForTimeout(8000);
            }
        }
    }
    
    // 输入标题
    console.log('\n输入标题...');
    const titleInput = await page.$('input[placeholder*="标题"], input[placeholder*="title"], input[class*="title"]');
    if (titleInput) {
        await titleInput.fill(post.title);
        console.log('✓ 标题已输入:', post.title);
    } else {
        console.log('⚠️  未找到标题输入框');
    }
    
    await page.waitForTimeout(1000);
    
    // 输入内容
    console.log('\n输入正文...');
    const contentInput = await page.$('textarea[placeholder*="正文"], textarea[placeholder*="分享"], textarea[placeholder*="content"], [contenteditable="true"]');
    if (contentInput) {
        await contentInput.fill(post.desc);
        console.log('✓ 正文已输入');
    } else {
        console.log('⚠️  未找到内容输入框');
    }
    
    await page.waitForTimeout(2000);
    
    // 查找发布按钮
    console.log('\n查找发布按钮...');
    const publishBtn = await page.$('button:has-text("发布"), button:has-text("Publish"), [class*="publish-btn"]');
    if (publishBtn) {
        console.log('✓ 找到发布按钮');
        // 实际发布时取消下面这行的注释
        // await publishBtn.click();
        console.log('⚠️  演示模式：未实际点击发布按钮');
    } else {
        console.log('⚠️  未找到发布按钮');
    }
    
    // ========== 完成 ==========
    console.log('\n【4/4】完成！');
    
    // 更新 cookies
    const newCookies = await context.cookies();
    fs.writeFileSync(COOKIES_FILE, JSON.stringify(newCookies, null, 2));
    console.log('✓ Cookies 已更新:', newCookies.length, '个');
    
    await browser.close();
    console.log('\n✅ 发布流程完成！');
})();
