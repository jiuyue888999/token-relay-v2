import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "..", ".env") });

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  host: process.env.HOST || "0.0.0.0",
  adminApiKey: process.env.ADMIN_API_KEY || "admin-master-key-change-me",
  dbPath: process.env.DB_PATH || "./data/relay.db",
  // Default rate limit per user: 60 requests per minute
  rateLimit: {
    windowMs: 60_000,
    maxRequests: 60,
  },
};
