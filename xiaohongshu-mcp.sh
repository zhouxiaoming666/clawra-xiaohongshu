#!/bin/bash
# 小红书 MCP 发布脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
XHS_MCP_URL="${XHS_MCP_URL:-http://localhost:18060/mcp}"

echo "=========================================="
echo "📕 小红书 MCP 发布工具"
echo "=========================================="
echo ""

# 初始化并获取 Session ID
echo "初始化 MCP 会话..."
HEADERS_FILE="/tmp/xhs_headers_$$"
SESSION_ID=$(curl -s -D "$HEADERS_FILE" -X POST "$XHS_MCP_URL" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"openclaw","version":"1.0"}},"id":1}' \
    | jq -r '.id' && \
    grep -i 'Mcp-Session-Id' "$HEADERS_FILE" 2>/dev/null | tr -d '\r' | awk '{print $2}' || echo "")

rm -f "$HEADERS_FILE"

if [ -z "$SESSION_ID" ]; then
    echo "❌ 获取 Session ID 失败"
    exit 1
fi

echo "✓ Session ID: $SESSION_ID"
echo ""

# 确认初始化
echo "确认初始化..."
curl -s -X POST "$XHS_MCP_URL" \
    -H "Content-Type: application/json" \
    -H "Mcp-Session-Id: $SESSION_ID" \
    -d '{"jsonrpc":"2.0","method":"notifications/initialized","params":{}}' > /dev/null
echo "✓ 初始化完成"
echo ""

# 检查登录状态
echo "检查登录状态..."
LOGIN_STATUS=$(curl -s -X POST "$XHS_MCP_URL" \
    -H "Content-Type: application/json" \
    -H "Mcp-Session-Id: $SESSION_ID" \
    -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"check_login_status","arguments":{}},"id":3}')

echo "$LOGIN_STATUS" | jq -r '.result.content[0].text' 2>/dev/null || echo "⚠️  无法获取登录状态"
echo ""

# 获取二维码
echo "获取登录二维码..."
QR_RESPONSE=$(curl -s -X POST "$XHS_MCP_URL" \
    -H "Content-Type: application/json" \
    -H "Mcp-Session-Id: $SESSION_ID" \
    -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"get_login_qrcode","arguments":{}},"id":4}')

# 提取二维码 Base64
QR_BASE64=$(echo "$QR_RESPONSE" | jq -r '.result.content[0].data.base64' 2>/dev/null || echo "")

if [ -n "$QR_BASE64" ] && [ "$QR_BASE64" != "null" ]; then
    QR_DIR="$SCRIPT_DIR/qrcode"
    mkdir -p "$QR_DIR"
    echo "$QR_BASE64" | base64 -d > "$QR_DIR/login-qr-mcp.png"
    echo "✓ 二维码已保存：$QR_DIR/login-qr-mcp.png"
    echo ""
    
    # 发送给用户扫码
    echo "请扫描二维码登录（120 秒有效期）..."
    
    # 等待扫码
    for i in {1..24}; do
        sleep 5
        STATUS=$(curl -s -X POST "$XHS_MCP_URL" \
            -H "Content-Type: application/json" \
            -H "Mcp-Session-Id: $SESSION_ID" \
            -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"check_login_status","arguments":{}},"id":5}')
        
        if echo "$STATUS" | jq -r '.result.content[0].text' | grep -q "已登录"; then
            echo "✓ 扫码成功！"
            break
        fi
        
        if [ $i -eq 24 ]; then
            echo "⚠️  等待超时"
        fi
    done
else
    echo "⚠️  无法获取二维码"
fi

echo ""
echo "=========================================="
echo "✅ MCP 初始化完成"
echo "=========================================="
