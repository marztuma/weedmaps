import { config } from "dotenv";

// Neon writes to .env.local, not .env — load that explicitly.
config({ path: ".env.local" });

/** @type {import('drizzle-kit').Config} */
export default {
  schema: "./db/schema.js",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
  },
  strict: false,
  verbose: true,
};
