import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import { randomBytes, randomInt, scryptSync } from "node:crypto";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema.js";

neonConfig.fetchFunction = async (input, init) => {
  for (let i = 1; i <= 4; i++) {
    try { return await fetch(input, init); }
    catch (e) { if (i === 4) throw e; await new Promise((r) => setTimeout(r, i * 300)); }
  }
};
const db = drizzle(neon(process.env.DATABASE_URL), { schema });

/* Create an admin, reset a password, or list who has access.
 *
 * The generated password is written to admin-credentials.txt, which is
 * gitignored, and only its location is printed. The previous version of this
 * script printed the password to the terminal, which is how it ended up
 * recoverable from a chat transcript months later — a password that has been
 * displayed in a log is a password that lives in that log forever.
 *
 *   npm run admin:list
 *   npm run admin:create -- --username alex --name "Alex" --email alex@…
 *   npm run admin:reset  -- --username admin
 *   npm run admin:disable -- --username alex
 */

const OUT = "admin-credentials.txt";

/* Four words and a number. Long enough that the entropy is in the length
   rather than in punctuation nobody can retype from a phone. */
const WORDS = [
  "harvest", "thistle", "meadow", "lantern", "copper", "amber", "willow", "quarry",
  "cinder", "hollow", "marble", "orchard", "pewter", "saffron", "tundra", "vellum",
  "basalt", "clover", "dovetail", "ember", "fathom", "granite", "juniper", "kindling",
];

function makePassword() {
  const pick = () => WORDS[randomInt(WORDS.length)];
  const word = (w) => w[0].toUpperCase() + w.slice(1);
  return `${word(pick())}-${pick()}-${word(pick())}-${randomInt(1000, 9999)}!`;
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : null;
};

function writeCredentials({ username, password, action }) {
  const file = path.join(process.cwd(), OUT);
  const stamp = new Date().toISOString();
  const block = [
    `# ${action} — ${stamp}`,
    `# Sign in at /admin/login`,
    `username  ${username}`,
    `password  ${password}`,
    ``,
    `# Change this after signing in. Delete this file once you have stored the`,
    `# password somewhere it belongs — a password manager, not a text file.`,
    ``,
  ].join("\n");

  fs.appendFileSync(file, block);
  return file;
}

async function main() {
  const cmd = process.argv[2];

  if (cmd === "list") {
    const rows = await db.select({
      id: schema.adminUsers.id, username: schema.adminUsers.username,
      name: schema.adminUsers.displayName, email: schema.adminUsers.email,
      role: schema.adminUsers.role, active: schema.adminUsers.active,
      last: schema.adminUsers.lastLoginAt,
    }).from(schema.adminUsers);

    console.log(`\n${rows.length} admin user(s)\n`);
    for (const r of rows) {
      console.log(`  ${r.username.padEnd(16)} ${r.name.padEnd(20)} ${r.role.padEnd(16)} ${r.active ? "active" : "DISABLED"}`);
      console.log(`  ${"".padEnd(16)} ${r.email}`);
      console.log(`  ${"".padEnd(16)} last login ${r.last ? new Date(r.last).toLocaleString("en-US") : "never"}\n`);
    }
    if (rows.filter((r) => r.active).length === 1) {
      console.log("  Only one active account. If its password is lost there is no way back in;");
      console.log("  a second administrator is the cheapest insurance there is.\n");
    }
    return;
  }

  if (cmd === "create") {
    const username = String(arg("username") ?? "").trim().toLowerCase();
    if (!/^[a-z0-9_.-]{3,32}$/.test(username)) {
      console.error("--username is required: 3–32 chars, lowercase letters, digits, . _ -");
      process.exit(1);
    }
    const [existing] = await db.select({ id: schema.adminUsers.id })
      .from(schema.adminUsers).where(eq(schema.adminUsers.username, username));
    if (existing) { console.error(`"${username}" already exists. Use admin:reset to issue a new password.`); process.exit(1); }

    const password = makePassword();
    await db.insert(schema.adminUsers).values({
      username,
      email: arg("email") ?? `${username}@weedmap.store`,
      displayName: arg("name") ?? username,
      passwordHash: hashPassword(password),
      role: arg("role") ?? "administrator",
      active: true,
    });

    const file = writeCredentials({ username, password, action: "created" });
    console.log(`\ncreated "${username}".`);
    console.log(`credentials written to ${OUT} — not printed here on purpose.`);
    console.log(`open it, sign in, change the password, then delete the file.\n  ${file}\n`);
    return;
  }

  if (cmd === "reset") {
    const username = String(arg("username") ?? "").trim().toLowerCase();
    const [user] = await db.select({ id: schema.adminUsers.id })
      .from(schema.adminUsers).where(eq(schema.adminUsers.username, username));
    if (!user) { console.error(`no admin user "${username}". Try: npm run admin:list`); process.exit(1); }

    const password = makePassword();
    await db.update(schema.adminUsers)
      .set({ passwordHash: hashPassword(password) })
      .where(eq(schema.adminUsers.id, user.id));

    const file = writeCredentials({ username, password, action: "password reset" });
    console.log(`\npassword reset for "${username}". Any existing session stays valid until it expires.`);
    console.log(`new password written to ${OUT}, not printed here.\n  ${file}\n`);
    return;
  }

  if (cmd === "disable" || cmd === "enable") {
    const username = String(arg("username") ?? "").trim().toLowerCase();
    const active = cmd === "enable";

    if (!active) {
      const rows = await db.select({ id: schema.adminUsers.id, username: schema.adminUsers.username })
        .from(schema.adminUsers).where(eq(schema.adminUsers.active, true));
      if (rows.length <= 1 && rows[0]?.username === username) {
        console.error("that is the only active administrator — disabling it locks everyone out.");
        console.error("create another account first: npm run admin:create -- --username …");
        process.exit(1);
      }
    }

    const [row] = await db.update(schema.adminUsers).set({ active })
      .where(eq(schema.adminUsers.username, username))
      .returning({ username: schema.adminUsers.username });
    if (!row) { console.error(`no admin user "${username}".`); process.exit(1); }
    console.log(`\n"${row.username}" is now ${active ? "active" : "disabled"}.\n`);
    return;
  }

  console.log(`
admin users

  npm run admin:list
  npm run admin:create  -- --username alex --name "Alex Doe" --email alex@weedmap.store
  npm run admin:reset   -- --username admin
  npm run admin:disable -- --username alex
  npm run admin:enable  -- --username alex

Generated passwords are written to ${OUT} (gitignored), never printed.
`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
