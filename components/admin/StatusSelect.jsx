"use client";

import { useRef, useTransition } from "react";

/* Change an order's status inline. Submits on change, and reverts the select if
   the server rejects it, so the row never shows a status the database refused. */
export default function StatusSelect({ action, id, value, options }) {
  const ref = useRef(null);
  const [pending, start] = useTransition();

  return (
    <form
      ref={ref}
      action={action}
      style={{ display: "flex", alignItems: "center", gap: 6 }}
    >
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={value}
        disabled={pending}
        aria-label="Order status"
        className="wp-select"
        style={{ width: "auto", minWidth: 150, fontSize: 13, minHeight: 28, padding: "2px 6px" }}
        onChange={() => start(() => ref.current?.requestSubmit())}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {pending && <span className="wp-help">Saving…</span>}
    </form>
  );
}
