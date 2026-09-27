import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

if (!process.env.DATABASE_URL) {
  const onVercel = Boolean(process.env.VERCEL);
  throw new Error(
    onVercel
      ? [
          "DATABASE_URL is not set.",
          "",
          "This is a build-time failure, not a runtime one: Next reads every route",
          "module while collecting page data, and the sitemap and shop pages query",
          "the catalogue. The variable has to exist for the BUILD, in the environment",
          "being built — setting it for Production runtime alone is not enough, and a",
          "Preview deployment needs it ticked for Preview.",
          "",
          "Vercel > Settings > Environment Variables > DATABASE_URL,",
          "with Production, Preview and Development all ticked, then redeploy.",
        ].join("\n")
      : "DATABASE_URL is not set — run `npx neon env pull` to populate .env.local"
  );
}

const client = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 1,
});

export const db = drizzle(client, { schema });
export { schema };
