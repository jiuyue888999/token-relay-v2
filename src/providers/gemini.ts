import type { ProviderAdapter, ChatRequest, TokenUsage, ChatMessage } from "./types.js";

export class GeminiAdapter implements ProviderAdapter {
  readonly provider = "gemini";

  mapModel(model: string): string {
    // Strip "gemini/" prefix if present
    return model.replace(/^gemini\//, "");
  }

  buildRequest(req: ChatRequest): any {
    const contents = this.convertMessages(req.messages);
    const systemInstruction = this.extractSystem(req.messages);

    // Gemini uses generateContent config
    const generationConfig: any = {};
    if (req.temperature != null) generationConfig.temperature = req.temperature;
    if (req.top_p != null) generationConfig.topP = req.top_p;
    if (req.max_tokens != null) generationConfig.maxOutputTokens = req.max_tokens;
    if (req.stop) generationConfig.stopSequences = req.stop;

    const body: any = {
      contents,
      generationConfig: Object.keys(generationConfig).length > 0 ? generationConfig : undefined,
    };

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    return body;
  }

  private convertMessages(messages: ChatMessage[]): any[] {
    const result: any[] = [];
    for (const msg of messages) {
      if (msg.role === "system") continue; // handled separately

      let role: string;
      if (msg.role === "assistant" || msg.role === "function" || msg.role === "tool") {
        role = "model";
      } else {
        role = "user";
      }

      const parts: any[] = [];
      if (typeof msg.content === "string") {
        parts.push({ text: msg.content });
      } else if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part.type === "text") {
            parts.push({ text: part.text || "" });
          } else if (part.type === "image_url" && part.image_url) {
            // Handle data URLs: "data:image/png;base64,xxx"
            const url = part.image_url.url;
            const match = url.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              parts.push({
                inlineData: {
                  mimeType: match[1],
                  data: match[2],
                },
              });
            }
          }
        }
      }

      // Merge consecutive same-role
      const last = result[result.length - 1];
      if (last && last.role === role) {
        last.parts.push(...parts);
      } else {
        result.push({ role, parts });
      }
    }

    return result;
  }

  private extractSystem(messages: ChatMessage[]): string | null {
    const systems = messages
      .filter((m) => m.role === "system")
      .map((m) => (typeof m.content === "string" ? m.content : ""))
      .filter(Boolean);
    return systems.length > 0 ? systems.join("\n\n") : null;
  }

  buildHeaders(apiKey: string): Record<string, string> {
    // Gemini uses API key as query param, not header
    return {
      "Content-Type": "application/json",
    };
  }

  getEndpoint(baseUrl?: string | null, model?: string): string {
    const base = baseUrl || "https://generativelanguage.googleapis.com";
    const actualModel = model ? this.mapModel(model) : "gemini-2.0-flash";
    return `${base.replace(/\/$/, "")}/v1beta/models/${actualModel}:streamGenerateContent?alt=sse`;
  }

  buildUrl(req: ChatRequest, apiKey: string, baseUrl?: string | null): string {
    const endpoint = this.getEndpoint(baseUrl, req.model);
    return `${endpoint}&key=${encodeURIComponent(apiKey)}`;
  }

  parseStreamChunk(chunk: any): string | null {
    if (!chunk) return null;
    // Gemini SSE: {"candidates": [{"content": {"parts": [{"text": "..."}], "role": "model"}}]}

    const candidates = chunk.candidates;
    if (!candidates || candidates.length === 0) return null;

    const candidate = candidates[0];
    const parts = candidate.content?.parts;

    if (!parts || parts.length === 0) {
      // Check for finish reason
      if (candidate.finishReason) {
        const openaiChunk = {
          id: "chatcmpl-" + Math.random().toString(36).slice(2, 10),
          object: "chat.completion.chunk",
          created: Math.floor(Date.now() / 1000),
          model: "gemini",
          choices: [
            {
              index: 0,
              delta: {},
              finish_reason: this.mapFinishReason(candidate.finishReason),
            },
          ],
          usage: chunk.usageMetadata
            ? {
                prompt_tokens: chunk.usageMetadata.promptTokenCount ?? 0,
                completion_tokens: chunk.usageMetadata.candidatesTokenCount ?? 0,
                total_tokens: chunk.usageMetadata.totalTokenCount ?? 0,
              }
            : undefined,
        };
        return `data: ${JSON.stringify(openaiChunk)}\n\n`;
      }
      return null;
    }

    const text = parts.map((p: any) => p.text || "").join("");

    const openaiChunk = {
      id: "chatcmpl-" + Math.random().toString(36).slice(2, 10),
      object: "chat.completion.chunk",
      created: Math.floor(Date.now() / 1000),
      model: "gemini",
      choices: [
        {
          index: 0,
          delta: { content: text },
          finish_reason: candidate.finishReason ? this.mapFinishReason(candidate.finishReason) : null,
        },
      ],
      usage: chunk.usageMetadata
        ? {
            prompt_tokens: chunk.usageMetadata.promptTokenCount ?? 0,
            completion_tokens: chunk.usageMetadata.candidatesTokenCount ?? 0,
            total_tokens: chunk.usageMetadata.totalTokenCount ?? 0,
          }
        : undefined,
    };
    return `data: ${JSON.stringify(openaiChunk)}\n\n`;
  }

  private mapFinishReason(reason: string): string {
    const map: Record<string, string> = {
      STOP: "stop",
      MAX_TOKENS: "length",
      SAFETY: "content_filter",
      RECITATION: "content_filter",
    };
    return map[reason] ?? "stop";
  }

  extractUsage(response: any): TokenUsage {
    const meta = response?.usageMetadata;
    return {
      prompt_tokens: meta?.promptTokenCount ?? 0,
      completion_tokens: meta?.candidatesTokenCount ?? 0,
      total_tokens: meta?.totalTokenCount ?? 0,
    };
  }
}
