import "server-only";
import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";

const COOKIE = "wm_admin_session";
const MAX_AGE = 60 * 60 * 8; // 8 hours

/* Passwords are stored as scrypt salt:hash, never plaintext and never a
   fast hash like sha256. Sessions are a signed, httpOnly cookie — this is a
   real login, not a decorative one, but it is single-server and has no refresh
   or revocation list, so it is sized for an internal admin tool rather than a
   public account system. */

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  try {
    const [salt, hash] = String(stored).split(":");
    if (!salt || !hash) return false;
    const expected = Buffer.from(hash, "hex");
    const actual = scryptSync(password, salt, 64);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function secret() {
  // Falls back to the database URL so a dev machine works out of the box;
  // set ADMIN_SESSION_SECRET before this is exposed anywhere real.
  return process.env.ADMIN_SESSION_SECRET || process.env.DATABASE_URL || "insecure-dev-secret";
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

function unsign(token) {
  if (!token || !token.includes(".")) return null;
  const [body, mac] = token.split(".");
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(user) {
  const token = sign({
    uid: user.id,
    username: user.username,
    name: user.displayName,
    role: user.role,
    exp: Date.now() + MAX_AGE * 1000,
  });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession() {
  const jar = await cookies();
  return unsign(jar.get(COOKIE)?.value);
}

/** Authenticate a username/email + password against the database. */
export async function authenticate(identifier, password) {
  const id = String(identifier || "").trim().toLowerCase();
  if (!id || !password) return { ok: false, error: "Enter a username and password." };

  const [user] = await db
    .select()
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.username, id))
    .limit(1);

  // Same message either way: never reveal which half was wrong.
  if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
    return { ok: false, error: "Unknown username or incorrect password." };
  }

  await db
    .update(schema.adminUsers)
    .set({ lastLoginAt: new Date() })
    .where(eq(schema.adminUsers.id, user.id));

  return { ok: true, user };
}
