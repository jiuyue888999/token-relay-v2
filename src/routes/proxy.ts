import { Hono } from "hono";
import type { Context } from "hono";
import { userAuth } from "../middleware/auth.js";
import { rateLimiter } from "../middleware/rate-limit.js";
import { getAdapter, ALL_MODELS } from "../providers/index.js";
import { getNextKey } from "../services/key-manager.js";
import { calculateQuotaCost, deductQuota, logUsage, getUserQuota } from "../services/billing.js";
import type { ChatRequest, TokenUsage } from "../providers/types.js";
import type { GeminiAdapter } from "../providers/gemini.js";

const proxy = new Hono();

// All proxy routes require user auth + rate limiting
proxy.use("/*", userAuth);
proxy.use("/*", rateLimiter);

/**
 * GET /v1/models — Return available models (OpenAI-compatible).
 */
proxy.get("/models", (c) => {
  const type = c.req.query("type"); // optional filter: chat, image, video
  let models = ALL_MODELS;

  // Add image models (2026 最新)
  models = models.concat([
    { id: "seedream/seedream-5.0-lite", object: "model", owned_by: "bytedance", type: "image", description: "即梦 Seedream 5.0 Lite · RAG增强 · 角色一致性 · 2026.2", edition: "2026" },
    { id: "dall-e-3", object: "model", owned_by: "openai", type: "image", description: "DALL·E 3 · 经典文生图标杆", edition: "2024" },
    { id: "midjourney/7.0", object: "model", owned_by: "midjourney", type: "image", description: "Midjourney 7.0 · 艺术品质天花板", edition: "2026" },
    { id: "flux/flux-pro", object: "model", owned_by: "blackforest", type: "image", description: "Flux Pro · 开源最强出图 · 照片级真实", edition: "2025" },
    { id: "wanxiang/qwen-image-max", object: "model", owned_by: "alibaba", type: "image", description: "通义万相 Max · 中文理解王者", edition: "2025" },
    { id: "imagen/imagen-4", object: "model", owned_by: "google", type: "image", description: "Google Imagen 4 · 超写实渲染", edition: "2026" },
  ] as any);

  // Add video models (2026 最新)
  models = models.concat([
    { id: "seedance/seedance-2.0", object: "model", owned_by: "bytedance", type: "video", description: "🔥 Seedance 2.0 · 导演级可控 · 多镜头叙事 · 2026.2", edition: "2026" },
    { id: "kling/kling-3.0", object: "model", owned_by: "kuaishou", type: "video", description: "可灵 Kling 3.0 · 动作大师 · 3分钟1080P", edition: "2026" },
    { id: "sora/sora-2", object: "model", owned_by: "openai", type: "video", description: "Sora 2 · 物理模拟器 · 可变帧率", edition: "2026" },
    { id: "runway/gen-4", object: "model", owned_by: "runway", type: "video", description: "Runway Gen-4 · 好莱坞级画质", edition: "2026" },
    { id: "veo/veo-3.1", object: "model", owned_by: "google", type: "video", description: "Google Veo 3.1 · 超高清+世界模型", edition: "2026" },
    { id: "pika/pika-2.2", object: "model", owned_by: "pika", type: "video", description: "Pika 2.2 · 创意短视频 · 特效丰富", edition: "2026" },
    { id: "luma/luma-ray-2", object: "model", owned_by: "luma", type: "video", description: "Luma Ray 2 · 真实感视频生成", edition: "2026" },
    { id: "hailuo/hailuo-02", object: "model", owned_by: "minimax", type: "video", description: "海螺 AI 02 · 国产性价比之选", edition: "2026" },
  ] as any);

  if (type) {
    models = models.filter((m: any) => m.type === type);
  }

  return c.json({ object: "list", data: models });
});

/**
 * POST /v1/chat/completions — Main proxy endpoint.
 * Handles both streaming and non-streaming chat completions.
 */
proxy.post("/chat/completions", async (c) => {
  const userId = c.get("userId") as string;
  const body = (await c.req.json()) as ChatRequest;
  const isStream = body.stream === true;

  // Determine provider and adapter
  const provider = getProvider(body.model);
  const adapter = getAdapter(provider);
  if (!adapter) {
    return c.json(
      { error: { message: `Unsupported model or provider: ${body.model}`, type: "invalid_request_error" } },
      400
    );
  }

  // Map model name
  body.model = adapter.mapModel(body.model);

  // Get upstream key
  const upstreamKey = getNextKey(provider);
  if (!upstreamKey) {
    return c.json(
      { error: { message: `No active upstream key for provider: ${provider}`, type: "server_error" } },
      503
    );
  }

  // Build upstream request
  let url: string;
  const headers = adapter.buildHeaders(upstreamKey.api_key);

  if (adapter.provider === "gemini") {
    const geminiAdapter = adapter as unknown as GeminiAdapter;
    url = geminiAdapter.buildUrl(body, upstreamKey.api_key, upstreamKey.base_url);
  } else {
    url = adapter.getEndpoint(upstreamKey.base_url);
  }

  const upstreamBody = JSON.stringify(adapter.buildRequest(body));

  // Forward to upstream
  try {
    const upstreamResp = await fetch(url, {
      method: "POST",
      headers,
      body: upstreamBody,
    });

    if (!upstreamResp.ok) {
      const errText = await upstreamResp.text();
      console.error(`[${provider}] Upstream error ${upstreamResp.status}:`, errText.slice(0, 500));

      // Log failed usage
      logUsage({
        user_id: userId,
        upstream_key_id: upstreamKey.id,
        provider,
        model: body.model,
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        quota_cost: 0,
        success: false,
        error_msg: `Upstream ${upstreamResp.status}: ${errText.slice(0, 200)}`,
      });

      return c.json(
        { error: { message: `Upstream error: ${upstreamResp.status}`, type: "upstream_error" } },
        502
      );
    }

    // ── Streaming path ─────────────────────────────────────────
    if (isStream) {
      return handleStreaming(c, upstreamResp, userId, upstreamKey.id, provider, body.model, adapter);
    }

    // ── Non-streaming path ─────────────────────────────────────
    const respData = await upstreamResp.json();
    const usage: TokenUsage = adapter.extractUsage(respData);

    // Bill it
    const quotaCost = calculateQuotaCost(body.model, usage);
    const deductResult = deductQuota(userId, body.model, usage);

    logUsage({
      user_id: userId,
      upstream_key_id: upstreamKey.id,
      provider,
      model: body.model,
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      total_tokens: usage.total_tokens,
      quota_cost: quotaCost,
      success: deductResult.success,
    });

    // Enrich response with billing info
    respData._billing = {
      quota_cost: quotaCost,
      quota_remaining: deductResult.remaining,
    };

    if (!deductResult.success) {
      respData._billing.warning = "Insufficient quota. Request will be blocked next time.";
    }

    return c.json(respData);
  } catch (err: any) {
    console.error(`[${provider}] Proxy error:`, err.message);
    return c.json(
      { error: { message: `Proxy error: ${err.message}`, type: "proxy_error" } },
      500
    );
  }
});

/**
 * Handle streaming response — translate upstream SSE to OpenAI SSE format.
 */
function handleStreaming(
  c: Context,
  upstreamResp: Response,
  userId: string,
  upstreamKeyId: string,
  provider: string,
  model: string,
  adapter: NonNullable<ReturnType<typeof getAdapter>>
): Response {
  const reader = upstreamResp.body?.getReader();
  if (!reader) {
    return c.json({ error: { message: "No response body from upstream" } }, 500);
  }

  let accumulatedUsage: TokenUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  let finalChunkSent = false;

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          buffer += text;

          // Process SSE lines
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            // Anthropic SSE format: event lines + data lines
            // OpenAI SSE format: "data: {...}"
            // Gemini SSE format: "data: {...}"

            if (adapter.provider === "anthropic") {
              // Anthropic sends event: + data: pairs
              // We handle them by collecting data lines and parsing as JSON
              if (line.startsWith("data: ")) {
                const dataStr = line.slice(6);
                if (dataStr === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(dataStr);
                  const chunk = adapter.parseStreamChunk(parsed);
                  if (chunk) {
                    controller.enqueue(encoder.encode(chunk));
                  }
                  // Accumulate usage from message_delta events
                  if (parsed.type === "message_delta" && parsed.usage) {
                    accumulatedUsage.prompt_tokens = parsed.usage.input_tokens ?? 0;
                    accumulatedUsage.completion_tokens = parsed.usage.output_tokens ?? 0;
                    accumulatedUsage.total_tokens =
                      accumulatedUsage.prompt_tokens + accumulatedUsage.completion_tokens;
                  }
                } catch {
                  // Non-JSON data, ignore
                }
              }
            } else if (adapter.provider === "gemini") {
              // Gemini uses "data: {...}" SSE format
              if (line.startsWith("data: ")) {
                const dataStr = line.slice(6);
                if (dataStr === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(dataStr);
                  // Accumulate usage
                  if (parsed.usageMetadata) {
                    accumulatedUsage.prompt_tokens = parsed.usageMetadata.promptTokenCount ?? 0;
                    accumulatedUsage.completion_tokens =
                      parsed.usageMetadata.candidatesTokenCount ?? 0;
                    accumulatedUsage.total_tokens =
                      accumulatedUsage.prompt_tokens + accumulatedUsage.completion_tokens;
                  }
                  const chunk = adapter.parseStreamChunk(parsed);
                  if (chunk) {
                    controller.enqueue(encoder.encode(chunk));
                  }
                } catch {
                  // Non-JSON data, ignore
                }
              }
            } else {
              // OpenAI-compatible: pass through SSE data lines
              if (line.startsWith("data: ")) {
                const dataStr = line.slice(6);
                if (dataStr === "[DONE]") {
                  // Send [DONE] signal
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  finalChunkSent = true;
                  continue;
                }
                try {
                  const parsed = JSON.parse(dataStr);
                  // Accumulate usage from last chunk
                  if (parsed.usage) {
                    accumulatedUsage = {
                      prompt_tokens: parsed.usage.prompt_tokens ?? 0,
                      completion_tokens: parsed.usage.completion_tokens ?? 0,
                      total_tokens: parsed.usage.total_tokens ?? 0,
                    };
                  }
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(parsed)}\n\n`));
                } catch {
                  controller.enqueue(encoder.encode(`${line}\n`));
                }
              }
            }
          }
        }

        // Finish streaming — log billing
        if (!finalChunkSent) {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        }

        if (accumulatedUsage.total_tokens > 0) {
          const quotaCost = calculateQuotaCost(model, accumulatedUsage);
          deductQuota(userId, model, accumulatedUsage);
          logUsage({
            user_id: userId,
            upstream_key_id: upstreamKeyId,
            provider,
            model,
            prompt_tokens: accumulatedUsage.prompt_tokens,
            completion_tokens: accumulatedUsage.completion_tokens,
            total_tokens: accumulatedUsage.total_tokens,
            quota_cost: quotaCost,
            success: true,
          });
        }

        controller.close();
      } catch (err: any) {
        console.error(`[${provider}] Stream error:`, err.message);
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

/**
 * Get user's current quota information.
 */
proxy.get("/quota", (c) => {
  const userId = c.get("userId") as string;
  const quota = getUserQuota(userId);
  return quota ? c.json(quota) : c.json({ error: "User not found" }, 404);
});

function getProvider(model: string): string {
  const m = model.toLowerCase();
  if (m.startsWith("claude")) return "anthropic";
  if (m.startsWith("gemini")) return "gemini";
  if (m.startsWith("deepseek")) return "deepseek";
  return "openai";
}

export { proxy };
