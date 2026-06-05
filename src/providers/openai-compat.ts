/**
 * Generic OpenAI-compatible adapter.
 * Used for any provider that speaks OpenAI's /v1/chat/completions format.
 * Just needs a base URL — model routing is handled by prefix.
 */
import type { ProviderAdapter, ChatRequest, TokenUsage } from "./types.js";

export class OpenAICompatAdapter implements ProviderAdapter {
  readonly provider: string;
  private readonly defaultBaseUrl: string;

  constructor(provider: string, defaultBaseUrl: string) {
    this.provider = provider;
    this.defaultBaseUrl = defaultBaseUrl;
  }

  mapModel(model: string): string {
    // Strip provider prefix: "qwen/qwen-turbo" → "qwen-turbo"
    const m = model.toLowerCase();
    const prefixes = [
      "qwen/", "glm/", "kimi/", "doubao/", "baichuan/",
      "ernie/", "spark/", "minimax/", "yi/", "step/"
    ];
    for (const p of prefixes) {
      if (m.startsWith(p)) return model.slice(p.length);
    }
    return model;
  }

  buildRequest(req: ChatRequest): any {
    const body: any = {
      model: req.model,
      messages: req.messages,
      stream: req.stream ?? false,
    };
    if (req.max_tokens != null) body.max_tokens = req.max_tokens;
    if (req.temperature != null) body.temperature = req.temperature;
    if (req.top_p != null) body.top_p = req.top_p;
    if (req.stop != null) body.stop = req.stop;
    if (req.frequency_penalty != null) body.frequency_penalty = req.frequency_penalty;
    if (req.presence_penalty != null) body.presence_penalty = req.presence_penalty;
    return body;
  }

  buildHeaders(apiKey: string): Record<string, string> {
    return {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
  }

  getEndpoint(baseUrl?: string | null): string {
    const base = baseUrl || this.defaultBaseUrl;
    return `${base.replace(/\/$/, "")}/v1/chat/completions`;
  }

  parseStreamChunk(chunk: any): string | null {
    return chunk;
  }

  extractUsage(response: any): TokenUsage {
    const usage = response?.usage;
    return {
      prompt_tokens: usage?.prompt_tokens ?? 0,
      completion_tokens: usage?.completion_tokens ?? 0,
      total_tokens: usage?.total_tokens ?? 0,
    };
  }
}
