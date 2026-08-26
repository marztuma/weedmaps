"use client";

import { useRef, useState } from "react";

/* Marking an order paid is the one action here that moves real value, so it
   asks for a transaction reference and confirms the amount out loud. It is
   never automatic and never a single stray click.

   The status travels in a hidden field that the buttons set before submitting,
   rather than on the submit button itself: a submitter's name/value does not
   reliably reach a server action, which silently produced a no-op. */
export default function PaymentConfirm({ action, id, reference, total, current }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef(null);
  const statusRef = useRef(null);

  const submitAs = (status, confirmMessage) => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    statusRef.current.value = status;
    formRef.current.requestSubmit();
  };

  if (current === "paid") {
    return (
      <form ref={formRef} action={action} style={{ marginTop: 6 }}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="paymentStatus" ref={statusRef} defaultValue="awaiting_payment" />
        <button
          type="button"
          className="wp-btn-plain"
          onClick={() => submitAs("awaiting_payment", `Un-mark ${reference} as paid?`)}
        >
          Un-mark as paid
        </button>
      </form>
    );
  }

  if (!open) {
    return (
      <button type="button" className="wp-btn-plain" style={{ marginTop: 6 }} onClick={() => setOpen(true)}>
        Confirm payment…
      </button>
    );
  }

  return (
    <form ref={formRef} action={action} style={{ marginTop: 8, display: "grid", gap: 6 }}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="paymentStatus" ref={statusRef} defaultValue="" />

      <p className="wp-help" style={{ margin: 0 }}>
        Only after <strong>{total}</strong> has actually landed in your wallet or account.
      </p>
      <input
        name="paymentReference"
        className="wp-input"
        placeholder="Transaction hash / Cash App note"
        style={{ minHeight: 28, fontSize: 12, padding: "3px 6px" }}
      />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button
          type="button"
          className="wp-btn wp-btn-primary"
          style={{ height: 26, fontSize: 12 }}
          onClick={() => submitAs(
            "paid",
            `Mark ${reference} as PAID for ${total}?\n\nOnly do this if you have verified the funds arrived. This moves the order to Confirmed.`
          )}
        >
          Mark paid
        </button>
        <button
          type="button"
          className="wp-btn wp-btn-danger"
          style={{ height: 26, fontSize: 12 }}
          onClick={() => submitAs("failed", `Mark ${reference} as failed and cancel the order?`)}
        >
          Failed
        </button>
        <button type="button" className="wp-btn-plain" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}
