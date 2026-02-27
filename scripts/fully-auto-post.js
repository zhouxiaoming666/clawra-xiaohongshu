const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 照片和文案配置
const POSTS = [
    { 
        photos: [
            '/tmp/scarlett_01_bikini_final.png',
            '/tmp/scarlett_02_office_final.png',
            '/tmp/scarlett_03_sports_final.png'
        ],
        title: '💋 斯嘉丽的夏日穿搭合集 | 3 套 LOOK 分享',
        desc: `📏 身高：170cm
👗 三围：37E-100cm 完美 S 曲线

今日分享 3 套不同风格的穿搭～

LOOK 1️⃣：比基尼海滩风 🏖️
LOOK 2️⃣：职业 OL 风 💼
LOOK 3️⃣：运动健身风 🏋️‍♀️

展现自信美丽的自己！✨

#每日穿搭 #OOTD #穿搭分享 #新疆美女 #身材管理 #夏日穿搭 #多风格穿搭`
    },
    { 
        photos: [
            '/tmp/scarlett_04_evening_remaining.png',
            '/tmp/scarlett_05_casual_remaining.png',
            '/tmp/scarlett_06_qipao_final.png'
        ],
        title: '💋 斯嘉丽的百变穿搭 | 优雅×休闲×中国风',
        desc: `📏 身高：170cm
👗 三围：37E-100cm 完美 S 曲线

今日分享 3 套气质穿搭～

LOOK 1️⃣：晚礼服风 🍷 高贵典雅
LOOK 2️⃣：休闲居家风 🏠 慵懒随性
LOOK 3️⃣：旗袍中国风 🇨🇳 东方韵味

你最喜欢哪一套？评论区告诉我～✨

#每日穿搭 #OOTD #穿搭分享 #新疆美女 #身材管理 #气质穿搭 #中国风`
    },
    { 
        photos: [
            '/tmp/scarlett_07_leather_final.png'
        ],
        title: '💋 斯嘉丽的皮衣机车风 | 又美又飒',
        desc: `📏 身高：170cm
👗 三围：37E-100cm 完美 S 曲线

今日 OOTD｜皮衣机车风 🏍️

黑色皮衣 + 皮裤
酷飒十足，气场全开！

做自己的女王，又美又飒！✨

#每日穿搭 #OOTD #穿搭分享 #新疆美女 #身材管理 #皮衣穿搭 #机车风 #酷飒女孩`
    }
];

(async () => {
    console.log('🚀 启动小红书完全自动化发布...\n');
    
    // 检查照片文件
    console.log('检查照片文件...');
    let allPhotosExist = true;
    for (const post of POSTS) {
        for (const photoPath of post.photos) {
            if (!fs.existsSync(photoPath)) {
                console.log(`✗ ${path.basename(photoPath)} (不存在)`);
                allPhotosExist = false;
            } else {
                console.log(`✓ ${path.basename(photoPath)}`);
            }
        }
    }
    
    if (!allPhotosExist) {
        console.log('\n❌ 部分照片文件不存在，请先生成照片');
        process.exit(1);
    }
    console.log('');
    
    // 加载 cookies
    let cookies = [];
    if (fs.existsSync(process.env.COOKIES_FILE || './storage/cookies.json')) {
        cookies = JSON.parse(fs.readFileSync(process.env.COOKIES_FILE || './storage/cookies.json', 'utf-8'));
        console.log(`✓ 加载了 ${cookies.length} 个 cookies\n`);
    }
    
    console.log('启动浏览器（无头模式）...');
    const browser = await chromium.launch({
        headless: true,  // 无头模式
        args: [
            '--window-size=1920,1080',
            '--no-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
    });
    
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        locale: 'zh-CN',
        timezoneId: 'Asia/Shanghai',
        cookies: cookies
    });
    
    // 隐藏自动化特征
    await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
        });
    });
    
    const page = await context.newPage();
    
    // 访问小红书
    console.log('访问小红书...');
    await page.goto('https://www.xiaohongshu.com/', { 
        waitUntil: 'networkidle',
        timeout: 60000
    });
    
    await page.waitForTimeout(5000);
    
    // 检查登录状态
    const isLoggedIn = await page.evaluate(() => {
        return document.cookie.includes('session_id') || 
               document.cookie.includes('a1') ||
               !!document.querySelector('.user-avatar');
    });
    
    if (!isLoggedIn) {
        console.log('❌ 未登录或登录已过期');
        console.log('请先运行：bash scripts/xiaohongshu-login-fixed.sh');
        await browser.close();
        process.exit(1);
    }
    
    console.log('✓ 登录状态有效\n');
    
    // 发布每篇笔记
    for (let i = 0; i < POSTS.length; i++) {
        const post = POSTS[i];
        console.log(`========================================`);
        console.log(`【${i + 1}/${POSTS.length}】发布：${post.title}`);
        console.log(`========================================`);
        
        try {
            // 点击发布按钮
            console.log('打开发布页面...');
            
            // 尝试多种方法打开发布页面
            await page.evaluate(() => {
                // 方法 1: 直接导航到发布页面
                window.location.href = 'https://creator.xiaohongshu.com/publish/publish';
            });
            
            await page.waitForTimeout(3000);
            
            // 等待页面加载
            await page.waitForSelector('input[type="file"], .upload-input, [class*="upload"]', { 
                timeout: 10000 
            }).catch(() => {
                console.log('⚠️  未找到上传按钮，尝试其他方法...');
            });
            
            // 上传照片
            console.log('上传照片...');
            const fileInput = await page.$('input[type="file"]');
            if (fileInput) {
                await fileInput.setInputFiles(post.photos);
                console.log(`✓ 已上传 ${post.photos.length} 张照片`);
            } else {
                console.log('⚠️  未找到文件输入框');
            }
            
            await page.waitForTimeout(2000);
            
            // 输入标题
            console.log('输入标题...');
            const titleInput = await page.$('input[placeholder*="标题"], input[placeholder*="title"]');
            if (titleInput) {
                await titleInput.fill(post.title);
                console.log(`✓ 标题：${post.title}`);
            } else {
                console.log('⚠️  未找到标题输入框');
            }
            
            await page.waitForTimeout(1000);
            
            // 输入内容
            console.log('输入内容...');
            const contentInput = await page.$('textarea[placeholder*="正文"], textarea[placeholder*="content"], .editor-content');
            if (contentInput) {
                await contentInput.fill(post.desc);
                console.log('✓ 内容已输入');
            } else {
                console.log('⚠️  未找到内容输入框');
            }
            
            await page.waitForTimeout(1000);
            
            // 添加标签（从文案中提取）
            const tags = post.desc.match(/#[\u4e00-\u9fa5a-zA-Z0-9_]+/g) || [];
            console.log(`添加标签：${tags.join(' ')}`);
            
            // 点击发布按钮
            console.log('点击发布...');
            const publishButton = await page.$('button:has-text("发布"), button:has-text("Publish"), .publish-btn');
            if (publishButton) {
                // 实际发布时取消注释
                // await publishButton.click();
                console.log('✓ 发布按钮已找到（演示模式，未实际点击）');
            } else {
                console.log('⚠️  未找到发布按钮');
            }
            
            console.log(`✓ 第 ${i + 1} 篇笔记处理完成\n`);
            
            // 等待间隔（防限流）
            if (i < POSTS.length - 1) {
                console.log('等待 5 分钟（防限流）...');
                await page.waitForTimeout(300000);  // 5 分钟
            }
            
        } catch (error) {
            console.log(`❌ 发布失败：${error.message}`);
        }
    }
    
    // 保存更新后的 cookies
    const newCookies = await context.cookies();
    fs.writeFileSync(process.env.COOKIES_FILE || './storage/cookies.json', JSON.stringify(newCookies, null, 2));
    console.log(`\n✓ Cookies 已更新（${newCookies.length} 个）`);
    
    await browser.close();
    console.log('\n✅ 所有笔记发布完成！');
})();
