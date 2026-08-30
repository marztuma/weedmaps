/* What the chat answers, asserted against the running site.
 *
 * The interesting cases are not the ones that work. They are the phrasings
 * that ought to reach an answer and quietly do not, and the substrings that
 * reach the wrong one. Both classes were real bugs here: "How much is
 * delivery?" fell through to unknown, and "liquid" contains "id", which sent
 * product questions to the ID-check answer.
 *
 * Usage: npm run chat:test   (needs the app running on TEST_BASE)
 */

const BASE = process.env.TEST_BASE || "http://localhost:3100";

let pass = 0, fail = 0;
const check = (question, wantIntent, got) => {
  const ok = got === wantIntent;
  ok ? pass++ : fail++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${JSON.stringify(question)} → ${got}${ok ? "" : `  (wanted ${wantIntent})`}`);
};

/* The matcher is server-only, so it is exercised through the same server
   action the widget calls — which also proves the wiring, not just the rules. */
async function askServer(question) {
  const res = await fetch(`${BASE}/api/chat-probe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error(`probe returned ${res.status}`);
  return (await res.json()).intent;
}

const CASES = [
  // greetings
  ["hi", "greeting"],
  ["hello there", "greeting"],

  // delivery area
  ["Do you deliver to me?", "delivery_area"],
  ["do you deliver to santa monica", "delivery_area"],
  ["what areas do you ship to", "delivery_area"],

  // fee — the phrasing that used to fail
  ["How much is delivery?", "delivery_fee"],
  ["delivery cost", "delivery_fee"],
  ["what do you charge to deliver", "delivery_fee"],
  ["is shipping free", "delivery_fee"],

  // time
  ["how long does delivery take", "delivery_time"],
  ["how soon can it arrive", "delivery_time"],
  ["when will it get here", "delivery_time"],

  // minimum
  ["is there a minimum order", "minimum"],
  ["do i have to spend at least anything", "minimum"],

  // payment
  ["what payment do you take", "payment"],
  ["can i pay with bitcoin", "payment"],
  ["do you take cash app", "payment"],

  // age — and the substring trap
  ["do i need id", "age_id"],
  ["are you 21 only", "age_id"],
  ["how old do i have to be", "age_id"],
  ["do you have liquid diamonds", "stock"],             // "liquid" contains "id" — must not hit age_id
  ["can you provide a receipt", "unknown"],            // "provide" contains "id"

  // stock and products
  ["do you have rove", "stock"],
  ["is blue dream in stock", "stock"],
  ["garlic starship", "product_search"],

  // editorial
  ["how do i read a coa", "learn"],
  ["how much thc is too much", "learn"],

  // returns
  ["my order was missing something", "returns"],

  // honest failure
  ["what is the airspeed of a swallow", "unknown"],
  ["tell me a joke", "unknown"],
];

for (const [q, want] of CASES) {
  try {
    check(q, want, await askServer(q));
  } catch (e) {
    fail++;
    console.log(`  FAIL  ${JSON.stringify(q)} — ${e.message}`);
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
