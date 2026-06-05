# 模型渠道配置指南

部署 New API 后，在 Web 后台「渠道」页面逐一添加。每个渠道对应一个上游 API Key。

## 渠道配置格式

| 字段 | 说明 | 示例 |
|------|------|------|
| 渠道名称 | 自己备注 | `DeepSeek V4 - 个人号` |
| 类型 | 厂商类型 | 见下表 |
| 模型 | 映射的模型名 | `deepseek-v4-pro` |
| 密钥 | API Key | `sk-xxxx` |
| 代理/Base URL | 自定义地址（可选） | 留空用官方地址 |
| 分组 | 模型分组 | `default` / `vip` |
| 优先级 | 数字越大越优先 | `1-10` |

---

## 一、对话模型渠道

### 全球厂商

| 渠道名称建议 | 类型 | 模型映射 | 密钥来源 |
|-------------|------|----------|----------|
| OpenAI 官方 | OpenAI | `gpt-5.5`, `gpt-5.4`, `gpt-5.3-instant` | platform.openai.com |
| Claude 官方 | Claude | `claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5` | console.anthropic.com |
| Gemini 官方 | Gemini | `gemini-3-pro`, `gemini-2.5-pro`, `gemini-2.5-flash` | aistudio.google.com |
| DeepSeek V4 | DeepSeek | `deepseek-v4-pro`, `deepseek-v4-flash` | platform.deepseek.com |

### 国产大模型

| 渠道名称建议 | 类型 | 模型映射 | 密钥来源 |
|-------------|------|----------|----------|
| 通义千问 | 自定义(OpenAI) | `qwen3-max`, `qwen3-plus`, `qwen3-turbo` | dashscope.console.aliyun.com |
| 智谱GLM-5 | 自定义(OpenAI) | `glm-5`, `glm-5-flash` | open.bigmodel.cn |
| Kimi K2.6 | 自定义(OpenAI) | `kimi-k2.6` | platform.moonshot.cn |
| 豆包2.0 | 自定义(OpenAI) | `doubao-seed-2.0` | console.volcengine.com/ark |
| 百川4 | 自定义(OpenAI) | `baichuan4-turbo` | platform.baichuan-ai.com |
| MiniMax M2 | 自定义(OpenAI) | `minimax-m2` | platform.minimax.chat |
| 零一万物 | 自定义(OpenAI) | `yi-lightning-v2` | platform.lingyiwanwu.com |
| 阶跃星辰 | 自定义(OpenAI) | `step-3` | platform.stepfun.com |

> 💡 以上国产模型选「自定义(OpenAI)」类型，填入各厂商的 API 地址即可。

---

## 二、图片生成渠道

| 渠道名称 | 类型 | 模型映射 | 密钥来源 |
|----------|------|----------|----------|
| DALL·E 3 | OpenAI | `dall-e-3` | platform.openai.com |
| Seedream 5.0 | 自定义(OpenAI) | `seedream-5.0-lite` | console.volcengine.com/ark |
| Midjourney 7 | Midjourney | `midjourney-7.0` | 通过代理/MJ API |
| Flux Pro | 自定义(OpenAI) | `flux-pro` | replicate.com 或 fal.ai |
| 通义万相 | 自定义(OpenAI) | `qwen-image-max` | dashscope.console.aliyun.com |

---

## 三、视频生成渠道

| 渠道名称 | 类型 | 模型映射 | 密钥来源 |
|----------|------|----------|----------|
| Seedance 2.0 | 自定义(OpenAI) | `seedance-2.0` | console.volcengine.com/ark |
| 可灵 Kling 3 | 自定义(OpenAI) | `kling-3.0` | platform.kling.kuaishou.com |
| Sora 2 | OpenAI | `sora-2` | platform.openai.com |
| Runway Gen-4 | 自定义(OpenAI) | `runway-gen-4` | runwayml.com |
| Veo 3.1 | Gemini | `veo-3.1` | aistudio.google.com |
| 海螺 AI | 自定义(OpenAI) | `hailuo-02` | platform.minimax.chat |

---

## 四、推荐起步配置

**最小可用方案（零成本）：**
1. DeepSeek V4 — 国内直接注册，便宜好用
2. Gemini 2.5 Flash — Google 免费额度
3. 智谱GLM-5 — 新用户有免费 tokens

**完整方案（月费约 ¥200-500）：**
1. OpenAI GPT-5.5 — 海外信用卡
2. Claude Opus 4.7 — 海外手机号验证
3. DeepSeek V4 Pro — 国内注册
4. 智谱 GLM-5 — 国内注册
5. Kimi K2.6 — 国内注册
6. 通义千问 Qwen3-Max — 国内注册

---

## 五、定价建议

New API 内置「令牌」系统，你可以给不同令牌设置不同的倍率和额度：

| 令牌类型 | 倍率 | 适用 |
|----------|------|------|
| 免费体验 | 1.0x 成本 | 新用户赠送 10万 |
| 普通会员 | 1.5x 成本 | 日常使用 |
| 高级会员 | 1.3x 成本 | 量大优惠 |
| VIP | 1.1x 成本 | 包月用户 |

> 💡 倍率 = 你收用户的价格 ÷ 你的上游成本。1.5x 就是 50% 毛利。
