import { v4 as uuidv4 } from "uuid";
import { getDb, all, get, run } from "../db/index.js";
import type { UpstreamKey } from "../providers/types.js";

/**
 * Round-robin counters per provider. Key is provider name, value is
 * the index of the last-used key in the active-keys array.
 */
const roundRobin: Map<string, number> = new Map();

/**
 * Get the next available upstream key for a provider using round-robin.
 * Returns null if no active key is available.
 */
export function getNextKey(provider: string): UpstreamKey | null {
  const keys = all<UpstreamKey>(
    "SELECT * FROM upstream_keys WHERE provider = ? AND is_active = 1 ORDER BY priority DESC, id ASC",
    provider
  );

  if (keys.length === 0) return null;

  const idx = roundRobin.get(provider) ?? -1;
  const next = (idx + 1) % keys.length;
  roundRobin.set(provider, next);

  return keys[next];
}

/**
 * Add a new upstream API key.
 */
export function addUpstreamKey(params: {
  provider: string;
  api_key: string;
  base_url?: string;
  display_name?: string;
  priority?: number;
}): UpstreamKey {
  const id = `uk_${uuidv4().slice(0, 8)}`;

  run(
    `INSERT INTO upstream_keys (id, provider, api_key, base_url, display_name, priority)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id, params.provider, params.api_key, params.base_url || null,
    params.display_name || null, params.priority ?? 0
  );

  return get<UpstreamKey>("SELECT * FROM upstream_keys WHERE id = ?", id)!;
}

/**
 * List all upstream keys, optionally filtered by provider.
 */
export function listUpstreamKeys(provider?: string): UpstreamKey[] {
  if (provider) {
    return all<UpstreamKey>(
      "SELECT * FROM upstream_keys WHERE provider = ? ORDER BY priority DESC, created_at ASC",
      provider
    );
  }
  return all<UpstreamKey>("SELECT * FROM upstream_keys ORDER BY provider, priority DESC");
}

/**
 * Update an upstream key's status or config.
 */
export function updateUpstreamKey(id: string, updates: Partial<UpstreamKey>): boolean {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.is_active !== undefined) {
    fields.push("is_active = ?");
    values.push(updates.is_active);
  }
  if (updates.priority !== undefined) {
    fields.push("priority = ?");
    values.push(updates.priority);
  }
  if (updates.api_key !== undefined) {
    fields.push("api_key = ?");
    values.push(updates.api_key);
  }
  if (updates.display_name !== undefined) {
    fields.push("display_name = ?");
    values.push(updates.display_name);
  }

  if (fields.length === 0) return false;

  fields.push("updated_at = datetime('now')");
  values.push(id);

  const result = run(`UPDATE upstream_keys SET ${fields.join(", ")} WHERE id = ?`, ...values);
  return result.changes > 0;
}

/**
 * Delete an upstream key.
 */
export function deleteUpstreamKey(id: string): boolean {
  const result = run("DELETE FROM upstream_keys WHERE id = ?", id);
  return result.changes > 0;
}

/**
 * Get the count of active keys per provider. Useful for health checks.
 */
export function keyHealthSummary(): Record<string, { active: number; total: number }> {
  const rows = all<{ provider: string; is_active: number; cnt: number }>(
    `SELECT provider, is_active, COUNT(*) as cnt
     FROM upstream_keys GROUP BY provider, is_active`
  );

  const summary: Record<string, { active: number; total: number }> = {};
  for (const row of rows) {
    if (!summary[row.provider]) summary[row.provider] = { active: 0, total: 0 };
    if (row.is_active) summary[row.provider].active = row.cnt;
    summary[row.provider].total += row.cnt;
  }
  return summary;
}
