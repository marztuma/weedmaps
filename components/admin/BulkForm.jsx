"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* WordPress's bulk-actions pattern: an action select plus Apply, a select-all
   box in the header row, and a live count.

   Two hard-won rules are baked in here.

   1. The form is a SIBLING of the table, never its parent. Rows carry their own
      forms — an order row has a status select and a payment-confirm form — and a
      <form> inside a <form> is invalid HTML that browsers silently reparent,
      which surfaced as a React hydration error.

   2. Selection uses the HTML `form` attribute, not JavaScript. Each checkbox
      declares which form it belongs to, so the browser submits the ticked rows
      whether or not React ever hydrates. The count and the select-all box are
      enhancement on top; Apply is never disabled by client state, because a
      button that greys out when hydration fails is indistinguishable from a
      broken feature. An empty submit is answered by the server. */

export function BulkCheckbox({ id, label, formId = "bulk-actions" }) {
  return (
    <input
      type="checkbox"
      name="selected"
      value={id}
      form={formId}
      data-bulk-id={id}
      aria-label={label}
    />
  );
}

export function SelectAllToggle({ label = "Select all rows" }) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      data-select-all="true"
      onChange={(e) => {
        const scope = e.target.closest("[data-bulk-scope]");
        if (!scope) return;
        const on = e.target.checked;
        scope.querySelectorAll("input[data-bulk-id]").forEach((b) => { b.checked = on; });
        scope.querySelectorAll('input[data-select-all="true"]').forEach((b) => { b.checked = on; });
        scope.dispatchEvent(new Event("change", { bubbles: true }));
      }}
    />
  );
}

function Toolbar({ actions, count, total, itemLabel, formId, choice, setChoice }) {
  const chosen = actions.find((a) => a.value === choice);

  return (
    <div className="wp-tablenav">
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <select
          form={formId}
          name="bulkAction"
          aria-label="Bulk actions"
          className="wp-select"
          style={{ width: "auto", minWidth: 190 }}
          value={choice}
          onChange={(e) => setChoice(e.target.value)}
        >
          <option value="">Bulk actions</option>
          {actions.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>

        <button
          type="submit"
          form={formId}
          className={`wp-btn${chosen?.danger ? " wp-btn-danger" : ""}`}
          onClick={(e) => {
            if (!chosen?.confirm) return;
            const n = count ?? 0;
            const msg = chosen.confirm.replace("{n}", `${n} ${itemLabel}${n === 1 ? "" : "s"}`);
            if (!window.confirm(msg)) e.preventDefault();
          }}
        >
          Apply
        </button>

        <span className="wp-subtitle">
          {count === 0
            ? `No ${itemLabel}s selected`
            : `${count} ${itemLabel}${count === 1 ? "" : "s"} selected`}
        </span>
      </div>

      <span className="wp-subtitle">{total} item{total === 1 ? "" : "s"}</span>
    </div>
  );
}

export default function BulkForm({
  action, actions, itemLabel = "item", total = 0, formId = "bulk-actions", children,
}) {
  const scopeRef = useRef(null);
  const [count, setCount] = useState(0);
  const [choice, setChoice] = useState("");

  const recount = useCallback(() => {
    const scope = scopeRef.current;
    if (!scope) return;
    const boxes = [...scope.querySelectorAll("input[data-bulk-id]")];
    const checked = boxes.filter((b) => b.checked).length;
    setCount(checked);
    scope.querySelectorAll('input[data-select-all="true"]').forEach((b) => {
      b.checked = boxes.length > 0 && checked === boxes.length;
      b.indeterminate = checked > 0 && checked < boxes.length;
    });
  }, []);

  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;
    scope.addEventListener("change", recount);
    recount();
    return () => scope.removeEventListener("change", recount);
  }, [recount, children]);

  return (
    <div data-bulk-scope="true" ref={scopeRef}>
      {/* Empty by design — the checkboxes join it via their form attribute. */}
      <form id={formId} action={action} />

      <Toolbar
        actions={actions} count={count} total={total} itemLabel={itemLabel}
        formId={formId} choice={choice} setChoice={setChoice}
      />

      {children}

      <Toolbar
        actions={actions} count={count} total={total} itemLabel={itemLabel}
        formId={formId} choice={choice} setChoice={setChoice}
      />
    </div>
  );
}
