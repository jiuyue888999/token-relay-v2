/**
 * SQL schema for the Token Relay Station database.
 * Tables: upstream_keys, users, packages, recharge_logs, usage_logs
 */

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS upstream_keys (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK(provider IN ('openai','anthropic','gemini','deepseek')),
  api_key TEXT NOT NULL,
  base_url TEXT,
  display_name TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  password_hash TEXT,
  api_key TEXT NOT NULL UNIQUE,
  display_name TEXT,
  quota_remaining INTEGER NOT NULL DEFAULT 0,
  total_quota_used INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  quota_amount INTEGER NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS recharge_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  package_id TEXT REFERENCES packages(id),
  quota_amount INTEGER NOT NULL,
  payment_method TEXT DEFAULT 'manual',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS usage_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  upstream_key_id TEXT REFERENCES upstream_keys(id),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  request_id TEXT,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  quota_cost INTEGER NOT NULL DEFAULT 0,
  success INTEGER NOT NULL DEFAULT 1,
  error_msg TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_upstream_keys_provider ON upstream_keys(provider);
CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);

-- Payment system
CREATE TABLE IF NOT EXISTS payment_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  package_id TEXT,
  package_name TEXT,
  quota_amount INTEGER NOT NULL DEFAULT 0,
  price_cents INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','done','cancelled')),
  admin_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

export const SEED_SQL = `
-- Default packages
INSERT OR IGNORE INTO packages (id, name, description, quota_amount, price_cents) VALUES
  ('pkg_trial', '体验包', '10万 tokens 免费试用', 100000, 0),
  ('pkg_basic', '基础包', '100万 tokens', 1000000, 990),
  ('pkg_pro', '专业包', '500万 tokens', 5000000, 3990),
  ('pkg_ultra', '旗舰包', '2000万 tokens', 20000000, 12990);

-- Default admin user (api_key will need to be reset)
INSERT OR IGNORE INTO users (id, email, api_key, display_name, quota_remaining) VALUES
  ('user_admin', 'admin@token-relay.local', 'sk-admin-default-change-me', 'Admin', 999999999);
`;
