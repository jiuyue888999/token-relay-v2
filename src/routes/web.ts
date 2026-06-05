import { Hono } from "hono";
import type { Context } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { all, get as dbGet, run } from "../db/index.js";
import { config } from "../config.js";
import { homePage } from "../web/home.js";
import { loginPage, registerPage } from "../web/auth.js";
import { dashboardPage, type DashboardData } from "../web/dashboard.js";
import { adminPage, type AdminData } from "../web/admin-panel.js";
import { keyHealthSummary } from "../services/key-manager.js";
import { getUserQuota } from "../services/billing.js";

const web = new Hono();

// JWT secret (derived from admin key)
const JWT_SECRET = new TextEncoder().encode(
  config.adminApiKey + "-web-jwt-secret-salt"
);

async function signToken(payload: Record<string, any>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .setIssuedAt()
    .sign(JWT_SECRET);
}

async function verifyToken(token: string): Promise<Record<string, any> | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as Record<string, any>;
  } catch {
    return null;
  }
}

/** Get current user from JWT cookie, or null if not logged in */
async function getWebUser(c: Context): Promise<{ userId: string; email: string; displayName: string; isAdmin: boolean } | null> {
  const token = getCookie(c, "tr_session");
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;

  // Verify user still exists and is active
  const user = dbGet<{ is_active: number; display_name: string }>(
    "SELECT is_active, display_name FROM users WHERE id = ?",
    payload.userId
  );
  if (!user || !user.is_active) return null;

  return {
    userId: payload.userId as string,
    email: payload.email as string,
    displayName: payload.displayName as string,
    isAdmin: payload.isAdmin as boolean,
  };
}

/** Require login. Redirects to /login if not authenticated. */
async function requireAuth(c: Context): Promise<Record<string, any> | null> {
  const user = await getWebUser(c);
  if (!user) {
    // Not a redirect — return null so caller can handle
  }
  return user;
}

// ─── PUBLIC PAGES ──────────────────────────────────────────────

// Homepage
web.get("/", async (c) => {
  const user = await getWebUser(c);
  const html = homePage({
    title: "新一代 AI 模型聚合中转",
    user: user ? { display_name: user.displayName, email: user.email } : null,
  });
  return c.html(html);
});

// Login page
web.get("/login", async (c) => {
  const user = await getWebUser(c);
  if (user) return c.redirect("/dashboard");
  return c.html(loginPage({ title: "登录" }));
});

web.post("/login", async (c) => {
  const body = await c.req.parseBody();
  const email = String(body.email || "").trim();
  const password = String(body.password || "");

  if (!email || !password) {
    return c.html(loginPage({ title: "登录" }, "请填写邮箱和密码"));
  }

  const user = dbGet<{ id: string; email: string; display_name: string; password_hash: string; is_active: number }>(
    "SELECT id, email, display_name, password_hash, is_active FROM users WHERE email = ?",
    email
  );

  if (!user || !user.is_active) {
    return c.html(loginPage({ title: "登录" }, "邮箱不存在或账户已停用"));
  }

  if (!user.password_hash) {
    return c.html(loginPage({ title: "登录" }, "此账户未设置密码，请联系管理员"));
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return c.html(loginPage({ title: "登录" }, "密码错误"));
  }

  // Sign JWT
  const token = await signToken({
    userId: user.id,
    email: user.email,
    displayName: user.display_name || user.email,
    isAdmin: user.email === "admin@token-relay.local",
  });

  setCookie(c, "tr_session", token, {
    httpOnly: true,
    secure: false, // Set true in production with HTTPS
    sameSite: "Lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });

  return c.redirect("/dashboard");
});

// Register page
web.get("/register", async (c) => {
  const user = await getWebUser(c);
  if (user) return c.redirect("/dashboard");
  return c.html(registerPage({ title: "免费注册" }));
});

web.post("/register", async (c) => {
  const body = await c.req.parseBody();
  const email = String(body.email || "").trim();
  const display_name = String(body.display_name || "").trim();
  const password = String(body.password || "");

  if (!email || !display_name || !password) {
    return c.html(registerPage({ title: "免费注册" }, "请填写所有必填字段"));
  }
  if (password.length < 6) {
    return c.html(registerPage({ title: "免费注册" }, "密码至少需要6位"));
  }

  // Check if email exists
  const existing = dbGet<{ id: string }>("SELECT id FROM users WHERE email = ?", email);
  if (existing) {
    return c.html(registerPage({ title: "免费注册" }, "该邮箱已被注册"));
  }

  const id = `user_${uuidv4().slice(0, 8)}`;
  const apiKey = `sk-${uuidv4().replace(/-/g, "")}`;
  const passwordHash = bcrypt.hashSync(password, 10);

  // Get trial package
  const trialPkg = dbGet<{ quota_amount: number }>(
    "SELECT quota_amount FROM packages WHERE id = 'pkg_trial' AND is_active = 1"
  );
  const trialQuota = trialPkg?.quota_amount ?? 100000;

  try {
    run(
      `INSERT INTO users (id, email, password_hash, api_key, display_name, quota_remaining)
       VALUES (?, ?, ?, ?, ?, ?)`,
      id, email, passwordHash, apiKey, display_name, trialQuota
    );

    // Log trial recharge
    run(
      `INSERT INTO recharge_logs (id, user_id, package_id, quota_amount)
       VALUES (?, ?, ?, ?)`,
      `rch_${uuidv4().slice(0, 8)}`, id, "pkg_trial", trialQuota
    );
  } catch (err: any) {
    return c.html(registerPage({ title: "免费注册" }, "注册失败，请稍后重试"));
  }

  // Auto-login
  const token = await signToken({
    userId: id,
    email,
    displayName: display_name,
    isAdmin: false,
  });

  setCookie(c, "tr_session", token, {
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return c.redirect("/dashboard");
});

// Logout
web.get("/logout", (c) => {
  deleteCookie(c, "tr_session", { path: "/" });
  return c.redirect("/");
});

// ─── PROTECTED PAGES ───────────────────────────────────────────

// Dashboard
web.get("/dashboard", async (c) => {
  const auth = await requireAuth(c);
  if (!auth) return c.redirect("/login");

  const user = dbGet<Record<string, any>>(
    `SELECT id, email, display_name, api_key, quota_remaining, total_quota_used, created_at
     FROM users WHERE id = ?`,
    auth.userId
  );

  if (!user) return c.redirect("/login");

  const recentLogs = all<Record<string, any>>(
    `SELECT id, provider, model, prompt_tokens, completion_tokens, total_tokens, quota_cost, success, error_msg, created_at
     FROM usage_logs WHERE user_id = ?
     ORDER BY created_at DESC LIMIT 50`,
    auth.userId
  );

  const data: DashboardData = {
    user: {
      id: String(user.id),
      email: String(user.email ?? ''),
      display_name: String(user.display_name ?? ''),
      api_key: String(user.api_key ?? ''),
      quota_remaining: Number(user.quota_remaining ?? 0),
      total_quota_used: Number(user.total_quota_used ?? 0),
      created_at: String(user.created_at ?? ''),
    },
    recentLogs: recentLogs.map(r => ({
      id: String(r.id),
      provider: String(r.provider),
      model: String(r.model),
      prompt_tokens: Number(r.prompt_tokens),
      completion_tokens: Number(r.completion_tokens),
      total_tokens: Number(r.total_tokens),
      quota_cost: Number(r.quota_cost),
      success: Number(r.success),
      error_msg: r.error_msg ? String(r.error_msg) : null,
      created_at: String(r.created_at),
    })),
  };

  const html = dashboardPage({
    title: "控制台",
    user: { display_name: auth.displayName, email: auth.email },
    data,
  });
  return c.html(html);
});

// Admin panel (web)
web.get("/admin", async (c) => {
  const auth = await requireAuth(c);
  if (!auth || !auth.isAdmin) {
    return c.html(`<html><body><h2>需要管理员权限</h2><a href="/login">登录</a></body></html>`, 403 as any);
  }

  const keys = all<Record<string, any>>("SELECT * FROM upstream_keys ORDER BY priority DESC, created_at ASC");
  const users = all<Record<string, any>>("SELECT * FROM users ORDER BY created_at DESC");
  const packages = all<Record<string, any>>("SELECT * FROM packages ORDER BY price_cents ASC");

  const totalUsage = dbGet<{ total_tokens: number; total_cost: number }>(
    "SELECT COALESCE(SUM(total_tokens), 0) as total_tokens, COALESCE(SUM(quota_cost), 0) as total_cost FROM usage_logs WHERE success = 1"
  );
  const byProvider = all<Record<string, any>>(
    `SELECT provider, SUM(total_tokens) as tokens, COUNT(*) as requests
     FROM usage_logs WHERE success = 1 GROUP BY provider ORDER BY tokens DESC`
  );
  const userCount = dbGet<{ cnt: number }>("SELECT COUNT(*) as cnt FROM users");
  const activeKeyCount = dbGet<{ cnt: number }>("SELECT COUNT(*) as cnt FROM upstream_keys WHERE is_active = 1");

  const stats = {
    total: totalUsage || { total_tokens: 0, total_cost: 0 },
    by_provider: byProvider,
    user_count: userCount?.cnt ?? 0,
    active_keys: activeKeyCount?.cnt ?? 0,
  };

  const data: AdminData = { keys, users, packages, stats };
  const html = adminPage({
    title: "管理面板",
    user: { display_name: auth.displayName, email: auth.email },
    admin: true,
    data,
  });
  return c.html(html);
});

export { web };
