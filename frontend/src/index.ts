/**
 * Token Relay Frontend — Beautiful Chinese UI wrapping New API backend.
 *
 * Architecture:
 *   /              → Landing page
 *   /login         → Login page (form submits to New API, sets cookie)
 *   /register      → Register page (form submits to New API)
 *   /dashboard     → User dashboard (fetches data from New API)
 *   /logout        → Clear session
 *   /admin/*       → Proxy to New API admin panel
 *   /v1/*          → Proxy to New API (API gateway)
 *   /api/*         → Proxy to New API (internal APIs)
 */
import { Hono } from "hono";
import { serve } from "@hono/node-server";

const NEW_API_URL = process.env.NEW_API_URL || "http://new-api:3000";
const PORT = parseInt(process.env.PORT || "3000", 10);

const app = new Hono();

// ═══ Web Pages ═══════════════════════════════════════════════

app.get("/", async (c) => {
  const { homePage } = await import("./home.js");
  const html = homePage({ title: "新一代 AI 模型聚合中转" });
  return c.html(html);
});

app.get("/login", async (c) => {
  const { loginPage } = await import("./auth.js");
  const html = loginPage({ title: "登录" });
  return c.html(html);
});

app.get("/register", async (c) => {
  const { registerPage } = await import("./auth.js");
  const html = registerPage({ title: "免费注册" });
  return c.html(html);
});

app.post("/login", async (c) => {
  const body = await c.req.parseBody();
  // Forward login to New API
  const resp = await fetch(`${NEW_API_URL}/api/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: String(body.email || ""), password: String(body.password || "") }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ message: "登录失败" }));
    const { loginPage } = await import("./auth.js");
    return c.html(loginPage({ title: "登录" }, err.message || "邮箱或密码错误"));
  }

  // Forward the session cookie from New API to the browser
  const setCookie = resp.headers.get("set-cookie");
  if (setCookie) c.header("set-cookie", setCookie);

  return c.redirect("/dashboard");
});

app.post("/register", async (c) => {
  const body = await c.req.parseBody();
  const email = String(body.email || "");
  const password = String(body.password || "");
  const displayName = String(body.display_name || "");

  if (!email || !password || !displayName) {
    const { registerPage } = await import("./auth.js");
    return c.html(registerPage({ title: "免费注册" }, "请填写所有字段"));
  }
  if (password.length < 6) {
    const { registerPage } = await import("./auth.js");
    return c.html(registerPage({ title: "免费注册" }, "密码至少6位"));
  }

  const resp = await fetch(`${NEW_API_URL}/api/user/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, display_name: displayName }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ message: "注册失败" }));
    const { registerPage } = await import("./auth.js");
    return c.html(registerPage({ title: "免费注册" }, err.message || "注册失败，请重试"));
  }

  const setCookie = resp.headers.get("set-cookie");
  if (setCookie) c.header("set-cookie", setCookie);

  return c.redirect("/dashboard");
});

app.get("/dashboard", async (c) => {
  // Check if user is logged in by probing New API
  const cookie = c.req.header("cookie") || "";
  const resp = await fetch(`${NEW_API_URL}/api/user/self`, {
    headers: cookie ? { cookie } : {},
  });

  if (!resp.ok) return c.redirect("/login");

  const userData = await resp.json();
  const user = userData.data || userData;
  const { dashboardPage } = await import("./dashboard.js");

  const html = dashboardPage({
    title: "控制台",
    user: {
      display_name: user.display_name || user.email || user.username || "用户",
      email: user.email || "",
    },
  });
  return c.html(html);
});

app.get("/logout", async (c) => {
  // Clear session
  c.header("set-cookie", "session=; path=/; max-age=0; httponly");
  return c.redirect("/");
});

// ═══ Proxy to New API ════════════════════════════════════════

// Proxy all non-page requests to New API
app.all("*", async (c) => {
  const url = `${NEW_API_URL}${c.req.path}${c.req.query ? "?" + c.req.query : ""}`;

  // Don't proxy our own web pages
  const path = c.req.path;
  if (["/", "/login", "/register", "/dashboard", "/logout"].includes(path)) {
    return c.notFound();
  }

  try {
    const method = c.req.method;
    const headers: Record<string, string> = {};
    c.req.raw.headers.forEach((val, key) => {
      if (!["host", "connection"].includes(key.toLowerCase())) {
        headers[key] = val;
      }
    });

    const body = method !== "GET" && method !== "HEAD" ? await c.req.raw.text() : undefined;

    const resp = await fetch(url, {
      method,
      headers,
      body,
    });

    // Forward response
    const respHeaders: Record<string, string> = {};
    resp.headers.forEach((val, key) => {
      if (!["transfer-encoding"].includes(key.toLowerCase())) {
        respHeaders[key] = val;
      }
    });

    // For streaming responses, return the raw response
    if (resp.headers.get("content-type")?.includes("text/event-stream")) {
      return new Response(resp.body, {
        status: resp.status,
        headers: respHeaders,
      });
    }

    const respBody = await resp.text();
    return new Response(respBody, {
      status: resp.status,
      headers: { ...respHeaders, "content-type": resp.headers.get("content-type") || "application/json" },
    });
  } catch (err: any) {
    console.error("Proxy error:", err.message);
    return new Response(JSON.stringify({ error: { message: "Service unavailable", type: "proxy_error" } }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
});

// ═══ Start ═══════════════════════════════════════════════════

console.log(`
╔══════════════════════════════════════════╗
║   🎨 Token Relay Frontend v2.0           ║
╠══════════════════════════════════════════╣
║  网页:  http://0.0.0.0:${String(PORT).padEnd(18)}║
║  后端:  ${NEW_API_URL.padEnd(34)}║
╚══════════════════════════════════════════╝
`);

serve({ fetch: app.fetch, port: PORT, hostname: "0.0.0.0" }, (info) => {
  console.log(`Frontend listening on http://0.0.0.0:${info.port}`);
});
