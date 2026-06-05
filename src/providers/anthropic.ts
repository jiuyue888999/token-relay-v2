import type { ProviderAdapter, ChatRequest, ChatMessage, TokenUsage } from "./types.js";

export class AnthropicAdapter implements ProviderAdapter {
  readonly provider = "anthropic";

  mapModel(model: string): string {
    // Common aliases → real Anthropic model IDs
    const aliases: Record<string, string> = {
      "claude-sonnet-4-6": "claude-sonnet-4-6-20250514",
      "claude-haiku-4-5": "claude-haiku-4-5-20251001",
      "claude-opus-4-8": "claude-opus-4-8-20251101",
      "claude-3.5-sonnet": "claude-3-5-sonnet-20241022",
    };
    return aliases[model] ?? model;
  }

  buildRequest(req: ChatRequest): any {
    // Extract system message(s) and rest
    let system: string | Array<{ type: "text"; text: string }> | undefined;
    const messages: ChatMessage[] = [];

    for (const msg of req.messages) {
      if (msg.role === "system") {
        const text = typeof msg.content === "string" ? msg.content : extractText(msg.content);
        if (text) {
          system = system ? `${system}\n\n${text}` : text;
        }
      } else {
        messages.push(msg);
      }
    }

    // Build Anthropic messages array
    const anthropicMessages = this.convertMessages(messages);

    const body: any = {
      model: req.model,
      messages: anthropicMessages,
      stream: req.stream ?? false,
      max_tokens: req.max_tokens ?? 4096,
    };
    if (system) body.system = system;
    if (req.temperature != null) body.temperature = req.temperature;
    if (req.top_p != null) body.top_p = req.top_p;
    if (req.top_k != null) body.top_k = req.top_k;
    if (req.stop) body.stop_sequences = req.stop;
    if (req.thinking) body.thinking = req.thinking;

    return body;
  }

  private convertMessages(messages: ChatMessage[]): any[] {
    // Anthropic requires alternating user/assistant, no consecutive same-role
    const result: any[] = [];
    for (const msg of messages) {
      let role: string;
      if (msg.role === "assistant" || msg.role === "function" || msg.role === "tool") {
        role = "assistant";
      } else {
        role = "user";
      }

      // Merge consecutive same-role messages
      const content = typeof msg.content === "string" ? msg.content : msg.content;

      const last = result[result.length - 1];
      if (last && last.role === role) {
        // Merge content
        if (typeof last.content === "string" && typeof content === "string") {
          last.content += "\n" + content;
        } else {
          result.push({ role, content });
        }
      } else {
        result.push({ role, content });
      }
    }

    // Ensure starts with user
    if (result.length > 0 && result[0].role !== "user") {
      result.unshift({ role: "user", content: "Hello" });
    }

    return result;
  }

  buildHeaders(apiKey: string): Record<string, string> {
    return {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    };
  }

  getEndpoint(baseUrl?: string | null): string {
    const base = baseUrl || "https://api.anthropic.com";
    return `${base.replace(/\/$/, "")}/v1/messages`;
  }

  parseStreamChunk(chunk: any): string | null {
    if (!chunk) return null;
    // Anthropic SSE events: event: content_block_delta / message_delta / ping
    const eventType = chunk.type || chunk.event;

    if (eventType === "content_block_delta") {
      const delta = chunk.delta;
      if (delta?.type === "text_delta") {
        // Convert to OpenAI SSE format
        const openaiChunk = {
          id: "chatcmpl-" + Math.random().toString(36).slice(2, 10),
          object: "chat.completion.chunk",
          created: Math.floor(Date.now() / 1000),
          model: "claude",
          choices: [
            {
              index: 0,
              delta: { content: delta.text },
              finish_reason: null,
            },
          ],
        };
        return `data: ${JSON.stringify(openaiChunk)}\n\n`;
      }
      if (delta?.type === "thinking_delta") {
        // Pass thinking as content for now
        const openaiChunk = {
          id: "chatcmpl-" + Math.random().toString(36).slice(2, 10),
          object: "chat.completion.chunk",
          created: Math.floor(Date.now() / 1000),
          model: "claude",
          choices: [
            {
              index: 0,
              delta: { content: delta.thinking || "" },
              finish_reason: null,
            },
          ],
        };
        return `data: ${JSON.stringify(openaiChunk)}\n\n`;
      }
    }

    if (eventType === "message_delta") {
      const delta = chunk.delta;
      const openaiChunk = {
        id: "chatcmpl-" + Math.random().toString(36).slice(2, 10),
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1000),
        model: "claude",
        choices: [
          {
            index: 0,
            delta: {},
            finish_reason: delta?.stop_reason || "stop",
          },
        ],
        usage: chunk.usage
          ? {
              prompt_tokens: chunk.usage.input_tokens ?? 0,
              completion_tokens: chunk.usage.output_tokens ?? 0,
              total_tokens: (chunk.usage.input_tokens ?? 0) + (chunk.usage.output_tokens ?? 0),
            }
          : undefined,
      };
      return `data: ${JSON.stringify(openaiChunk)}\n\n`;
    }

    if (eventType === "message_start") {
      return null; // Don't forward message_start
    }

    if (eventType === "ping") {
      return null; // Don't forward pings
    }

    return null;
  }

  extractUsage(response: any): TokenUsage {
    const usage = response?.usage;
    return {
      prompt_tokens: usage?.input_tokens ?? 0,
      completion_tokens: usage?.output_tokens ?? 0,
      total_tokens: (usage?.input_tokens ?? 0) + (usage?.output_tokens ?? 0),
    };
  }
}

function extractText(content: string | any[]): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("\n");
  }
  return "";
}
