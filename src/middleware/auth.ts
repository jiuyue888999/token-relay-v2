import type { Context, Next } from "hono";
import { get, run } from "../db/index.js";
import { config } from "../config.js";

/**
 * Authenticate user via Bearer token (API key).
 * Sets `userId` and `userApiKey` in context variables on success.
 */
export async function userAuth(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: { message: "Missing Authorization header", type: "auth_error" } }, 401);
  }

  const apiKey = authHeader.slice(7).trim();
  if (!apiKey) {
    return c.json({ error: { message: "Empty API key", type: "auth_error" } }, 401);
  }

  // Check api_keys table first, fallback to users.api_key
  const keyRow = get<{ user_id: string; is_active: number }>(
    "SELECT user_id, is_active FROM api_keys WHERE key = ? AND is_active = 1", apiKey
  );
  if (keyRow) {
    const user = get<{ is_active: number }>("SELECT is_active FROM users WHERE id = ?", keyRow.user_id);
    if (!user || !user.is_active) {
      return c.json({ error: { message: "Account disabled", type: "auth_error" } }, 401);
    }
    run("UPDATE api_keys SET last_used_at = datetime('now') WHERE key = ?", apiKey);
    c.set("userId", keyRow.user_id);
    c.set("userApiKey", apiKey);
    return await next();
  }

  // Fallback to legacy users.api_key
  const user = get<{ id: string; api_key: string; is_active: number }>(
    "SELECT id, api_key, is_active FROM users WHERE api_key = ?",
    apiKey
  );
  if (!user || !user.is_active) {
    return c.json({ error: { message: "Invalid or inactive API key", type: "auth_error" } }, 401);
  }

  c.set("userId", user.id);
  c.set("userApiKey", apiKey);
  await next();
}

/**
 * Authenticate admin via Bearer token matching ADMIN_API_KEY.
 */
export async function adminAuth(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: { message: "Missing admin credentials", type: "auth_error" } }, 401);
  }

  const key = authHeader.slice(7).trim();
  if (key !== config.adminApiKey) {
    return c.json({ error: { message: "Invalid admin credentials", type: "auth_error" } }, 403);
  }

  await next();
}
