# Token Relay Station v2

**New API 引擎 + 中文前端门面** — 2026 年最先进玩法。

---

## 架构

```
用户浏览器
    │
    ▼
┌─────────────────────────────┐
│  Frontend (Hono) :3000       │  ← 我们写的中文界面
│                              │
│  /             漂亮首页       │
│  /login        登录注册       │
│  /dashboard    用户控制台     │
│                              │
│  代理规则：                   │
│  /v1/*  ──────────────┐     │
│  /api/* ──────────────┤     │
│  /admin/* ────────────┤     │
└───────────────────────┼─────┘
                        │
                        ▼
┌─────────────────────────────┐
│  New API (Go) :3000 (内网)   │  ← 开源网关引擎
│                              │
│  API 网关 · 渠道管理          │
│  用户系统 · 令牌管理          │
│  计费系统 · 日志统计          │
│  管理后台 · 多租户            │
└──────────┬──────────────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌────────┐  ┌────────┐
│PostgreSQL│  │ Redis  │
└────────┘  └────────┘
```

## 界面效果

| 页面 | 谁提供 | 效果 |
|------|--------|------|
| 首页 (模型展示、定价、文档) | 我们的前端 | 🎨 精美中文 Landing |
| 登录 / 注册 | 我们的前端 → 代理到 New API | 🎨 中文表单 |
| 用户控制台 | 我们的前端 → 调用 New API | 🎨 额度/令牌/代码示例 |
| 管理后台 | New API 原生界面 | ⚙️ 功能完整（渠道/用户/令牌/统计/设置） |
| API 端点 | New API | ⚡ 高性能 Go 引擎 |

## 支持的模型（36+）

🤖 **对话：** GPT-5.5, Claude Opus 4.7, Gemini 3 Pro, DeepSeek V4 Pro, Qwen3-Max, GLM-5, Kimi K2.6, 豆包2.0 等 22 个
🎨 **图片：** Seedream 5.0, DALL·E 3, Midjourney 7.0, Flux Pro, 通义万相, Imagen 4
🎬 **视频：** Seedance 2.0, 可灵 Kling 3.0, Sora 2, Runway Gen-4, Veo 3.1, 海螺AI

## 部署

### Docker Compose（自己买 VPS）

```bash
git clone <你的仓库> && cd token-relay-v2

# 修改密码
nano .env

# 一键启动（4 个容器：前端+网关+数据库+缓存）
docker compose up -d

# 访问 http://你的IP:3000
```

### Zeabur（零成本，送域名）

1. 推代码到 GitHub
2. [zeabur.com](https://zeabur.com) 注册 → Import 仓库
3. Zeabur 自动识别 docker-compose.yml
4. 部署 → 获得 `xxx.zeabur.app` HTTPS 域名

## 首次使用

1. 浏览器打开你的域名 → 看到漂亮首页
2. 点「免费注册」创建账户
3. 登录管理员后台：`/admin` → 初始化设置
4. 添加上游渠道：填入你的各厂商 API Key
5. 开始对外提供服务

## 渠道配置

详见 [CHANNELS.md](CHANNELS.md) —— 36 个模型的完整配置指南，包括密钥来源和定价建议。
