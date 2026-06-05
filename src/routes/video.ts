/**
 * Video Generation Proxy — /v1/video/generations
 *
 * Supports: Sora (OpenAI), 可灵/Kling (Kuaishou), Runway Gen-4, Pika,
 *           即梦视频 (ByteDance), Luma Dream Machine, 海螺/Hailuo (MiniMax)
 *
 * Unified workflow:
 *   1. POST /v1/video/generations → create task, return task_id
 *   2. GET  /v1/video/generations/:id → check status, get video URL when done
 */
import { Hono } from "hono";
import type { Context } from "hono";
import { userAuth } from "../middleware/auth.js";
import { rateLimiter } from "../middleware/rate-limit.js";
import { getNextKey } from "../services/key-manager.js";
import { deductQuota, logUsage } from "../services/billing.js";

const video = new Hono();
video.use("/*", userAuth);
video.use("/*", rateLimiter);

// Video generation costs (quota units per generation, updated June 2026)
const VIDEO_COSTS: Record<string, number> = {
  seedance: 8000,
  kling: 15000,
  sora: 50000,
  runway: 30000,
  veo: 40000,
  pika: 10000,
  luma: 12000,
  hailuo: 8000,
};

// In-memory task store (for demo purposes; use DB in production)
const taskStore: Map<string, { status: string; videoUrl?: string; error?: string; created: number }> = new Map();

interface VideoRequest {
  model?: string;
  prompt: string;
  duration?: number;       // seconds (5, 10, etc.)
  resolution?: string;     // "720p", "1080p"
  aspect_ratio?: string;   // "16:9", "9:16", "1:1"
  negative_prompt?: string;
  style?: string;
}

/**
 * POST /v1/video/generations — Create a video generation task
 */
video.post("/generations", async (c) => {
  const userId = c.get("userId") as string;
  const body = (await c.req.json()) as VideoRequest;
  const model = body.model || "kling";

  if (!body.prompt) {
    return c.json({ error: { message: "prompt is required", type: "invalid_request_error" } }, 400);
  }

  // Determine provider from model
  let provider: string;
  const m = model.toLowerCase();
  if (m.startsWith("seedance")) provider = "seedance";
  else if (m.startsWith("sora")) provider = "openai";
  else if (m.startsWith("kling")) provider = "kling";
  else if (m.startsWith("runway")) provider = "runway";
  else if (m.startsWith("veo")) provider = "google";
  else if (m.startsWith("pika")) provider = "pika";
  else if (m.startsWith("luma")) provider = "luma";
  else if (m.startsWith("hailuo")) provider = "minimax";
  else provider = "seedance";

  // Get upstream key
  const upstreamKey = getNextKey(provider);
  if (!upstreamKey) {
    return c.json(
      { error: { message: `No active upstream key for video provider: ${provider}`, type: "server_error" } },
      503
    );
  }

  // Cost estimation
  const cost = VIDEO_COSTS[Object.keys(VIDEO_COSTS).find(k => m.startsWith(k)) || "kling"] || 15000;

  // Try to submit to upstream
  try {
    let url: string;
    let headers: Record<string, string>;
    let upstreamBody: any;

    // Build provider-specific request
    // For now, use a generic OpenAI-compatible endpoint pattern
    // Real providers will need their specific adapters
    const baseUrl = upstreamKey.base_url || getDefaultBase(provider);

    switch (provider) {
      case "kling":
        url = `${baseUrl}/v1/videos/generations`;
        headers = { Authorization: `Bearer ${upstreamKey.api_key}`, "Content-Type": "application/json" };
        upstreamBody = { model_name: model, prompt: body.prompt, duration: body.duration || 5, aspect_ratio: body.aspect_ratio || "16:9" };
        break;
      case "openai": // Sora
        url = `${baseUrl}/v1/video/generations`;
        headers = { Authorization: `Bearer ${upstreamKey.api_key}`, "Content-Type": "application/json" };
        upstreamBody = { model: "sora", prompt: body.prompt, size: body.resolution || "720p", duration: body.duration || 5 };
        break;
      default:
        // Generic OpenAI-compatible video endpoint
        url = `${baseUrl}/v1/video/generations`;
        headers = { Authorization: `Bearer ${upstreamKey.api_key}`, "Content-Type": "application/json" };
        upstreamBody = { model, prompt: body.prompt, duration: body.duration || 5 };
    }

    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(upstreamBody),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      console.error(`[video:${provider}] Upstream error:`, errText.slice(0, 300));
      logUsage({
        user_id: userId,
        upstream_key_id: upstreamKey.id,
        provider: `video:${provider}`,
        model,
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        quota_cost: 0,
        success: false,
        error_msg: `Video upstream ${resp.status}`,
      });
      return c.json(
        { error: { message: `Video generation request failed: ${resp.status}`, type: "upstream_error" } },
        502
      );
    }

    const data = await resp.json().catch(() => ({}));
    const taskId = data.id || data.task_id || `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Store task (upstream may give us immediate result or pending)
    taskStore.set(taskId, {
      status: data.status || "processing",
      videoUrl: data.video_url || data.output?.video_url || undefined,
      created: Date.now(),
    });

    // Estimate and deduct quota
    const tokenUsage = { prompt_tokens: cost, completion_tokens: 0, total_tokens: cost };
    const deductResult = deductQuota(userId, `video:${model}`, tokenUsage);

    logUsage({
      user_id: userId,
      upstream_key_id: upstreamKey.id,
      provider: `video:${provider}`,
      model,
      prompt_tokens: cost,
      completion_tokens: 0,
      total_tokens: cost,
      quota_cost: cost,
      success: deductResult.success,
    });

    return c.json({
      id: taskId,
      object: "video.generation",
      status: taskStore.get(taskId)!.status,
      video_url: taskStore.get(taskId)!.videoUrl || null,
      created: taskStore.get(taskId)!.created,
      _billing: {
        quota_cost: cost,
        quota_remaining: deductResult.remaining,
      },
    }, 201);

  } catch (err: any) {
    console.error(`[video:${provider}] Error:`, err.message);
    return c.json({ error: { message: `Video proxy error: ${err.message}`, type: "proxy_error" } }, 500);
  }
});

/**
 * GET /v1/video/generations/:id — Check video generation status
 */
video.get("/generations/:id", (c) => {
  const { id } = c.req.param();
  const task = taskStore.get(id);

  if (!task) {
    return c.json({ error: { message: "Task not found", type: "not_found" } }, 404);
  }

  return c.json({
    id,
    object: "video.generation",
    status: task.status,
    video_url: task.videoUrl || null,
    created: task.created,
  });
});

function getDefaultBase(provider: string): string {
  const bases: Record<string, string> = {
    kling: "https://api.kling.kuaishou.com",
    runway: "https://api.runwayml.com",
    pika: "https://api.pika.art",
    luma: "https://api.lumalabs.ai",
    openai: "https://api.openai.com",
    doubao: "https://ark.cn-beijing.volces.com/api/v3",
    minimax: "https://api.minimax.chat",
  };
  return bases[provider] || "https://api.openai.com";
}

export { video };
