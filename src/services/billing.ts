import { v4 as uuidv4 } from "uuid";
import { getDb, all, get, run } from "../db/index.js";
import type { TokenUsage } from "../providers/types.js";

// Pricing multipliers per model family (1x = base price).
const MODEL_MULTIPLIERS: Record<string, number> = {
  "gpt-4": 1.5,
  "gpt-4o": 1.2,
  "gpt-4-turbo": 1.3,
  "gpt-3.5": 0.8,
  "o1": 2.0,
  "o3": 2.5,
  "o4": 3.0,
  claude: 1.3,
  gemini: 0.7,
  deepseek: 0.5,
};

/**
 * Calculate quota cost from token usage.
 * 1 quota unit ≈ 1 token of base-model output.
 */
export function calculateQuotaCost(model: string, usage: TokenUsage): number {
  const multiplier = getModelMultiplier(model);
  const promptCost = usage.prompt_tokens * 0.3 * multiplier;
  const completionCost = usage.completion_tokens * 1.0 * multiplier;
  return Math.ceil(promptCost + completionCost);
}

function getModelMultiplier(model: string): number {
  const m = model.toLowerCase();
  for (const [prefix, mult] of Object.entries(MODEL_MULTIPLIERS)) {
    if (m.startsWith(prefix)) return mult;
  }
  return 1.0;
}

/**
 * Deduct quota from a user.
 */
export function deductQuota(
  userId: string,
  model: string,
  usage: TokenUsage
): { success: boolean; cost: number; remaining: number } {
  const cost = calculateQuotaCost(model, usage);

  const user = get<{ quota_remaining: number }>(
    "SELECT quota_remaining FROM users WHERE id = ?",
    userId
  );

  if (!user) return { success: false, cost, remaining: 0 };
  if (user.quota_remaining < cost) return { success: false, cost, remaining: user.quota_remaining };

  const result = run(
    `UPDATE users
     SET quota_remaining = quota_remaining - ?,
         total_quota_used = total_quota_used + ?,
         updated_at = datetime('now')
     WHERE id = ? AND quota_remaining >= ?`,
    cost, cost, userId, cost
  );

  const updated = get<{ quota_remaining: number }>(
    "SELECT quota_remaining FROM users WHERE id = ?",
    userId
  );

  return {
    success: result.changes > 0,
    cost,
    remaining: updated?.quota_remaining ?? user.quota_remaining,
  };
}

/**
 * Log usage for audit trail.
 */
export function logUsage(params: {
  user_id: string;
  upstream_key_id: string | null;
  provider: string;
  model: string;
  request_id?: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  quota_cost: number;
  success: boolean;
  error_msg?: string;
}): void {
  const id = `log_${uuidv4().slice(0, 12)}`;

  run(
    `INSERT INTO usage_logs (id, user_id, upstream_key_id, provider, model, request_id,
       prompt_tokens, completion_tokens, total_tokens, quota_cost, success, error_msg)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    params.user_id,
    params.upstream_key_id,
    params.provider,
    params.model,
    params.request_id || null,
    params.prompt_tokens,
    params.completion_tokens,
    params.total_tokens,
    params.quota_cost,
    params.success ? 1 : 0,
    params.error_msg || null
  );
}

/**
 * Recharge a user's quota.
 */
export function rechargeUser(userId: string, packageId: string): { success: boolean; newQuota: number } {
  const pkg = get<{ quota_amount: number }>(
    "SELECT * FROM packages WHERE id = ? AND is_active = 1",
    packageId
  );
  if (!pkg) return { success: false, newQuota: 0 };

  const rechargeId = `rch_${uuidv4().slice(0, 8)}`;

  // Use a transaction-like approach
  run(
    `UPDATE users
     SET quota_remaining = quota_remaining + ?,
         updated_at = datetime('now')
     WHERE id = ?`,
    pkg.quota_amount, userId
  );

  run(
    `INSERT INTO recharge_logs (id, user_id, package_id, quota_amount)
     VALUES (?, ?, ?, ?)`,
    rechargeId, userId, packageId, pkg.quota_amount
  );

  const user = get<{ quota_remaining: number }>(
    "SELECT quota_remaining FROM users WHERE id = ?",
    userId
  );
  return { success: true, newQuota: user?.quota_remaining ?? 0 };
}

/**
 * Get user's current quota info.
 */
export function getUserQuota(userId: string): { remaining: number; used: number } | null {
  const user = get<{ quota_remaining: number; total_quota_used: number }>(
    "SELECT quota_remaining, total_quota_used FROM users WHERE id = ?",
    userId
  );
  return user ? { remaining: user.quota_remaining, used: user.total_quota_used } : null;
}
