import { initDb, closeDb, all } from "./index.js";

console.log("Initializing database...");
const db = await initDb();

const tables = all<{ name: string }>(
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
);
console.log("Tables:", tables.map((t) => t.name).join(", "));

const packages = all("SELECT * FROM packages");
console.log("Packages:", packages.length, "loaded");

const users = all("SELECT id, email, api_key FROM users");
console.log("Users:", users.length, "found");

await closeDb();
console.log("Database initialized successfully!");
