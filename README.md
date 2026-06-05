# Token Relay Station v2

基于 **New API**（calciumion/new-api）的 AI 模型聚合中转站——2026 年行业标准方案。

## 支持模型（36+）

🤖 对话：GPT-5.5, Claude Opus 4.7, Gemini 3 Pro, DeepSeek V4 Pro, Qwen3-Max, GLM-5, Kimi K2.6, 豆包2.0 等 22 个
🎨 图片：Seedream 5.0, DALL·E 3, Midjourney 7.0, Flux Pro, 通义万相, Imagen 4
🎬 视频：Seedance 2.0, 可灵 Kling 3.0, Sora 2, Runway Gen-4, Veo 3.1, 海螺AI

---

## 🚀 部署方式

### 方式一：Docker Compose（推荐，自己买 VPS）

```bash
# 1. 克隆仓库
git clone https://github.com/YOUR_USERNAME/token-relay-v2.git
cd token-relay-v2

# 2. 修改密钥
nano .env   # 改掉三个密码！

# 3. 启动
docker compose up -d

# 4. 访问
# http://你的服务器IP:3000
```

### 方式二：Zeabur 一键部署（零成本起步）

1. 把这个仓库推到 GitHub
2. 打开 [zeabur.com](https://zeabur.com) 注册（支持支付宝）
3. 新建项目 → Import GitHub → 选 `token-relay-v2`
4. Zeabur 自动识别 `docker-compose.yml`
5. 部署 → 自动获得 `xxx.zeabur.app` 域名
6. 在 Zeabur 环境变量里修改 `.env` 里的密码

### 方式三：宝塔面板

```bash
# 宝塔 → Docker → 拉取镜像 calciumion/new-api:latest
# 端口映射 3000:3000
# 挂载目录 /data
# 启动即可
```

---

## 🔧 首次初始化

1. 浏览器打开你的域名
2. 设置管理员账号密码
3. 选择运行模式：**对外服务模式**
4. 进入后台 → 渠道管理 → 添加你的上游 API Key
5. 令牌管理 → 创建用户 API Key
6. 用户用这个 Key + 你的域名调用

---

## 📋 后续运维

```bash
# 更新到最新版
docker compose pull new-api
docker compose up -d

# 查看日志
docker compose logs -f new-api

# 备份数据库
cp -r pg_data backup_$(date +%Y%m%d)/
```

详细渠道配置见 [CHANNELS.md](CHANNELS.md)
