import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { adminAuth } from "../middleware/auth.js";
import { all, get, run } from "../db/index.js";
import {
  addUpstreamKey,
  listUpstreamKeys,
  updateUpstreamKey,
  deleteUpstreamKey,
  keyHealthSummary,
} from "../services/key-manager.js";
import { rechargeUser, getUserQuota } from "../services/billing.js";
import { PROVIDERS } from "../providers/index.js";

const admin = new Hono();

// All admin routes require admin auth
admin.use("/*", adminAuth);

// ─── Health / Info ────────────────────────────────────────────

admin.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    providers: PROVIDERS,
    keys: keyHealthSummary(),
  });
});

// ─── Upstream Key CRUD ────────────────────────────────────────

admin.get("/keys", (c) => {
  const provider = c.req.query("provider");
  const keys = listUpstreamKeys(provider || undefined);
  return c.json({ keys });
});

admin.post("/keys", async (c) => {
  const body = await c.req.json();
  const { provider, api_key, base_url, display_name, priority } = body;

  if (!provider || !api_key) {
    return c.json({ error: "provider and api_key are required" }, 400);
  }

  if (!PROVIDERS.includes(provider)) {
    return c.json({ error: `Invalid provider. Supported: ${PROVIDERS.join(", ")}` }, 400);
  }

  const key = addUpstreamKey({ provider, api_key, base_url, display_name, priority });
  return c.json({ key }, 201);
});

admin.patch("/keys/:id", async (c) => {
  const { id } = c.req.param();
  const updates = await c.req.json();
  const ok = updateUpstreamKey(id, updates);
  return ok ? c.json({ success: true }) : c.json({ error: "Key not found or no changes" }, 404);
});

admin.delete("/keys/:id", (c) => {
  const { id } = c.req.param();
  const ok = deleteUpstreamKey(id);
  return ok ? c.json({ success: true }) : c.json({ error: "Key not found" }, 404);
});

// ─── User Management ──────────────────────────────────────────

admin.get("/users", (c) => {
  const users = all(
    "SELECT id, email, display_name, api_key, quota_remaining, total_quota_used, is_active, created_at FROM users ORDER BY created_at DESC"
  );
  return c.json({ users });
});

admin.post("/users", async (c) => {
  const body = await c.req.json();
  const { email, password, display_name, quota_remaining } = body;

  const id = `user_${uuidv4().slice(0, 8)}`;
  const apiKey = `sk-${uuidv4().replace(/-/g, "")}`;

  let passwordHash: string | null = null;
  if (password) {
    passwordHash = bcrypt.hashSync(password, 10);
  }

  try {
    run(
      `INSERT INTO users (id, email, password_hash, api_key, display_name, quota_remaining)
       VALUES (?, ?, ?, ?, ?, ?)`,
      id, email || null, passwordHash, apiKey, display_name || null, quota_remaining ?? 0
    );
  } catch (err: any) {
    if (err.message?.includes("UNIQUE")) {
      return c.json({ error: "Email or API key already exists" }, 409);
    }
    throw err;
  }

  const user = get(
    "SELECT id, email, display_name, api_key, quota_remaining, is_active, created_at FROM users WHERE id = ?",
    id
  );
  return c.json({ user }, 201);
});

admin.patch("/users/:id", async (c) => {
  const { id } = c.req.param();
  const { is_active } = await c.req.json();

  if (is_active === undefined) return c.json({ error: "is_active required" }, 400);

  const result = run(
    "UPDATE users SET is_active = ?, updated_at = datetime('now') WHERE id = ?",
    is_active ? 1 : 0, id
  );

  return result.changes > 0
    ? c.json({ success: true })
    : c.json({ error: "User not found" }, 404);
});

admin.post("/users/:id/recharge", async (c) => {
  const { id } = c.req.param();
  const { package_id } = await c.req.json();

  if (!package_id) return c.json({ error: "package_id is required" }, 400);

  const result = rechargeUser(id, package_id);
  return result.success
    ? c.json({ success: true, new_quota: result.newQuota })
    : c.json({ error: "Package not found or inactive" }, 400);
});

admin.get("/users/:id/quota", (c) => {
  const { id } = c.req.param();
  const quota = getUserQuota(id);
  return quota ? c.json(quota) : c.json({ error: "User not found" }, 404);
});

// ─── Packages ─────────────────────────────────────────────────

admin.get("/packages", (c) => {
  const packages = all("SELECT * FROM packages ORDER BY price_cents ASC");
  return c.json({ packages });
});

admin.post("/packages", async (c) => {
  const body = await c.req.json();
  const { name, description, quota_amount, price_cents } = body;

  if (!name || !quota_amount) {
    return c.json({ error: "name and quota_amount are required" }, 400);
  }

  const id = `pkg_${uuidv4().slice(0, 8)}`;
  run(
    `INSERT INTO packages (id, name, description, quota_amount, price_cents)
     VALUES (?, ?, ?, ?, ?)`,
    id, name, description || null, quota_amount, price_cents ?? 0
  );

  const pkg = get("SELECT * FROM packages WHERE id = ?", id);
  return c.json({ package: pkg }, 201);
});

// ─── Usage Statistics ─────────────────────────────────────────

admin.get("/stats", (c) => {
  const totalUsage = get<{ total_tokens: number; total_cost: number }>(
    "SELECT COALESCE(SUM(total_tokens), 0) as total_tokens, COALESCE(SUM(quota_cost), 0) as total_cost FROM usage_logs WHERE success = 1"
  );

  const dailyUsage = all(
    `SELECT date(created_at) as day, SUM(total_tokens) as tokens, SUM(quota_cost) as cost
     FROM usage_logs WHERE success = 1
     GROUP BY day ORDER BY day DESC LIMIT 30`
  );

  const byProvider = all(
    `SELECT provider, SUM(total_tokens) as tokens, COUNT(*) as requests
     FROM usage_logs WHERE success = 1
     GROUP BY provider ORDER BY tokens DESC`
  );

  const userCount = get<{ cnt: number }>("SELECT COUNT(*) as cnt FROM users");
  const activeKeyCount = get<{ cnt: number }>("SELECT COUNT(*) as cnt FROM upstream_keys WHERE is_active = 1");

  return c.json({
    total: totalUsage,
    daily: dailyUsage,
    by_provider: byProvider,
    user_count: userCount?.cnt ?? 0,
    active_keys: activeKeyCount?.cnt ?? 0,
  });
});

export { admin };
