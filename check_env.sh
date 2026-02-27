#!/bin/bash
# 小红书 MCP 环境检查脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
XHS_MCP_URL="${XHS_MCP_URL:-http://localhost:18060/mcp}"

# 检查 MCP 服务是否运行
echo "检查小红书 MCP 服务..."
if curl -s -o /dev/null -w "%{http_code}" "$XHS_MCP_URL" | grep -q "200\|405"; then
    echo "✓ MCP 服务运行中：$XHS_MCP_URL"
    exit 0
else
    echo "⚠️  MCP 服务未运行"
    exit 2
fi
