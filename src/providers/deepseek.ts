import type { ProviderAdapter, ChatRequest, TokenUsage } from "./types.js";

/**
 * DeepSeek is OpenAI-compatible. Only base URL and a few model name
 * differences matter — everything else follows the OpenAI contract.
 */
export class DeepSeekAdapter implements ProviderAdapter {
  readonly provider = "deepseek";

  mapModel(model: string): string {
    // Strip "deepseek/" prefix if present
    return model.replace(/^deepseek\//, "");
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
    const base = baseUrl || "https://api.deepseek.com";
    return `${base.replace(/\/$/, "")}/v1/chat/completions`;
  }

  parseStreamChunk(chunk: any): string | null {
    // DeepSeek returns standard OpenAI SSE format
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
