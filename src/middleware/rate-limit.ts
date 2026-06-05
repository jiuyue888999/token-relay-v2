import type { Context, Next } from "hono";
import { config } from "../config.js";

/**
 * Simple in-memory sliding-window rate limiter.
 * Keyed by user ID, rejects if limit exceeded.
 */
const requestLog: Map<string, number[]> = new Map();

// Purge stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const cutoff = now - config.rateLimit.windowMs;
  for (const [key, timestamps] of requestLog) {
    const valid = timestamps.filter((t) => t > cutoff);
    if (valid.length === 0) {
      requestLog.delete(key);
    } else {
      requestLog.set(key, valid);
    }
  }
}, 300_000);

export async function rateLimiter(c: Context, next: Next) {
  const userId = c.get("userId") as string;
  if (!userId) return await next(); // No user context, skip

  const now = Date.now();
  const cutoff = now - config.rateLimit.windowMs;

  let timestamps = requestLog.get(userId) || [];
  // Sliding window: keep only recent requests
  timestamps = timestamps.filter((t) => t > cutoff);

  if (timestamps.length >= config.rateLimit.maxRequests) {
    const retryAfter = Math.ceil((timestamps[0] + config.rateLimit.windowMs - now) / 1000);
    c.header("Retry-After", String(retryAfter));
    c.header("X-RateLimit-Limit", String(config.rateLimit.maxRequests));
    c.header("X-RateLimit-Remaining", "0");
    return c.json(
      {
        error: {
          message: `Rate limit exceeded. Try again in ${retryAfter}s`,
          type: "rate_limit_error",
        },
      },
      429
    );
  }

  timestamps.push(now);
  requestLog.set(userId, timestamps);

  c.header("X-RateLimit-Limit", String(config.rateLimit.maxRequests));
  c.header("X-RateLimit-Remaining", String(config.rateLimit.maxRequests - timestamps.length));

  await next();
}
