"use client";

import { useActionState } from "react";
import { SubmitButton, StateNotice } from "./FormState";

export default function PaymentMethodForm({ action, method }) {
  const [state, formAction] = useActionState(action, {});
  const isCrypto = method.kind === "crypto";

  return (
    <div className="wp-box" style={{ marginBottom: 0 }}>
      <div className="wp-box-head">
        {method.label}
        <span className={`wp-pill ${method.active ? "is-green" : "is-grey"}`}>
          <span className="wp-dot" />{method.active ? "Live" : "Off"}
        </span>
      </div>
      <div className="wp-box-body">
        <StateNotice state={state} />
        <form action={formAction}>
          <input type="hidden" name="id" value={method.id} />

          {method.network && (
            <p className="wp-help" style={{ marginTop: 0, marginBottom: 10 }}>
              Network: <strong>{method.network}</strong>
            </p>
          )}

          {isCrypto && (
            <>
              <div className="wp-field">
                <label className="wp-label" htmlFor={`dest-${method.id}`}>Wallet address</label>
                <input
                  id={`dest-${method.id}`} name="destination" className="wp-input"
                  defaultValue={method.destination ?? ""} spellCheck={false}
                  style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}
                />
                <p className="wp-help">
                  {method.destination
                    ? `${method.destination.length} characters currently saved.`
                    : "No address saved — the method cannot go live without one."}
                </p>
              </div>

              <div className="wp-field">
                <label className="wp-label" htmlFor={`conf-${method.id}`}>Confirmations required</label>
                <input
                  id={`conf-${method.id}`} name="confirmations" className="wp-input"
                  inputMode="numeric" defaultValue={method.confirmations ?? ""}
                />
              </div>
            </>
          )}

          <div className="wp-field">
            <label className="wp-label" htmlFor={`inst-${method.id}`}>Customer instructions</label>
            <textarea
              id={`inst-${method.id}`} name="instructions" className="wp-textarea"
              defaultValue={method.instructions ?? ""}
            />
          </div>

          <label className="wp-check" style={{ margin: "10px 0 14px" }}>
            <input type="checkbox" name="active" defaultChecked={method.active} />
            Offer this method at checkout
          </label>

          <SubmitButton className="wp-btn wp-btn-primary">Save {method.label}</SubmitButton>
        </form>
      </div>
    </div>
  );
}
