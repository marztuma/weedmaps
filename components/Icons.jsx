/* Authored icon set. One grid (24), one stroke weight (1.4), round caps and
   joins throughout. Category glyphs are drawn from the product itself — a bud,
   a cone, a pen, a bead of oil — never a generic tile. */

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const paths = {
  flower: (
    <>
      <path d="M12 21v-6.6" />
      <path d="M12 14.4c-2.7-.7-4.4-2.7-4.4-5.1 2.7.7 4.4 2.7 4.4 5.1Z" />
      <path d="M12 14.4c2.7-.7 4.4-2.7 4.4-5.1-2.7.7-4.4 2.7-4.4 5.1Z" />
      <path d="M12 12.6c-1.6-2-1.6-4.7 0-6.7 1.6 2 1.6 4.7 0 6.7Z" />
    </>
  ),
  "pre-rolls": (
    <>
      <path d="M3.4 20.6 5.9 18.1 15.4 6.2l2.4 2.4L5.9 18.1Z" />
      <path d="m15.4 6.2 2.4 2.4 1.4-1.8-2-2Z" />
      <path d="M19.9 3.4a1.3 1.3 0 0 1 0 1.9 1.3 1.3 0 0 0 0 1.9" />
    </>
  ),
  vape: (
    <>
      <rect x="8.4" y="2.6" width="7.2" height="18.8" rx="2.4" />
      <path d="M8.4 7.4h7.2" />
      <path d="M10.6 2.6V1.4h2.8v1.2" />
      <path d="M12 11.4v4.6" />
    </>
  ),
  concentrates: (
    <>
      <path d="M12 3.2c2.6 3.5 4.1 5.9 4.1 7.8a4.1 4.1 0 0 1-8.2 0c0-1.9 1.5-4.3 4.1-7.8Z" />
      <path d="M9.9 11.6a2.1 2.1 0 0 0 2.1 2.1" />
      <path d="M6.4 20.4h11.2" />
    </>
  ),
  edibles: (
    <>
      <rect x="4.4" y="5.6" width="15.2" height="13.6" rx="3.4" />
      <path d="M19.6 9.4a3.4 3.4 0 0 1-3.4-3.4" />
      <path d="M9 12.4h.01" />
      <path d="M13.4 15.2h.01" />
      <path d="M9.4 16.4h.01" />
      <path d="M13.8 11.4h.01" />
    </>
  ),
  beverages: (
    <>
      <rect x="7" y="2.8" width="10" height="18.4" rx="2.6" />
      <path d="M7 7.2h10" />
      <path d="M7 16.8h10" />
      <path d="M10.4 10.4v3.2" />
    </>
  ),
  wellness: (
    <>
      <path d="M10.2 2.8h3.6v3.4h.6a2 2 0 0 1 2 2v10a2.6 2.6 0 0 1-2.6 2.6h-3.6a2.6 2.6 0 0 1-2.6-2.6v-10a2 2 0 0 1 2-2h.6Z" />
      <path d="M7.6 11.4h8.8" />
      <path d="M12 14v3.4" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 4v2.2M12 17.8V20M4 12h2.2M17.8 12H20M6.3 6.3l1.6 1.6M16.1 16.1l1.6 1.6M17.7 6.3l-1.6 1.6M7.9 16.1l-1.6 1.6" />
    </>
  ),
  genetics: (
    <>
      <path d="M12 21v-6.4" />
      <path d="M12 14.6c0-3.4 2.8-6.2 6.2-6.2 0 3.4-2.8 6.2-6.2 6.2Z" />
      <path d="M12 16.4c-3 0-5.4-2.4-5.4-5.4 3 0 5.4 2.4 5.4 5.4Z" />
    </>
  ),

  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.6" />
      <path d="m15.6 15.6 4 4" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21.2s6.6-5.6 6.6-10.4a6.6 6.6 0 1 0-13.2 0C5.4 15.6 12 21.2 12 21.2Z" />
      <circle cx="12" cy="10.6" r="2.5" />
    </>
  ),
  star: <path d="m12 3.6 2.6 5.3 5.8.85-4.2 4.1 1 5.8-5.2-2.73-5.2 2.73 1-5.8L3.6 9.75l5.8-.85L12 3.6Z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.2V12l3.2 1.9" />
    </>
  ),
  truck: (
    <>
      <path d="M2.8 6.8h10.4v9.4H2.8z" />
      <path d="M13.2 10.2h3.6l3.4 3.2v2.8h-7z" />
      <circle cx="7" cy="18.4" r="2" />
      <circle cx="16.6" cy="18.4" r="2" />
    </>
  ),
  bag: (
    <>
      <path d="M5.4 7.6h13.2l-1 12.2a1.8 1.8 0 0 1-1.8 1.6H8.2a1.8 1.8 0 0 1-1.8-1.6Z" />
      <path d="M9 9.4V6.6a3 3 0 0 1 6 0v2.8" />
    </>
  ),
  heart: <path d="M12 20.4s-7.4-4.6-7.4-9.6a4.2 4.2 0 0 1 7.4-2.7 4.2 4.2 0 0 1 7.4 2.7c0 5-7.4 9.6-7.4 9.6Z" />,
  user: (
    <>
      <circle cx="12" cy="8.4" r="3.6" />
      <path d="M5.2 20.2a6.8 6.8 0 0 1 13.6 0" />
    </>
  ),
  arrow: <path d="M5 12h14m-5.6-5.6L19 12l-5.6 5.6" />,
  arrowUpRight: <path d="M7.4 16.6 16.6 7.4m0 0H9m7.6 0V15" />,
  chevronLeft: <path d="M14.4 5.6 8 12l6.4 6.4" />,
  chevronRight: <path d="M9.6 5.6 16 12l-6.4 6.4" />,
  chevronDown: <path d="M5.6 9.6 12 16l6.4-6.4" />,
  check: <path d="m5 12.6 4.6 4.4L19 7" />,
  close: <path d="M6 6 18 18M18 6 6 18" />,
  plus: <path d="M12 5.4v13.2M5.4 12h13.2" />,
  minus: <path d="M5.4 12h13.2" />,
  trash: (
    <>
      <path d="M4.6 6.8h14.8" />
      <path d="M9.4 6.8V5.2a1.4 1.4 0 0 1 1.4-1.4h2.4a1.4 1.4 0 0 1 1.4 1.4v1.6" />
      <path d="M6.6 6.8 7.5 19a1.8 1.8 0 0 0 1.8 1.7h5.4a1.8 1.8 0 0 0 1.8-1.7l.9-12.2" />
      <path d="M10.6 10.4v6.2M13.4 10.4v6.2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2.8 4.8 5.6v6c0 4.6 3 8.2 7.2 9.6 4.2-1.4 7.2-5 7.2-9.6v-6Z" />
      <path d="m9.2 12 2 2 3.6-3.8" />
    </>
  ),
  lab: (
    <>
      <path d="M10 3.2v6.1L4.9 18a2.2 2.2 0 0 0 1.9 3.3h10.4A2.2 2.2 0 0 0 19.1 18L14 9.3V3.2" />
      <path d="M8.6 3.2h6.8" />
      <path d="M7.4 14.6h9.2" />
    </>
  ),
  apple: (
    <path
      d="M16.4 12.6c0-2.4 2-3.5 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.6.9-.8 0-1.9-.9-3.1-.8-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.7 2.5 3 2.4 1.2 0 1.6-.8 3.1-.8 1.4 0 1.8.8 3.1.7 1.3 0 2.1-1.2 2.9-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.5-1-2.6-3.9ZM14 5.4c.7-.8 1.1-1.9 1-3-.9 0-2.1.6-2.8 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.8-1.3Z"
      fill="currentColor"
      stroke="none"
    />
  ),
  android: (
    <>
      <path d="M5.4 10.2h13.2v6.6a2 2 0 0 1-2 2H7.4a2 2 0 0 1-2-2Z" />
      <path d="M5.4 10.2a6.6 6.6 0 0 1 13.2 0" />
      <path d="m7.6 5.4-1-1.8M16.4 5.4l1-1.8" />
      <path d="M9.4 7.8h.01M14.6 7.8h.01" />
      <path d="M3 12v3.4M21 12v3.4" />
    </>
  ),
};

export default function Icon({ name, size = 20, className = "", ...rest }) {
  const glyph = paths[name];
  if (!glyph) return null;
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true" focusable="false" {...rest}>
      {glyph}
    </svg>
  );
}
