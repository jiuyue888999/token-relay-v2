import type { ProviderAdapter, ChatRequest, TokenUsage } from "./types.js";

export class OpenAIAdapter implements ProviderAdapter {
  readonly provider = "openai";

  mapModel(model: string): string {
    // OpenAI models pass through as-is
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
    const base = baseUrl || "https://api.openai.com";
    return `${base.replace(/\/$/, "")}/v1/chat/completions`;
  }

  parseStreamChunk(chunk: any): string | null {
    // OpenAI already returns SSE formatted data: "data: {...}\n\n"
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
