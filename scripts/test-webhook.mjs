import { Webhook } from "svix";
import fs from "node:fs";

/* Exercises the delivery webhook against a running server.
 *
 * The point is not that a valid event works — it is that an invalid one does
 * not, and that a replayed one is not applied twice. An endpoint that suppresses
 * addresses is an endpoint someone would like to forge.
 *
 * Usage: RESEND_WEBHOOK_SECRET=whsec_... node scripts/test-webhook.mjs
 */

const BASE = process.env.TEST_BASE || "http://localhost:3100";
const SECRET = process.env.RESEND_WEBHOOK_SECRET;
if (!SECRET) { console.error("RESEND_WEBHOOK_SECRET is required"); process.exit(1); }

let pass = 0, fail = 0;
const is = (name, got, want) => {
  const ok = got === want;
  ok ? pass++ : fail++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  (got ${got}, want ${want})`}`);
};

const post = (body, headers) =>
  fetch(`${BASE}/api/webhooks/resend`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body,
  });

const wh = new Webhook(SECRET);
const sign = (payload, id) => {
  const msgId = id ?? `msg_${Math.abs(hash(payload + String(id))).toString(36)}`;
  const timestamp = new Date();
  const signature = wh.sign(msgId, timestamp, payload);
  return {
    "svix-id": msgId,
    "svix-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
    "svix-signature": signature,
  };
};
function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }

const victim = `bounce-test-${Date.now()}@example.com`;
const payload = JSON.stringify({
  type: "email.bounced",
  data: { email_id: "test-email-id", to: [victim], bounce: { type: "Permanent", message: "No such user" } },
});

console.log("\nforgery");
is("unsigned is rejected", (await post(payload, {})).status, 401);
is("garbage signature is rejected",
  (await post(payload, { "svix-id": "msg_1", "svix-timestamp": String(Math.floor(Date.now() / 1000)), "svix-signature": "v1,abcdef" })).status, 401);

{
  // Correct signature, then the body altered underneath it.
  const h = sign(payload, "msg_tamper");
  const tampered = JSON.stringify({ ...JSON.parse(payload), data: { ...JSON.parse(payload).data, to: ["someone-else@example.com"] } });
  is("tampered body is rejected", (await post(tampered, h)).status, 401);
}

{
  // A correctly signed message, but dated well outside the tolerance window.
  const old = new Date(Date.now() - 60 * 60 * 1000);
  const msgId = "msg_replay_old";
  is("stale timestamp is rejected", (await post(payload, {
    "svix-id": msgId,
    "svix-timestamp": String(Math.floor(old.getTime() / 1000)),
    "svix-signature": wh.sign(msgId, old, payload),
  })).status, 401);
}

console.log("\nauthentic event");
const good = sign(payload, "msg_good_1");
is("valid signature is accepted", (await post(payload, good)).status, 200);

console.log("\nreplay");
const again = await post(payload, good);
const body = await again.json();
is("replay returns 200", again.status, 200);
is("replay is recognised as already processed", body.status, "already_processed");

console.log(`\n${pass} passed, ${fail} failed`);
console.log(`\nsuppressed address to check: ${victim}`);
process.exit(fail ? 1 : 0);
