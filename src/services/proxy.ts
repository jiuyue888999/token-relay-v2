import type { ChatRequest, TokenUsage } from "../providers/types.js";
import { getAdapter, getProviderFromModel } from "../providers/index.js";
import { getNextKey } from "./key-manager.js";
import { deductQuota, logUsage } from "./billing.js";
import type { GeminiAdapter } from "../providers/gemini.js";

interface ProxyResult {
  /** Whether the request completed successfully */
  success: boolean;
  /** The upstream response body (non-streaming only) */
  data?: any;
  /** Extracted token usage */
  usage?: TokenUsage;
  /** Quota cost deducted */
  quotaCost?: number;
  /** Error message if failed */
  error?: string;
  /** HTTP status code for response */
  status: number;
  /** The upstream key ID used */
  upstreamKeyId?: string | null;
  /** The provider used */
  provider?: string;
}

/**
 * Proxy a chat completion request to the appropriate upstream provider.
 *
 * For streaming requests this returns immediately with success=true,
 * and the caller should use `createProxyStream` instead.
 */
export function prepareProxyRequest(req: ChatRequest): {
  adapter: ReturnType<typeof getAdapter>;
  upstreamKey: ReturnType<typeof getNextKey>;
  provider: string;
  mappedModel: string;
  error?: { status: number; message: string };
} {
  const provider = getProviderFromModel(req.model);
  const adapter = getAdapter(provider);

  if (!adapter) {
    return {
      adapter: undefined,
      upstreamKey: null,
      provider,
      mappedModel: req.model,
      error: { status: 400, message: `Unsupported provider: ${provider}` },
    };
  }

  // Map model name to provider-native name
  req.model = adapter.mapModel(req.model);

  const upstreamKey = getNextKey(provider);
  if (!upstreamKey) {
    return {
      adapter,
      upstreamKey: null,
      provider,
      mappedModel: req.model,
      error: { status: 503, message: `No active upstream key for provider: ${provider}` },
    };
  }

  return { adapter, upstreamKey, provider, mappedModel: req.model };
}

/**
 * Create the URL, headers, and body for the upstream request.
 */
export function buildUpstreamRequest(
  req: ChatRequest,
  adapter: NonNullable<ReturnType<typeof getAdapter>>,
  upstreamKey: NonNullable<ReturnType<typeof getNextKey>>
): { url: string; headers: Record<string, string>; body: string } {
  let url: string;
  let headers = adapter.buildHeaders(upstreamKey.api_key);

  // Gemini is special — API key goes in query param, not header
  if (adapter.provider === "gemini") {
    const geminiAdapter = adapter as unknown as GeminiAdapter;
    url = geminiAdapter.buildUrl(req, upstreamKey.api_key, upstreamKey.base_url);
  } else {
    url = adapter.getEndpoint(upstreamKey.base_url);
  }

  const body = JSON.stringify(adapter.buildRequest(req));

  return { url, headers, body };
}

/**
 * Process billing for a completed response (non-streaming).
 */
export function processBilling(
  userId: string,
  upstreamKeyId: string,
  provider: string,
  model: string,
  usage: TokenUsage
): { success: boolean; quotaCost: number; remaining: number } {
  const deductResult = deductQuota(userId, model, usage);

  logUsage({
    user_id: userId,
    upstream_key_id: upstreamKeyId,
    provider,
    model,
    prompt_tokens: usage.prompt_tokens,
    completion_tokens: usage.completion_tokens,
    total_tokens: usage.total_tokens,
    quota_cost: deductResult.cost,
    success: deductResult.success,
  });

  return {
    success: deductResult.success,
    quotaCost: deductResult.cost,
    remaining: deductResult.remaining,
  };
}
