import { Hono } from "hono";
import type { Context } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { all, get as dbGet, run, getDb } from "../db/index.js";
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

// ═══ Brute force check helper ══════════════════════════════
function checkBruteForce(ip: string, target: string): boolean {
  const recent = dbGet<{cnt:number}>(
    "SELECT COUNT(*) as cnt FROM login_attempts WHERE ip = ? AND success = 0 AND created_at > datetime('now', '-15 minutes')",
    ip
  );
  if (recent && recent.cnt >= 5) {
    return false;
  }
  return true;
}

function logLoginAttempt(ip: string, target: string, success: boolean) {
  run("INSERT INTO login_attempts (ip, target, success) VALUES (?, ?, ?)", ip, target, success ? 1 : 0);
}

web.post("/login", async (c) => {
  const body = await c.req.parseBody();
  const login = String(body.email || "").trim();
  const password = String(body.password || "");
  const code = String(body.code || "").trim();
  const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1";

  if (!login || !password) {
    return c.html(loginPage({ title: "登录" }, "请输入手机号/邮箱和密码"));
  }

  // Brute force check
  if (!checkBruteForce(ip, login)) {
    return c.html(loginPage({ title: "登录" }, "登录尝试过于频繁，请15分钟后再试"));
  }

  const user = dbGet<{ id: string; email: string; phone: string; display_name: string; password_hash: string; is_active: number }>(
    "SELECT id, email, phone, display_name, password_hash, is_active FROM users WHERE phone = ? OR email = ?",
    login, login
  );

  if (!user || !user.is_active) {
    logLoginAttempt(ip, login, false);
    return c.html(loginPage({ title: "登录" }, "账号不存在或已停用"));
  }

  if (!user.password_hash) {
    logLoginAttempt(ip, login, false);
    return c.html(loginPage({ title: "登录" }, "此账户未设置密码，请联系管理员"));
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    logLoginAttempt(ip, login, false);
    return c.html(loginPage({ title: "登录" }, "密码错误"));
  }

  // Login success
  logLoginAttempt(ip, login, true);

  const token = await signToken({
    userId: user.id,
    email: user.email || user.phone,
    displayName: user.display_name || user.phone,
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
  const phone = String(body.phone || "").trim();
  const email = String(body.email || "").trim() || null;
  const display_name = String(body.display_name || "").trim();
  const password = String(body.password || "");
  const code = String(body.code || "").trim();

  if (!phone || !display_name || !password) {
    return c.html(registerPage({ title: "免费注册" }, "请填写手机号和密码"));
  }
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return c.html(registerPage({ title: "免费注册" }, "密码至少8位，必须包含字母和数字"));
  }

  // Verify SMS code
  const { verifyCode: verifySms } = await import("../services/sms.js");
  if (!verifySms(phone, code)) {
    return c.html(registerPage({ title: "免费注册" }, "验证码错误或已过期"));
  }

  // Check if phone exists
  const existing = dbGet<{ id: string }>("SELECT id FROM users WHERE phone = ?", phone);
  if (existing) {
    return c.html(registerPage({ title: "免费注册" }, "该手机号已被注册"));
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
      `INSERT INTO users (id, phone, email, password_hash, api_key, display_name, quota_remaining)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      id, phone, email, passwordHash, apiKey, display_name, trialQuota
    );
    // Create default API key for the user
    run("INSERT INTO api_keys (id, user_id, name, key) VALUES (?, ?, ?, ?)",
      `key_${uuidv4().slice(0,8)}`, id, '默认密钥', apiKey);

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
// Recharge page
web.get("/recharge", async (c) => {
  const auth = await requireAuth(c);
  if (!auth) return c.redirect("/login");
  const { all: dbAll } = await import("../db/index.js");
  const packages = dbAll("SELECT * FROM packages WHERE is_active = 1 ORDER BY price_cents ASC");
  const { rechargePage } = await import("../web/recharge.js");
  const html = rechargePage({
    title: "充值中心",
    user: { display_name: auth.displayName, email: auth.email },
  }, packages);
  return c.html(html);
});

// Recharge API: create order
web.post("/api/recharge/create", async (c) => {
  const auth = await requireAuth(c);
  if (!auth) return c.json({ error: "请先登录" }, 401);
  const { package_id, payment_method } = await c.req.json();
  const { all: dbAll, run: dbRun } = await import("../db/index.js");
  const pkg = dbAll("SELECT * FROM packages WHERE id = ? AND is_active = 1", package_id)[0] as any;
  if (!pkg) return c.json({ error: "套餐不存在" }, 400);
  const { v4: uuidv4 } = await import("uuid");
  const id = `pay_${uuidv4().slice(0, 8)}`;
  dbRun("INSERT INTO payment_orders (id, user_id, package_id, package_name, quota_amount, price_cents, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    id, auth.userId, package_id, pkg.name, pkg.quota_amount, pkg.price_cents, payment_method || 'manual', 'pending');
  return c.json({ id, status: 'pending' });
});

// Recharge API: notify payment
web.post("/api/recharge/notify", async (c) => {
  const auth = await requireAuth(c);
  if (!auth) return c.json({ error: "请先登录" }, 401);
  const { package_id, payment_method } = await c.req.json();
  const { all: dbAll, run: dbRun } = await import("../db/index.js");
  const pkg = dbAll("SELECT * FROM packages WHERE id = ?", package_id)[0] as any;
  if (!pkg) return c.json({ error: "套餐不存在" }, 400);
  const { v4: uuidv4 } = await import("uuid");
  const id = `pay_${uuidv4().slice(0, 8)}`;
  dbRun("INSERT INTO payment_orders (id, user_id, package_id, package_name, quota_amount, price_cents, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    id, auth.userId, package_id, pkg.name, pkg.quota_amount, pkg.price_cents, payment_method || 'manual', 'pending');
  return c.json({ id, status: 'pending', message: '已通知管理员' });
});

// Recharge API: get my orders
web.get("/api/recharge/orders", async (c) => {
  const auth = await requireAuth(c);
  if (!auth) return c.json({ error: "请先登录" }, 401);
  const { all: dbAll } = await import("../db/index.js");
  const orders = dbAll("SELECT * FROM payment_orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 20", auth.userId);
  return c.json(orders);
});

// Admin payment QR config API
web.get("/api/admin/payment-qr", async (c) => {
  const { get: dbGet } = await import("../db/index.js");
  const row = dbGet("SELECT value FROM settings WHERE key = ?", "payment_qr") as any;
  return c.json(row ? JSON.parse(row.value) : {});
});

// Forgot password page
web.get("/forgot-password", async (c) => {
  const { forgotPasswordPage } = await import("../web/auth.js");
  return c.html(forgotPasswordPage({ title: "重置密码" }));
});

// Forgot password Step 1: Send SMS to registered phone
web.post("/api/forgot-password/send-code", async (c) => {
  const { phone } = await c.req.json();
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return c.json({ error: "请输入正确的手机号" }, 400);
  }
  // Check phone is registered
  const user = dbGet<{ id: string }>("SELECT id FROM users WHERE phone = ? AND is_active = 1", phone);
  if (!user) {
    return c.json({ error: "该手机号未注册" }, 404);
  }
  const { canSendCode, generateCode, sendSms } = await import("../services/sms.js");
  const check = canSendCode(phone);
  if (!check.ok) return c.json({ error: check.reason }, 429);
  const code = generateCode(phone);
  const result = await sendSms(phone, code);
  const devCode = result.message.includes("开发模式") ? code : undefined;
  return c.json({ success: true, message: result.message, code: devCode });
});

// Forgot password Step 2: Verify code, get reset token
web.post("/api/forgot-password/verify-code", async (c) => {
  const { phone, code } = await c.req.json();
  if (!phone || !code) return c.json({ error: "参数错误" }, 400);
  const { verifyCode } = await import("../services/sms.js");
  if (!verifyCode(phone, code)) return c.json({ error: "验证码错误或已过期" }, 400);
  // Generate one-time reset token (expires in 5 min)
  const resetToken = uuidv4();
  run("INSERT INTO verify_codes (phone, code, expires_at) VALUES (?, ?, datetime('now', '+5 minutes'))",
    `reset:${phone}`, resetToken);
  return c.json({ success: true, token: resetToken });
});

// Forgot password Step 3: Reset password with token
web.post("/api/forgot-password/reset", async (c) => {
  const { phone, token, password } = await c.req.json();
  if (!phone || !token || !password) return c.json({ error: "参数错误" }, 400);
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return c.json({ error: "密码至少8位，必须包含字母和数字" }, 400);
  }
  // Verify reset token
  const stmt = getDb().prepare(
    "SELECT code FROM verify_codes WHERE phone = ? AND code = ? AND expires_at > datetime('now')"
  );
  stmt.bind([`reset:${phone}`, token]);
  const valid = stmt.step();
  stmt.free();
  if (!valid) return c.json({ error: "操作已过期，请重新验证" }, 400);
  // Update password
  const hash = bcrypt.hashSync(password, 10);
  run("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE phone = ?", hash, phone);
  // Clean up tokens
  run("DELETE FROM verify_codes WHERE phone = ?", [`reset:${phone}`]);
  // Auto-login
  const user = dbGet<{ id: string; email: string; phone: string; display_name: string }>(
    "SELECT id, email, phone, display_name FROM users WHERE phone = ?", phone
  );
  if (user) {
    const authToken = await signToken({
      userId: user.id,
      email: user.email || user.phone,
      displayName: user.display_name || user.phone,
      isAdmin: user.email === "admin@token-relay.local",
    });
    setCookie(c, "tr_session", authToken, {
      httpOnly: true, secure: false, sameSite: "Lax", maxAge: 86400, path: "/",
    });
  }
  return c.json({ success: true });
});

// Admin: reset user password
web.post("/api/admin/reset-password", async (c) => {
  const auth = await requireAuth(c);
  if (!auth || !auth.isAdmin) return c.json({ error: "无权限" }, 403);
  const { user_id, new_password } = await c.req.json();
  if (!user_id || !new_password || new_password.length < 6) return c.json({ error: "参数错误" }, 400);
  const hash = (await import("bcryptjs")).hashSync(new_password, 10);
  run("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?", hash, user_id);
  return c.json({ success: true });
});

// Send SMS verification code
web.post("/api/sms/send", async (c) => {
  const { phone } = await c.req.json();
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return c.json({ error: "请输入正确的手机号" }, 400);
  }
  const { canSendCode, generateCode, sendSms } = await import("../services/sms.js");
  const check = canSendCode(phone);
  if (!check.ok) {
    return c.json({ error: check.reason }, 429);
  }
  const code = generateCode(phone);
  const result = await sendSms(phone, code);
  // In DEV mode, include the code in response for testing
  const devCode = result.message.includes("开发模式") ? code : undefined;
  return c.json({ success: true, message: result.message, code: devCode });
});

// Verify a code (used by register/login flows)
web.post("/api/sms/verify", async (c) => {
  const { phone, code } = await c.req.json();
  const { verifyCode } = await import("../services/sms.js");
  if (verifyCode(phone, code)) {
    return c.json({ success: true });
  }
  return c.json({ error: "验证码错误或已过期" }, 400);
});

// Admin: SMS configuration
web.get("/api/admin/sms-config", async (c) => {
  const auth = await requireAuth(c);
  if (!auth || !auth.isAdmin) return c.json({ error: "无权限" }, 403);
  const { getSmsConfig } = await import("../services/sms.js");
  return c.json(getSmsConfig());
});

web.post("/api/admin/sms-config", async (c) => {
  const auth = await requireAuth(c);
  if (!auth || !auth.isAdmin) return c.json({ error: "无权限" }, 403);
  const body = await c.req.json();
  const { setSmsConfig } = await import("../services/sms.js");
  setSmsConfig(body);
  return c.json({ success: true });
});

// ═══ API Key Management ══════════════════════════════════

web.get("/keys", async (c) => {
  const auth = await requireAuth(c);
  if (!auth) return c.redirect("/login");
  const { keysPage } = await import("../web/keys.js");
  return c.html(keysPage({ title: "API 密钥管理", user: { display_name: auth.displayName, email: auth.email } }));
});

// Create a new API key
web.post("/api/keys/create", async (c) => {
  const auth = await requireAuth(c);
  if (!auth) return c.json({ error: "请先登录" }, 401);
  const { name } = await c.req.json();
  const id = `key_${uuidv4().slice(0, 8)}`;
  const key = `sk-${uuidv4().replace(/-/g, "")}`;
  run("INSERT INTO api_keys (id, user_id, name, key) VALUES (?, ?, ?, ?)", id, auth.userId, name || "未命名密钥", key);
  return c.json({ id, key, name });
});

// List user's API keys
web.get("/api/keys/list", async (c) => {
  const auth = await requireAuth(c);
  if (!auth) return c.json({ error: "请先登录" }, 401);
  const keys = all("SELECT id, name, key, is_active, created_at, last_used_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC", auth.userId);
  return c.json({ keys });
});

// Revoke an API key
web.post("/api/keys/revoke", async (c) => {
  const auth = await requireAuth(c);
  if (!auth) return c.json({ error: "请先登录" }, 401);
  const { id } = await c.req.json();
  run("UPDATE api_keys SET is_active = 0 WHERE id = ? AND user_id = ?", id, auth.userId);
  return c.json({ success: true });
});

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

  const keyCount = (dbGet("SELECT COUNT(*) as cnt FROM api_keys WHERE user_id = ? AND is_active = 1", auth.userId) as any)?.cnt || 0;

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
      phone: String(user.phone ?? ''),
      display_name: String(user.display_name ?? ''),
      quota_remaining: Number(user.quota_remaining ?? 0),
      total_quota_used: Number(user.total_quota_used ?? 0),
      created_at: String(user.created_at ?? ''),
    },
    apiKeyCount: Number(keyCount),
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
    return c.redirect("/login");
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
