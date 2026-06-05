/**
 * OpenAI-compatible chat completion request (input format).
 * This is what users send to the relay — we translate it per provider.
 */
export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stop?: string[];
  frequency_penalty?: number;
  presence_penalty?: number;
  // Anthropic-specific (passed through)
  system?: string;
  thinking?: { budget_tokens: number };
  // Additional pass-through
  [key: string]: any;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "function" | "tool";
  content: string | ChatContentPart[];
  name?: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

export interface ChatContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string; detail?: string };
}

export interface UpstreamKey {
  id: string;
  provider: string;
  api_key: string;
  base_url: string | null;
  display_name: string | null;
  is_active: number;
  priority: number;
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ProviderAdapter {
  /** Provider identifier */
  readonly provider: string;
  /** Map supported model names to provider-native model names */
  mapModel(model: string): string;
  /** Build native request body from OpenAI-compatible request */
  buildRequest(req: ChatRequest): any;
  /** Build native request headers */
  buildHeaders(apiKey: string): Record<string, string>;
  /** Get the endpoint URL for chat completions */
  getEndpoint(baseUrl?: string | null): string;
  /** Parse native response → OpenAI-compatible chunk (for streaming) */
  parseStreamChunk(chunk: any): string | null;
  /** Extract token usage from native response */
  extractUsage(response: any): TokenUsage;
}
