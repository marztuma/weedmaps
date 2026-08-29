import { escapeHtml, escapeHtmlLines, headerSafe } from "./safe.js";

/* Message bodies.

   Two rules run through all of them.

   Every value that came from a customer goes through escapeHtml before it
   touches the HTML part. Order notes and names are typed by strangers, and an
   unescaped one renders in an inbox — very likely the admin's.

   Every message has a real plain-text part. Not a stripped-down apology: the
   same information, readable. A text/plain alternative is what a screen reader
   and a text client get, and it is one of the things spam filters look for.

   Styling is inline because mail clients discard <style> blocks, and the
   palette is the site's own so an email looks like it came from the shop. */

const INK = "#141314";
const SHADE = "#5f5c66";
const MUTE = "#656170";
const LINEN = "#f9f5f2";
const LINEN_DEEP = "#efeae6";
const RULE = "#d6d5d9";
const ORANGE = "#f15a26";

const money = (c) => `$${((c ?? 0) / 100).toFixed(2)}`;

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

/** Shared shell. `title` and `intro` are ours; `body` is pre-escaped HTML. */
function shell({ title, intro, body, footnote }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:${LINEN_DEEP};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${LINEN_DEEP};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${LINEN};border:1px solid ${RULE};border-radius:4px;">
  <tr><td style="padding:28px 28px 0;">
    <p style="margin:0;font-family:${FONT};font-size:15px;font-weight:700;letter-spacing:-.02em;color:${INK};">Weedmaps</p>
  </td></tr>
  <tr><td style="padding:20px 28px 0;">
    <h1 style="margin:0;font-family:${FONT};font-size:24px;line-height:1.2;letter-spacing:-.03em;color:${INK};font-weight:800;">${escapeHtml(title)}</h1>
    ${intro ? `<p style="margin:12px 0 0;font-family:${FONT};font-size:15px;line-height:1.6;color:${SHADE};">${intro}</p>` : ""}
  </td></tr>
  <tr><td style="padding:24px 28px;">${body}</td></tr>
  <tr><td style="padding:0 28px 28px;border-top:1px solid ${RULE};">
    <p style="margin:16px 0 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTE};">
      ${footnote ?? "You are receiving this because an order was placed with this address."}
      Delivery only. 21+, or 18+ with a valid medical recommendation, and ID is checked at the door.
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

const row = (label, value) => `
  <tr>
    <td style="padding:6px 0;font-family:${FONT};font-size:13px;color:${MUTE};white-space:nowrap;">${escapeHtml(label)}</td>
    <td style="padding:6px 0 6px 16px;font-family:${FONT};font-size:14px;color:${INK};">${value}</td>
  </tr>`;

const facts = (rows) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" width="100%">${rows.join("")}</table>`;

function itemsHtml(lines) {
  const body = lines
    .map(
      (l) => `
      <tr>
        <td style="padding:8px 0;border-top:1px solid ${RULE};font-family:${FONT};font-size:14px;color:${INK};">
          ${escapeHtml(l.nameSnapshot)}
          ${l.brandSnapshot ? `<span style="color:${MUTE};"> · ${escapeHtml(l.brandSnapshot)}</span>` : ""}
          <span style="color:${MUTE};"> × ${Number(l.qty)}</span>
        </td>
        <td style="padding:8px 0;border-top:1px solid ${RULE};font-family:${MONO};font-size:14px;color:${INK};text-align:right;white-space:nowrap;">
          ${money(l.unitPriceCents * l.qty)}
        </td>
      </tr>`
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%">${body}</table>`;
}

const itemsText = (lines) =>
  lines
    .map((l) => `  ${l.qty} × ${l.nameSnapshot}${l.brandSnapshot ? ` (${l.brandSnapshot})` : ""} — ${money(l.unitPriceCents * l.qty)}`)
    .join("\n");

const totalsText = (order) => [
  `  Subtotal   ${money(order.subtotalCents)}`,
  `  Delivery   ${order.deliveryFeeCents ? money(order.deliveryFeeCents) : "Free"}`,
  `  Total      ${money(order.totalCents)}`,
].join("\n");

/* ── Customer: order confirmation ─────────────────────────────

   The email that did not exist. Before this a customer placed an order, was
   shown a wallet address or a Cash App tag on a page, and left with no record
   of what they owed or where to send it. If they closed the tab, that was
   simply gone. */
export function orderConfirmation(order, lines) {
  const subject = headerSafe(`Order ${order.reference} — payment needed to start delivery`);
  const dest = order.paymentDestination ? String(order.paymentDestination) : null;

  const payBlock = dest
    ? `<div style="margin:20px 0 0;padding:16px;background:${LINEN_DEEP};border:1px solid ${RULE};border-radius:4px;">
         <p style="margin:0 0 8px;font-family:${FONT};font-size:13px;color:${MUTE};">Send ${escapeHtml(money(order.totalCents))} using ${escapeHtml(order.paymentMethodLabel)}${order.paymentNetwork ? ` (${escapeHtml(order.paymentNetwork)})` : ""} to</p>
         <p style="margin:0;font-family:${MONO};font-size:14px;line-height:1.5;color:${INK};word-break:break-all;">${escapeHtml(dest)}</p>
       </div>
       <p style="margin:12px 0 0;font-family:${FONT};font-size:13px;line-height:1.6;color:${SHADE};">
         Check the address character by character against this email before sending.
         These payments cannot be reversed or recovered once they leave your wallet.
       </p>`
    : "";

  const html = shell({
    title: `Order ${escapeHtml(order.reference)}`,
    intro: `Thanks — your order is recorded. It is <strong style="color:${INK};">awaiting payment</strong> and nothing is dispatched until we confirm the funds by hand.`,
    body: `
      ${facts([
        row("Reference", `<span style="font-family:${MONO};">${escapeHtml(order.reference)}</span>`),
        row("Payment", escapeHtml(order.paymentMethodLabel) + (order.paymentNetwork ? ` (${escapeHtml(order.paymentNetwork)})` : "")),
        row("Service", escapeHtml(order.shopName ?? "—")),
        row("Deliver to", escapeHtmlLines(order.deliveryAddress ?? "—")),
      ])}
      ${payBlock}
      <h2 style="margin:24px 0 0;font-family:${FONT};font-size:15px;color:${INK};">Your order</h2>
      ${itemsHtml(lines)}
      ${facts([
        row("Subtotal", `<span style="font-family:${MONO};">${money(order.subtotalCents)}</span>`),
        row("Delivery", `<span style="font-family:${MONO};">${order.deliveryFeeCents ? money(order.deliveryFeeCents) : "Free"}</span>`),
        row("Total", `<strong style="font-family:${MONO};">${money(order.totalCents)}</strong>`),
      ])}`,
  });

  const text = [
    `Order ${order.reference} — awaiting payment`,
    ``,
    `Thanks — your order is recorded. Nothing is dispatched until we confirm`,
    `the funds by hand.`,
    ``,
    `  Reference   ${order.reference}`,
    `  Payment     ${order.paymentMethodLabel}${order.paymentNetwork ? ` (${order.paymentNetwork})` : ""}`,
    `  Service     ${order.shopName ?? "—"}`,
    `  Deliver to  ${order.deliveryAddress ?? "—"}`,
    ``,
    dest ? `Send ${money(order.totalCents)} to:\n  ${dest}\n\nCheck it character by character. These payments cannot be reversed.` : null,
    ``,
    `Your order`,
    itemsText(lines),
    ``,
    totalsText(order),
    ``,
    `Delivery only. 21+, or 18+ with a valid medical recommendation. ID is checked at the door.`,
  ].filter((l) => l !== null).join("\n");

  return { subject, html, text };
}

/* ── Customer: payment confirmed ───────────────────────────── */
export function paymentConfirmed(order) {
  const subject = headerSafe(`Payment confirmed — order ${order.reference} is on its way`);

  const html = shell({
    title: "Payment confirmed",
    intro: `We have the funds for order <span style="font-family:${MONO};">${escapeHtml(order.reference)}</span>. ${escapeHtml(order.shopName ?? "The service")} is preparing it now.`,
    body: facts([
      row("Reference", `<span style="font-family:${MONO};">${escapeHtml(order.reference)}</span>`),
      row("Total paid", `<span style="font-family:${MONO};">${money(order.totalCents)}</span>`),
      row("Service", escapeHtml(order.shopName ?? "—")),
      row("Deliver to", escapeHtmlLines(order.deliveryAddress ?? "—")),
    ]) + `<p style="margin:20px 0 0;font-family:${FONT};font-size:14px;line-height:1.6;color:${SHADE};">
      Someone 21 or over needs to be there to receive it, with ID ready for the driver.</p>`,
  });

  const text = [
    `Payment confirmed — order ${order.reference}`,
    ``,
    `We have the funds. ${order.shopName ?? "The service"} is preparing your order now.`,
    ``,
    `  Reference   ${order.reference}`,
    `  Total paid  ${money(order.totalCents)}`,
    `  Deliver to  ${order.deliveryAddress ?? "—"}`,
    ``,
    `Someone 21 or over needs to be there to receive it, with ID ready for the driver.`,
  ].join("\n");

  return { subject, html, text };
}

/* ── Admin: a new order ───────────────────────────────────── */
export function adminNewOrder(order, lines) {
  const subject = headerSafe(
    `New order ${order.reference} — ${order.paymentMethodLabel} — ${money(order.totalCents)}`
  );

  const html = shell({
    title: `New order ${escapeHtml(order.reference)}`,
    intro: `Awaiting payment. Confirm by hand in the admin once the funds arrive — nothing marks itself paid.`,
    body: `
      ${facts([
        row("Customer", escapeHtml(order.customerName ?? "—")),
        row("Email", escapeHtml(order.contactEmail ?? "—")),
        row("Phone", escapeHtml(order.contactPhone || "—")),
        row("Deliver to", escapeHtmlLines(order.deliveryAddress ?? "—")),
        order.deliveryNotes ? row("Notes", escapeHtmlLines(order.deliveryNotes)) : "",
        row("Service", escapeHtml(order.shopName ?? "—")),
        row("Payment", escapeHtml(order.paymentMethodLabel) + (order.paymentNetwork ? ` (${escapeHtml(order.paymentNetwork)})` : "")),
      ])}
      <h2 style="margin:24px 0 0;font-family:${FONT};font-size:15px;color:${INK};">Items</h2>
      ${itemsHtml(lines)}
      ${facts([row("Total", `<strong style="font-family:${MONO};">${money(order.totalCents)}</strong>`)])}`,
    footnote: "You are receiving this because you are the administrator for this store.",
  });

  const text = [
    `New order ${order.reference} — AWAITING PAYMENT`,
    ``,
    `  Customer    ${order.customerName ?? "—"}`,
    `  Email       ${order.contactEmail ?? "—"}`,
    `  Phone       ${order.contactPhone || "—"}`,
    `  Deliver to  ${order.deliveryAddress ?? "—"}`,
    order.deliveryNotes ? `  Notes       ${order.deliveryNotes}` : null,
    `  Service     ${order.shopName ?? "—"}`,
    `  Payment     ${order.paymentMethodLabel}${order.paymentNetwork ? ` (${order.paymentNetwork})` : ""}`,
    ``,
    `Items`,
    itemsText(lines),
    ``,
    totalsText(order),
    ``,
    `Confirm the payment by hand in the admin. Nothing marks itself paid.`,
  ].filter((l) => l !== null).join("\n");

  return { subject, html, text };
}

/* ── Admin: a review is waiting ───────────────────────────── */
export function adminNewReview({ rating, author, subject: onWhat, body }) {
  const subject = headerSafe(`New ${rating}★ review awaiting moderation`);

  const html = shell({
    title: "A review is waiting",
    intro: `Nobody sees it until you publish it.`,
    body: facts([
      row("Rating", `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`),
      row("On", escapeHtml(onWhat ?? "—")),
      row("From", escapeHtml(author ?? "—")),
      row("Comment", body ? escapeHtmlLines(body) : `<span style="color:${MUTE};">Rating only.</span>`),
    ]),
    footnote: "You are receiving this because you are the administrator for this store.",
  });

  const text = [
    `New ${rating}-star review awaiting moderation`,
    ``,
    `  On      ${onWhat ?? "—"}`,
    `  From    ${author ?? "—"}`,
    `  Comment ${body || "(rating only)"}`,
    ``,
    `Nobody sees it until you publish it in the admin.`,
  ].join("\n");

  return { subject, html, text };
}
