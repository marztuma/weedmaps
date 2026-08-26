import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
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

/* Neon's serverless driver talks over HTTP, and a pooled endpoint that has been
   idle can drop the first request while it wakes. Left alone that surfaces as a
   500 on whichever page happened to ask first — a broken marketplace, not a
   cold start. Retry transient transport failures with backoff; never retry a
   real SQL error, which would only fail three times more slowly.

   This is set on neonConfig, not in the neon() options object: fetchFunction is
   a static on the config, and passing it to neon() is silently ignored. */
const TRANSIENT = /fetch failed|ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up|network|terminated|aborted/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

neonConfig.fetchFunction = async (input, init) => {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(input, init);
      if (res.status >= 500 && res.status < 600 && attempt < 4) {
        lastError = new Error(`neon responded ${res.status}`);
        await sleep(attempt * 300);
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      if (!TRANSIENT.test(String(err?.message ?? err)) || attempt === 4) throw err;
      await sleep(attempt * 300);
    }
  }
  throw lastError;
};

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });
export { schema };
