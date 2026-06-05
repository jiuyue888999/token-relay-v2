import type { ProviderAdapter } from "./types.js";
import { OpenAIAdapter } from "./openai.js";
import { AnthropicAdapter } from "./anthropic.js";
import { GeminiAdapter } from "./gemini.js";
import { DeepSeekAdapter } from "./deepseek.js";
import { OpenAICompatAdapter } from "./openai-compat.js";

const adapters: Record<string, ProviderAdapter> = {
  // ── Global ──────────────────────────────────────────
  openai: new OpenAIAdapter(),
  anthropic: new AnthropicAdapter(),
  gemini: new GeminiAdapter(),
  deepseek: new DeepSeekAdapter(),

  // ── Chinese LLMs (OpenAI-compatible) ────────────────
  qwen: new OpenAICompatAdapter("qwen", "https://dashscope.aliyuncs.com/compatible-mode"),
  glm: new OpenAICompatAdapter("glm", "https://open.bigmodel.cn/api/paas/v4"),
  kimi: new OpenAICompatAdapter("kimi", "https://api.moonshot.cn"),
  doubao: new OpenAICompatAdapter("doubao", "https://ark.cn-beijing.volces.com/api/v3"),
  baichuan: new OpenAICompatAdapter("baichuan", "https://api.baichuan-ai.com"),
  minimax: new OpenAICompatAdapter("minimax", "https://api.minimax.chat"),
  yi: new OpenAICompatAdapter("yi", "https://api.lingyiwanwu.com"),
  stepfun: new OpenAICompatAdapter("stepfun", "https://api.stepfun.com"),
  seedance: new OpenAICompatAdapter("seedance", "https://ark.cn-beijing.volces.com/api/v3"),
};

export const PROVIDERS = Object.keys(adapters);

export function getAdapter(provider: string): ProviderAdapter | undefined {
  return adapters[provider.toLowerCase()];
}

export function getProviderFromModel(model: string): string {
  const m = model.toLowerCase();
  const prefixMap: Record<string, string> = {
    "qwen/": "qwen", "glm/": "glm", "kimi/": "kimi",
    "doubao/": "doubao", "baichuan/": "baichuan",
    "minimax/": "minimax", "yi/": "yi", "step/": "stepfun",
    "seedance": "seedance", "seedream": "doubao",
    "claude": "anthropic", "gemini": "gemini",
    "deepseek": "deepseek", "doubao-seed": "doubao",
    "kling": "kling", "runway": "runway", "pika": "pika",
    "sora": "openai", "luma": "luma",
  };
  for (const [prefix, provider] of Object.entries(prefixMap)) {
    if (m.startsWith(prefix)) return provider;
  }
  if (m.startsWith("gpt-") || m.startsWith("o1") || m.startsWith("o3") || m.startsWith("o4")) return "openai";
  return "openai";
}

export type { ProviderAdapter };
export type { UpstreamKey } from "./types.js";

// ── Model Registry (Updated June 2026) ─────────────

export interface ModelEntry {
  id: string;
  object: "model";
  owned_by: string;
  type: "chat" | "image" | "video";
  description?: string;
  edition?: string;
}

export const ALL_MODELS: ModelEntry[] = [
  // ═══ OpenAI GPT-5 Family ═════════════════════════
  { id: "gpt-5.5", object: "model", owned_by: "openai", type: "chat", description: "GPT-5.5 最强旗舰 · Agentic Coding · 2026.4", edition: "2026" },
  { id: "gpt-5.4", object: "model", owned_by: "openai", type: "chat", description: "GPT-5.4 性价比之王 · 专业工作负载", edition: "2026" },
  { id: "gpt-5.3-instant", object: "model", owned_by: "openai", type: "chat", description: "GPT-5.3 Instant 极速推理 · 低延迟", edition: "2026" },

  // ═══ Anthropic Claude Family ══════════════════════
  { id: "claude-opus-4-7", object: "model", owned_by: "anthropic", type: "chat", description: "Claude Opus 4.7 最强旗舰 · 87.6% SWE-bench · 2026.4", edition: "2026" },
  { id: "claude-sonnet-4-6", object: "model", owned_by: "anthropic", type: "chat", description: "Claude Sonnet 4.6 均衡之选 · 1M上下文 · 2026.2", edition: "2026" },
  { id: "claude-haiku-4-5", object: "model", owned_by: "anthropic", type: "chat", description: "Claude Haiku 4.5 极速响应 · 低价高效", edition: "2025" },

  // ═══ Google Gemini ════════════════════════════════
  { id: "gemini-3-pro", object: "model", owned_by: "google", type: "chat", description: "Gemini 3 Pro 旗舰 · 多模态 · 2M上下文", edition: "2026" },
  { id: "gemini-2.5-pro", object: "model", owned_by: "google", type: "chat", description: "Gemini 2.5 Pro 高性能推理", edition: "2025" },
  { id: "gemini-2.5-flash", object: "model", owned_by: "google", type: "chat", description: "Gemini 2.5 Flash 极速 · 高并发", edition: "2025" },

  // ═══ DeepSeek V4 Family ═══════════════════════════
  { id: "deepseek-v4-pro", object: "model", owned_by: "deepseek", type: "chat", description: "DeepSeek V4 Pro · 1.6T参数 · 1M上下文 · 2026.4", edition: "2026" },
  { id: "deepseek-v4-flash", object: "model", owned_by: "deepseek", type: "chat", description: "DeepSeek V4 Flash · 极速经济 · 100万上下文", edition: "2026" },

  // ═══ 阿里通义千问 ═════════════════════════════════
  { id: "qwen/qwen3-max", object: "model", owned_by: "alibaba", type: "chat", description: "通义千问 Qwen3-Max 旗舰 · 性能超GPT-5", edition: "2025" },
  { id: "qwen/qwen3-plus", object: "model", owned_by: "alibaba", type: "chat", description: "通义千问 Qwen3-Plus 增强版", edition: "2025" },
  { id: "qwen/qwen3-turbo", object: "model", owned_by: "alibaba", type: "chat", description: "通义千问 Qwen3-Turbo 极速版", edition: "2025" },

  // ═══ 智谱 GLM-5 ═══════════════════════════════════
  { id: "glm/glm-5", object: "model", owned_by: "zhipuai", type: "chat", description: "智谱GLM-5 旗舰 · 744B MoE · 开源SOTA · 2026.2", edition: "2026" },
  { id: "glm/glm-5-flash", object: "model", owned_by: "zhipuai", type: "chat", description: "智谱GLM-5 Flash 极速版", edition: "2026" },

  // ═══ Kimi K2.6 (月之暗面) ══════════════════════════
  { id: "kimi/kimi-k2.6", object: "model", owned_by: "moonshot", type: "chat", description: "Kimi K2.6 · 1T MoE · 多模态 · Agent集群 · 2026.4", edition: "2026" },

  // ═══ 豆包 2.0 (字节跳动) ═══════════════════════════
  { id: "doubao/doubao-seed-2.0", object: "model", owned_by: "bytedance", type: "chat", description: "豆包2.0 · 多模态+Agent · 慢思考 · 2026.2", edition: "2026" },

  // ═══ 百川 ═════════════════════════════════════════
  { id: "baichuan/baichuan4-turbo", object: "model", owned_by: "baichuan", type: "chat", description: "百川4 Turbo · 高性能推理", edition: "2025" },

  // ═══ MiniMax ═══════════════════════════════════════
  { id: "minimax/minimax-m2", object: "model", owned_by: "minimax", type: "chat", description: "MiniMax M2 旗舰 · 多模态理解", edition: "2026" },

  // ═══ 零一万物 Yi ═══════════════════════════════════
  { id: "yi/yi-lightning-v2", object: "model", owned_by: "01ai", type: "chat", description: "Yi-Lightning V2 极速推理旗舰", edition: "2025" },

  // ═══ 阶跃星辰 ═══════════════════════════════════════
  { id: "step/step-3", object: "model", owned_by: "stepfun", type: "chat", description: "阶跃星辰 Step-3 多模态旗舰", edition: "2026" },
];
