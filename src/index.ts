import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { config } from "./config.js";
import { initDb, startAutoSave, saveDb, closeDb } from "./db/index.js";
import { admin } from "./routes/admin.js";
import { proxy } from "./routes/proxy.js";
import { images } from "./routes/images.js";
import { video } from "./routes/video.js";
import { web } from "./routes/web.js";

// ─── Initialize ────────────────────────────────────────────────

await initDb();
startAutoSave(30_000); // Save DB to disk every 30 seconds

const app = new Hono();

// ─── Global middleware ─────────────────────────────────────────

app.use("*", cors());

// Request logging
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${c.req.method} ${c.req.path} → ${c.res.status} (${ms}ms)`);
});

// Error handling
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json(
    {
      error: {
        message: "Internal server error",
        type: "internal_error",
      },
    },
    500
  );
});

// ─── Routes ────────────────────────────────────────────────────

// Web pages (homepage, login, dashboard, etc.)
app.route("/", web);

// Admin API (JSON)
app.route("/admin", admin);

// OpenAI-compatible proxy API — sub-routes registered BEFORE catch-all /v1
app.route("/v1/images", images);
app.route("/v1/video", video);
app.route("/v1", proxy);

// Health check (public)
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    version: "1.0.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ─── Shutdown ──────────────────────────────────────────────────

process.on("SIGINT", async () => {
  console.log("\nShutting down...");
  saveDb();
  await closeDb();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  saveDb();
  await closeDb();
  process.exit(0);
});

// ─── Start ─────────────────────────────────────────────────────

console.log(`
╔══════════════════════════════════════════════╗
║        🚀 Token Relay Station v2.0           ║
╠══════════════════════════════════════════════╣
║  网页:    http://localhost:${String(config.port).padEnd(20)}║
║  对话:    /v1/chat/completions              ║
║  图片:    /v1/images/generations            ║
║  视频:    /v1/video/generations             ║
║  管理:    /admin                            ║
╠══════════════════════════════════════════════╣
║  LLM ×13  | 图片 ×5  |  视频 ×7              ║
╚══════════════════════════════════════════════╝
`);

serve(
  {
    fetch: app.fetch,
    port: config.port,
    hostname: config.host,
  },
  (info) => {
    console.log(`Server listening on http://${config.host}:${info.port}`);
  }
);
