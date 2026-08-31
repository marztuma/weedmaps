/* US states, for the delivery address.
 *
 * All fifty are listed because the site now says it delivers to all fifty.
 * The list is the single source of truth: the checkout builds its menu from
 * it, and the server validates against it rather than trusting the posted
 * value — a select is a suggestion to the browser, not a constraint on what
 * arrives.
 *
 * DC is included because people live there and it has its own postal code,
 * which is what this field is really for. */

export const STATES = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
  ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"],
  ["DC", "District of Columbia"], ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"],
  ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"],
  ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"],
  ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"],
  ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"],
  ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"],
  ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"],
  ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"],
  ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"],
  ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"],
  ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
];

const CODES = new Set(STATES.map(([code]) => code));

/** True only for a code in the list above. Used on the server, where the
 *  posted value is whatever the client chose to send. */
export const validState = (code) =>
  typeof code === "string" && CODES.has(code.trim().toUpperCase());

export const stateName = (code) =>
  STATES.find(([c]) => c === String(code ?? "").toUpperCase())?.[1] ?? null;
