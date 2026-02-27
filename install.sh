#!/bin/bash
# 小红书自动发布技能 - 快速安装脚本

set -e

echo "=========================================="
echo "📕 小红书自动发布技能 - 快速安装"
echo "=========================================="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未找到 Node.js"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js 版本：$(node -v)"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 错误：未找到 npm"
    exit 1
fi

echo "✓ npm 版本：$(npm -v)"

# 安装依赖
echo ""
echo "正在安装依赖..."
npm install

# 安装 Playwright
echo ""
echo "正在安装 Playwright 浏览器..."
npx playwright install chromium

# 创建必要目录
echo ""
echo "创建必要目录..."
mkdir -p storage qrcode templates

# 创建环境变量示例文件
cat > .env.example << 'EOF'
# 阿里云百炼 API Key（生成图片）
DASHSCOPE_API_KEY=sk-xxx

# OpenClaw 网关 Token（发送通知）
OPENCLAW_GATEWAY_TOKEN=xxx

# QQ 用户 ID（发送通知）
QQBOT_USER_ID=7941E72A6252ADA08CC281AC26D9920B
EOF

echo ""
echo "=========================================="
echo "✅ 安装完成！"
echo "=========================================="
echo ""
echo "下一步："
echo "1. 复制环境变量文件：cp .env.example .env"
echo "2. 编辑 .env 填入你的 API keys"
echo "3. 扫码登录：npm run login"
echo "4. 发布测试：npm run post"
echo ""
echo "详细文档：README.md"
echo "=========================================="
