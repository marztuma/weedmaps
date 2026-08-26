"use client";

import { useSearchParams } from "next/navigation";

/* WordPress-style admin notices driven by a query flag after a redirect. */
export default function Notice({ map }) {
  const params = useSearchParams();
  const hits = Object.entries(map).filter(([key]) => params.get(key) != null);
  if (!hits.length) return null;

  return (
    <>
      {hits.map(([key, [tone, text]]) => (
        <div key={key} className={`wp-notice ${tone}`} role="status">
          <p>{text}</p>
        </div>
      ))}
    </>
  );
}
