"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "../actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, {});

  return (
    <div className="wp-login">
      <div className="wp-login-mark">
        <svg width="84" height="84" viewBox="0 0 32 32" aria-label="Weedmaps">
          <rect width="32" height="32" rx="7" fill="#1d2327" />
          <g fill="none" stroke="#f0f0f1" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 26s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" />
            <circle cx="16" cy="14.6" r="2.7" />
          </g>
        </svg>
      </div>

      {state?.error && (
        <div className="wp-notice is-error" style={{ maxWidth: 340, width: "100%" }} role="alert">
          <p><strong>Error:</strong> {state.error}</p>
        </div>
      )}

      <form action={action} className="wp-login-card">
        <div className="wp-field">
          <label className="wp-label" htmlFor="username">Username or Email Address</label>
          <input
            id="username" name="username" className="wp-input" autoComplete="username"
            autoFocus required defaultValue={state?.username ?? ""}
          />
        </div>

        <div className="wp-field">
          <label className="wp-label" htmlFor="password">Password</label>
          <input
            id="password" name="password" type="password" className="wp-input"
            autoComplete="current-password" required
          />
        </div>

        <label className="wp-check" style={{ margin: "14px 0 18px" }}>
          <input type="checkbox" name="remember" />
          Remember Me
        </label>

        <button type="submit" className="wp-btn wp-btn-primary wp-btn-lg" style={{ width: "100%", justifyContent: "center" }} disabled={pending}>
          {pending ? "Logging in…" : "Log In"}
        </button>
      </form>

      <p style={{ marginTop: 20, fontSize: 13 }}>
        <Link href="/">&larr; Go to Weedmaps</Link>
      </p>
    </div>
  );
}
