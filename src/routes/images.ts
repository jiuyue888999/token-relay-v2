/**
 * Image Generation Proxy — OpenAI-compatible /v1/images/generations
 *
 * Supports: DALL-E (OpenAI), 即梦/Jimeng (ByteDance), 通义万相 (Alibaba),
 *           Midjourney (via proxy), Stable Diffusion/Flux (via Replicate/Fal/etc.)
 *
 * For non-OpenAI providers, we translate to the closest approximation.
 * Most return URLs or base64 images in a normalized format.
 */
import { Hono } from "hono";
import type { Context } from "hono";
import { userAuth } from "../middleware/auth.js";
import { rateLimiter } from "../middleware/rate-limit.js";
import { getNextKey } from "../services/key-manager.js";
import { calculateQuotaCost, deductQuota, logUsage } from "../services/billing.js";

const images = new Hono();
images.use("/*", userAuth);
images.use("/*", rateLimiter);

// Image generation pricing (quota units per image at default size, updated June 2026)
const IMAGE_COSTS: Record<string, number> = {
  "seedream-5": 3000,
  "seedream": 3000,
  "dall-e-3": 5000,
  "dall-e-2": 2000,
  "jimeng": 3000,
  "wanxiang": 3000,
  "midjourney-7": 8000,
  "midjourney": 8000,
  "flux-pro": 2500,
  "flux": 2000,
  "imagen-4": 6000,
  "imagen": 6000,
  "sd": 1000,
};

interface ImageRequest {
  model?: string;
  prompt: string;
  n?: number;
  size?: string;
  quality?: string;
  style?: string;
  response_format?: "url" | "b64_json";
}

/**
 * POST /v1/images/generations
 */
images.post("/generations", async (c) => {
  const userId = c.get("userId") as string;
  const body = (await c.req.json()) as ImageRequest;
  const model = body.model || "dall-e-3";
  const n = body.n || 1;

  if (!body.prompt) {
    return c.json({ error: { message: "prompt is required", type: "invalid_request_error" } }, 400);
  }
  if (body.prompt.length > 4000) {
    return c.json({ error: { message: "prompt too long (max 4000)", type: "invalid_request_error" } }, 400);
  }

  // Determine provider from model
  let provider: string;
  if (model.startsWith("dall-e")) provider = "openai";
  else if (model.startsWith("jimeng")) provider = "doubao";
  else if (model.startsWith("wanxiang")) provider = "qwen";
  else if (model.includes("midjourney")) provider = "openai"; // Midjourney is often proxied through OpenAI-compatible APIs
  else if (model.includes("flux") || model.includes("sd")) provider = "openai"; // SD/Flux via compat API
  else provider = "openai";

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
  let headers: Record<string, string>;
  let upstreamBody: any;

  if (provider === "openai" && model.startsWith("dall-e")) {
    // Native DALL-E endpoint
    const base = upstreamKey.base_url || "https://api.openai.com";
    url = `${base.replace(/\/$/, "")}/v1/images/generations`;
    headers = {
      Authorization: `Bearer ${upstreamKey.api_key}`,
      "Content-Type": "application/json",
    };
    upstreamBody = { model, prompt: body.prompt, n, size: body.size || "1024x1024", quality: body.quality || "standard", response_format: body.response_format || "url" };
    if (body.style) upstreamBody.style = body.style;
  } else {
    // OpenAI-compatible image endpoint (通用)
    const base = upstreamKey.base_url || (provider === "qwen" ? "https://dashscope.aliyuncs.com/compatible-mode" : provider === "doubao" ? "https://ark.cn-beijing.volces.com/api/v3" : "https://api.openai.com");
    url = `${base.replace(/\/$/, "")}/v1/images/generations`;
    headers = {
      Authorization: `Bearer ${upstreamKey.api_key}`,
      "Content-Type": "application/json",
    };
    upstreamBody = { model: model.replace(/^(jimeng|wanxiang)\//, ""), prompt: body.prompt, n, size: body.size || "1024x1024", response_format: body.response_format || "url" };
  }

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(upstreamBody),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error(`[image:${provider}] Upstream error:`, errText.slice(0, 300));
      logUsage({
        user_id: userId,
        upstream_key_id: upstreamKey.id,
        provider,
        model,
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        quota_cost: 0,
        success: false,
        error_msg: `Image upstream ${resp.status}`,
      });
      return c.json(
        { error: { message: `Image generation failed: ${resp.status}`, type: "upstream_error" } },
        502
      );
    }

    const data = await resp.json();

    // Calculate cost
    const costPerImage = IMAGE_COSTS[model] || IMAGE_COSTS["dall-e-3"] || 3000;
    const totalCost = costPerImage * (data.data?.length || n);
    const imageCount = data.data?.length || n;

    // Estimate token equivalent for billing
    const tokenUsage = { prompt_tokens: totalCost, completion_tokens: 0, total_tokens: totalCost };
    const deductResult = deductQuota(userId, model, tokenUsage);

    logUsage({
      user_id: userId,
      upstream_key_id: upstreamKey.id,
      provider,
      model,
      prompt_tokens: totalCost,
      completion_tokens: 0,
      total_tokens: totalCost,
      quota_cost: totalCost,
      success: deductResult.success,
    });

    // Enrich response
    const result = {
      created: Date.now(),
      data: data.data || data.images || data.output?.results || [],
      _billing: {
        images: imageCount,
        quota_cost: totalCost,
        quota_remaining: deductResult.remaining,
      },
    };

    return c.json(result);
  } catch (err: any) {
    console.error(`[image:${provider}] Error:`, err.message);
    return c.json({ error: { message: `Image proxy error: ${err.message}`, type: "proxy_error" } }, 500);
  }
});

export { images };
