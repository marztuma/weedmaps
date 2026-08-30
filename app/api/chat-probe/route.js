import { answer } from "@/lib/chat/answer";

/* A test seam for the chat matcher.
 *
 * The matcher is server-only and reaches the database, so it cannot be run by
 * bare node — but its rules are exactly the kind of thing that needs a fast,
 * repeatable suite, because the failures are quiet: a phrasing that should
 * match and does not, or a substring that matches the wrong rule.
 *
 * It is off unless CHAT_PROBE is set, so the deployed site does not carry an
 * endpoint that exists only for tests. It returns the matched intent and
 * nothing else — no catalogue data, nothing a visitor could not get by asking
 * the widget the same question.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  if (process.env.CHAT_PROBE !== "1") {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  let question = "";
  try {
    ({ question } = await request.json());
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const result = await answer(String(question ?? "").slice(0, 1000));
  return Response.json({ intent: result.intent });
}
