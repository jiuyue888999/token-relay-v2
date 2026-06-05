import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname } from "path";
import { config } from "../config.js";
import bcrypt from "bcryptjs";
import { SCHEMA_SQL, SEED_SQL } from "./schema.js";

let db: Database;
let SQL: SqlJsStatic;

export async function initDb(): Promise<Database> {
  if (db) return db;

  SQL = await initSqlJs();

  const dbDir = dirname(config.dbPath);
  mkdirSync(dbDir, { recursive: true });

  if (existsSync(config.dbPath)) {
    const buffer = readFileSync(config.dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run("PRAGMA foreign_keys = ON");
  initSchema();
  return db;
}

function initSchema(): void {
  db.run(SCHEMA_SQL);

  // Seed if packages table is empty
  const result = db.exec("SELECT COUNT(*) as cnt FROM packages");
  if (result.length > 0) {
    const cnt = result[0].values[0][0] as number;
    if (cnt === 0) {
      db.run(SEED_SQL);
      // Set admin password
      const adminHash = bcrypt.hashSync("admin123", 10);
      db.run("UPDATE users SET password_hash = ? WHERE email = ?", [
        adminHash,
        "admin@token-relay.local",
      ]);
    }
  }
}

export function getDb(): Database {
  if (!db) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  return db;
}

// ─── Helpers to mimic better-sqlite3 style API ──────────────────

interface DbRow {
  [key: string]: any;
}

/** Execute a statement that returns no rows (INSERT/UPDATE/DELETE). */
export function run(sql: string, ...params: any[]): { changes: number; lastInsertRowid: number } {
  db.run(sql, params);
  // sql.js doesn't directly expose changes/lastID after run
  // We use exec to get the info
  const result = db.exec("SELECT changes() as c, last_insert_rowid() as id");
  if (result.length > 0) {
    return {
      changes: result[0].values[0][0] as number,
      lastInsertRowid: result[0].values[0][1] as number,
    };
  }
  return { changes: 0, lastInsertRowid: 0 };
}

/** Execute a query and return the first row as an object. */
export function get<T = DbRow>(sql: string, ...params: any[]): T | undefined {
  // Use db.exec to get results
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row as T;
  }
  stmt.free();
  return undefined;
}

/** Execute a query and return all rows as an array of objects. */
export function all<T = DbRow>(sql: string, ...params: any[]): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

/** Execute raw SQL directly (for schema init, multi-statement). */
export function exec(sql: string): void {
  db.run(sql);
}

/** Persist database to disk. Call periodically or on shutdown. */
export function saveDb(): void {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(config.dbPath, buffer);
}

/** Auto-save every 30 seconds. */
let saveInterval: ReturnType<typeof setInterval> | null = null;

export function startAutoSave(intervalMs = 30_000): void {
  if (saveInterval) return;
  saveInterval = setInterval(saveDb, intervalMs);
}

export function stopAutoSave(): void {
  if (saveInterval) {
    clearInterval(saveInterval);
    saveInterval = null;
  }
}

export async function closeDb(): Promise<void> {
  stopAutoSave();
  saveDb();
  if (db) {
    db.close();
  }
}
