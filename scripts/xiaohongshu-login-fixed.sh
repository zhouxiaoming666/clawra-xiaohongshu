#!/bin/bash
# 小红书扫码登录脚本（改进版 - 正确保存 cookies）

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STORAGE_DIR="$SCRIPT_DIR/../storage"
QR_CODE_DIR="$SCRIPT_DIR/../qrcode"
COOKIES_FILE="$STORAGE_DIR/cookies.json"

# 清理并创建目录
rm -rf "$STORAGE_DIR/cookies.json"  # 删除可能是文件或目录的 cookies.json
rm -rf "$QR_CODE_DIR"
mkdir -p "$STORAGE_DIR" "$QR_CODE_DIR"

echo "=========================================="
echo "📕 小红书扫码登录（改进版）"
echo "=========================================="
echo ""

# 创建改进后的 Node.js 登录脚本
cat > "$SCRIPT_DIR/login-improved.js" << 'EOFNODE'
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const COOKIES_FILE = process.argv[1];
const QR_CODE_DIR = process.argv[2];

console.log('启动浏览器（无头模式）...');

(async () => {
    const browser = await chromium.launch({
        headless: true,
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
        timezoneId: 'Asia/Shanghai'
    });
    
    // 隐藏自动化特征
    await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
        });
    });
    
    const page = await context.newPage();
    
    console.log('访问小红书...');
    await page.goto('https://www.xiaohongshu.com/', { 
        waitUntil: 'networkidle',
        timeout: 60000
    });
    
    await page.waitForTimeout(3000);
    
    // 尝试点击登录按钮
    try {
        const loginButton = await page.$('button:has-text("登录"), .login-button, [data-action="login"]');
        if (loginButton) {
            await loginButton.click();
            console.log('✓ 点击了登录按钮');
            await page.waitForTimeout(3000);
        }
    } catch (e) {
        console.log('已在登录页或未找到登录按钮');
    }
    
    // 截图保存二维码到 qrcode 目录
    console.log('截取二维码...');
    const qrPath = path.join(QR_CODE_DIR, 'login-qr.png');
    await page.screenshot({ path: qrPath, fullPage: true });
    console.log(`✓ 二维码已保存：${qrPath}`);
    
    // 尝试查找二维码元素并截图
    try {
        const qrElement = await page.$('canvas, img[src*="qr"], .qrcode');
        if (qrElement) {
            const qrElementPath = path.join(QR_CODE_DIR, 'login-qr-code.png');
            await qrElement.screenshot({ path: qrElementPath });
            console.log(`✓ 二维码特写：${qrElementPath}`);
        }
    } catch (e) {}
    
    console.log('\n========================================');
    console.log('二维码图片位置：' + QR_CODE_DIR);
    console.log('请用小红书 APP 扫码登录');
    console.log('等待 5 分钟...');
    console.log('========================================\n');
    
    // 等待登录
    let loggedIn = false;
    try {
        await page.waitForFunction(() => {
            const url = window.location.href;
            return url.includes('/explore/') || 
                   url.includes('/user/') ||
                   url.includes('/profile') ||
                   url.includes('/creator');
        }, { timeout: 300000 });
        loggedIn = true;
        console.log('✓ 检测到登录成功！');
    } catch (e) {
        console.log('⚠ 等待超时，检查 cookies...');
    }
    
    // 保存 cookies
    const cookies = await context.cookies();
    if (cookies.length > 0) {
        // 使用传入的绝对路径，确保是文件不是目录
        fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookies, null, 2));
        console.log(`\n✓ Cookies 已保存到：${COOKIES_FILE}`);
        console.log(`✓ 共保存 ${cookies.length} 个 cookies`);
        
        // 输出 cookies 文件内容预览
        console.log('\nCookies 预览:');
        console.log(JSON.stringify(cookies.slice(0, 3), null, 2));
    } else {
        console.log('\n⚠ 未获取到 cookies');
        process.exit(1);
    }
    
    await browser.close();
    console.log('\n✅ 登录完成！');
})();
EOFNODE

# 运行登录脚本
node "$SCRIPT_DIR/login-improved.js" "$COOKIES_FILE" "$QR_CODE_DIR"

# 检查结果
echo ""
echo "=========================================="
if [ -f "$COOKIES_FILE" ]; then
    COOKIE_COUNT=$(jq length "$COOKIES_FILE" 2>/dev/null || echo "0")
    if [ "$COOKIE_COUNT" -gt "0" ]; then
        echo "✅ 登录成功！保存了 $COOKIE_COUNT 个 cookies"
        echo "📁 Cookies 文件：$COOKIES_FILE"
    else
        echo "⚠️  Cookies 文件为空"
        exit 1
    fi
else
    echo "❌ Cookies 文件未创建"
    exit 1
fi

if [ -f "$QR_CODE_DIR/login-qr.png" ]; then
    echo "📸 二维码截图：$QR_CODE_DIR/login-qr.png"
fi
echo "=========================================="
