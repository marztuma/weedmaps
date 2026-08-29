/* One way to write a price on the storefront.

   Prices reach the UI as dollars — the cents integer is a storage detail that
   db/queries.js already converts. Two rules:

   Cents appear only when there are cents. The catalogue is mostly whole
   dollars and the shelf was designed around "$48", not "$48.00"; a grid of
   trailing zeros is noise. But $1.50 must never render as "$1.5", and it must
   never be rounded to "$2".

   Nothing that quotes money may round. A button reading "Add to bag · $2" over
   a ticket reading "$1.50" is not a formatting quirk — it is the page stating
   two different prices for the same item, and the one on the button is the one
   the shopper believes.

   Money the customer is actually charged is still recomputed server-side at
   checkout. This function only decides how a number is written. */

export function price(n) {
  if (n == null || Number.isNaN(n)) return "";
  const cents = Math.round(n * 100);
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`;
}

/** Same, from an integer number of cents. */
export const priceFromCents = (c) => price((c ?? 0) / 100);
