"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, pendingLabel, className = "wp-btn wp-btn-primary wp-btn-lg", ...rest }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} {...rest}>
      {pending ? (pendingLabel ?? "Saving…") : children}
    </button>
  );
}

export function StateNotice({ state }) {
  if (state?.errors?.length) {
    return (
      <div className="wp-notice is-error" role="alert">
        {state.errors.map((e) => <p key={e}>{e}</p>)}
      </div>
    );
  }
  if (state?.ok) {
    return (
      <div className="wp-notice is-success" role="status">
        <p>{state.message ?? "Saved."}</p>
      </div>
    );
  }
  return null;
}
