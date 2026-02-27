const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const COOKIES_FILE = path.join(__dirname, '../storage/cookies.json');

// 照片和文案
const POSTS = [
    { 
        photos: [
            '/tmp/scarlett_01_bikini_final.png',
            '/tmp/scarlett_02_office_final.png',
            '/tmp/scarlett_03_sports_final.png'
        ],
        title: '💋 斯嘉丽的夏日穿搭合集 | 3 套 LOOK 分享',
        desc: `📏 身高：170cm\n👗 三围：37E-100cm 完美 S 曲线\n\n今日分享 3 套不同风格的穿搭～\n\nLOOK 1️⃣：比基尼海滩风 🏖️\nLOOK 2️⃣：职业 OL 风 💼\nLOOK 3️⃣：运动健身风 🏋️‍♀️\n\n展现自信美丽的自己！✨\n\n#每日穿搭 #OOTD #穿搭分享 #新疆美女 #身材管理 #夏日穿搭 #多风格穿搭`
    }
];

(async () => {
    console.log('🚀 启动小红书发布...\n');
    
    // 加载 cookies
    let cookies = [];
    if (fs.existsSync(COOKIES_FILE)) {
        cookies = JSON.parse(fs.readFileSync(COOKIES_FILE, 'utf-8'));
        console.log(`✓ 加载了 ${cookies.length} 个 cookies\n`);
    }
    
    console.log('启动浏览器（无头模式）...');
    const browser = await chromium.launch({
        headless: true,  // 无头模式
        args: ['--window-size=1920,1080', '--no-sandbox', '--disable-gpu']
    });
    
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        locale: 'zh-CN',
        timezoneId: 'Asia/Shanghai',
        cookies: cookies
    });
    
    await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });
    
    const page = await context.newPage();
    
    console.log('访问小红书...');
    await page.goto('https://www.xiaohongshu.com/', { 
        waitUntil: 'domcontentloaded',
        timeout: 30000
    });
    
    await page.waitForTimeout(5000);
    
    // 导航到发布页
    console.log('导航到发布页面...');
    await page.goto('https://creator.xiaohongshu.com/publish/publish', { 
        waitUntil: 'domcontentloaded',
        timeout: 30000
    });
    
    await page.waitForTimeout(8000);
    
    // 检查登录
    const url = page.url();
    console.log(`当前 URL: ${url}`);
    
    if (url.includes('login')) {
        console.log('❌ 未登录，跳转到登录页了');
        await browser.close();
        process.exit(1);
    }
    
    console.log('✓ 登录状态有效\n');
    
    // 等待页面完全加载
    console.log('等待页面加载...');
    await page.waitForTimeout(3000);
    
    // 截图查看当前页面
    const screenshotPath = '/tmp/xhs-page.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`✓ 页面截图：${screenshotPath}\n`);
    
    // 发布第一篇
    const post = POSTS[0];
    console.log('========================================');
    console.log(`发布：${post.title}`);
    console.log('========================================\n');
    
    // 上传照片
    console.log('上传照片...');
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
        await fileInput.setInputFiles(post.photos);
        console.log(`✓ 已上传 ${post.photos.length} 张照片`);
        await page.waitForTimeout(5000);  // 等待上传完成
    } else {
        console.log('⚠️  未找到文件输入框，尝试点击上传区域...');
        // 尝试点击上传区域
        const uploadArea = await page.$('[class*="upload"], [class*="Upload"]');
        if (uploadArea) {
            await uploadArea.click();
            await page.waitForTimeout(2000);
            // 再次尝试上传
            const fileInput2 = await page.$('input[type="file"]');
            if (fileInput2) {
                await fileInput2.setInputFiles(post.photos);
                console.log('✓ 照片上传成功');
                await page.waitForTimeout(5000);
            }
        }
    }
    
    // 输入标题
    console.log('\n输入标题...');
    const titleSelectors = [
        'input[placeholder*="标题"]',
        'input[placeholder*="title"]',
        'input[class*="title"]',
        'input[class*="Title"]'
    ];
    
    for (const selector of titleSelectors) {
        const titleInput = await page.$(selector);
        if (titleInput) {
            await titleInput.fill(post.title);
            console.log(`✓ 标题已输入`);
            break;
        }
    }
    
    await page.waitForTimeout(1000);
    
    // 输入内容
    console.log('\n输入内容...');
    const contentSelectors = [
        'textarea[placeholder*="正文"]',
        'textarea[placeholder*="content"]',
        'textarea[placeholder*="分享"]',
        '[class*="editor"]',
        '[contenteditable="true"]'
    ];
    
    for (const selector of contentSelectors) {
        const contentInput = await page.$(selector);
        if (contentInput) {
            await contentInput.fill(post.desc);
            console.log(`✓ 内容已输入`);
            break;
        }
    }
    
    await page.waitForTimeout(2000);
    
    // 查找发布按钮
    console.log('\n查找发布按钮...');
    const publishSelectors = [
        'button:has-text("发布")',
        'button:has-text("Publish")',
        'button[class*="publish"]',
        'button[class*="Publish"]',
        '[class*="submit"]'
    ];
    
    for (const selector of publishSelectors) {
        const publishBtn = await page.$(selector);
        if (publishBtn) {
            console.log(`✓ 找到发布按钮：${selector}`);
            // 实际发布时取消下面这行的注释
            // await publishBtn.click();
            console.log('⚠️  演示模式：未实际点击发布按钮');
            break;
        }
    }
    
    console.log('\n========================================');
    console.log('✅ 第一篇笔记处理完成！');
    console.log('========================================\n');
    
    // 保存 cookies
    const newCookies = await context.cookies();
    fs.writeFileSync(COOKIES_FILE, JSON.stringify(newCookies, null, 2));
    console.log(`✓ Cookies 已更新（${newCookies.length} 个）`);
    
    await browser.close();
    console.log('\n✅ 发布流程完成！');
})();
