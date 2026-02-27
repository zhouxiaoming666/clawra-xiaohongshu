# 📦 发布到 GitHub 指南

## 当前状态

✅ 代码已准备就绪
✅ Git 仓库已初始化
✅ 已提交初始版本 v1.0.0

## 推送到 GitHub 的步骤

### 方法一：使用 GitHub CLI（推荐）

```bash
# 安装 gh（如果未安装）
npm install -g @anthropic-ai/cla-code

# 登录 GitHub
gh auth login

# 创建仓库并推送
cd /root/.openclaw/skills/clawra-xiaohongshu
gh repo create clawra-xiaohongshu --public --source=. --remote=origin --push
```

### 方法二：手动推送

```bash
# 1. 在 GitHub 上创建新仓库
# 访问 https://github.com/new
# 仓库名：clawra-xiaohongshu
# 设为公开仓库
# 不要初始化 README

# 2. 推送代码
cd /root/.openclaw/skills/clawra-xiaohongshu
git remote add origin https://github.com/SumeLabs/clawra-xiaohongshu.git
git push -u origin main

# 3. 输入 GitHub 用户名和密码（或使用 Personal Access Token）
```

### 方法三：使用 SSH

```bash
# 1. 生成 SSH key（如果没有）
ssh-keygen -t ed25519 -C "scarlett@clawra.ai"

# 2. 将公钥添加到 GitHub
# 访问 https://github.com/settings/keys
# 复制 ~/.ssh/id_ed25519.pub 的内容

# 3. 推送代码
cd /root/.openclaw/skills/clawra-xiaohongshu
git remote add origin git@github.com:SumeLabs/clawra-xiaohongshu.git
git push -u origin main
```

## 发布后的安装命令

用户安装此技能的命令：

```bash
# 克隆仓库
git clone https://github.com/SumeLabs/clawra-xiaohongshu.git
cd clawra-xiaohongshu

# 安装依赖
npm install
npx playwright install chromium

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入 API keys

# 扫码登录
npm run login

# 发布测试
npm run post
```

## 版本发布

### 更新版本号

编辑 `package.json`：

```json
{
  "version": "1.0.1"  // 更新版本号
}
```

### 创建 Git Tag

```bash
git tag -a v1.0.1 -m "Release v1.0.1"
git push origin v1.0.1
```

## ClawHub 发布（可选）

如果要在 ClawHub 上发布：

```bash
# 安装 clawhub CLI
npm install -g clawhub

# 登录
clawhub login

# 发布技能
clawhub publish
```

---

**Ready to Publish! 🚀**
