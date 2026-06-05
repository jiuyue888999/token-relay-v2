import type { Context, Next } from "hono";
import { get } from "../db/index.js";
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
