"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icon from "./Icons";
import { useCart } from "./CartContext";
import { ask, requestHuman } from "@/app/(shop)/chat-actions";

/* The chat launcher and panel.

   Deliberately not a modal. A shopper asking "do you deliver to me" is halfway
   through browsing, and a dialog that seizes the page and traps focus makes
   them lose their place. This is a panel anchored to its button: the page
   stays scrollable behind it, Escape closes it, and focus returns to the
   launcher where it started.

   The whole thing is client-side because a chat is stateful by nature, but it
   holds no secrets — every answer is composed on the server from the
   catalogue. */

const KEY = "wm-chat-key";

/** A random token identifying this browser's thread. Not a login: it groups
 *  messages and grants nothing, so it lives in localStorage without ceremony. */
function visitorKey() {
  try {
    let k = localStorage.getItem(KEY);
    if (!k || !/^[a-z0-9]{16,48}$/.test(k)) {
      k = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(36).padStart(2, "0")).join("").slice(0, 32);
      localStorage.setItem(KEY, k);
    }
    return k;
  } catch {
    // Private windows and blocked storage: a per-session key still works.
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(36).padStart(2, "0")).join("").slice(0, 32);
  }
}

const OPENERS = [
  "Do you deliver to me?",
  "How long does delivery take?",
  "What payment do you take?",
  "Is there a minimum order?",
];

export default function ChatWidget() {
  const { count, subtotal } = useCart();
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [askingHuman, setAskingHuman] = useState(false);
  const [handoff, setHandoff] = useState(null);
  const [minimized, setMinimized] = useState(false);
  const [showCart, setShowCart] = useState(true);
  const [thread, setThread] = useState([
    {
      role: "bot",
      text: "Hi. Ask me about delivery, fees, minimums, payment, ID or what is in stock. If I cannot answer, I will pass it to a person.",
    },
  ]);

  const panelRef = useRef(null);
  const launcherRef = useRef(null);
  const logRef = useRef(null);
  const inputRef = useRef(null);

  const hasCart = count > 0;

  useEffect(() => setKey(visitorKey()), []);

  // Escape closes and returns focus to where it came from.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") { setOpen(false); launcherRef.current?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Keep the newest message in view without yanking the whole page.
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [thread, askingHuman, handoff]);

  async function send(text) {
    const question = String(text ?? "").trim();
    if (!question || busy || !key) return;

    setError(null);
    setThread((t) => [...t, { role: "visitor", text: question }]);
    setBusy(true);

    const fd = new FormData();
    fd.set("visitorKey", key);
    fd.set("message", question);

    try {
      const res = await ask(null, fd);
      if (res?.error) setError(res.error);
      else {
        setThread((t) => [...t, { role: "bot", text: res.reply.text, links: res.reply.links }]);
        if (res.reply.intent === "unknown" || res.reply.intent === "contact") setAskingHuman(true);
      }
    } catch {
      setError("That did not go through. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handOff(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    form.set("visitorKey", key);
    setBusy(true);
    setError(null);
    try {
      const res = await requestHuman(null, form);
      if (res?.error) setError(res.error);
      else { setHandoff(res.message); setAskingHuman(false); }
    } catch {
      setError("That did not go through. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="wm-chat-panel"
        className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-ink text-linen shadow-lg transition-transform duration-200 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <Icon name={open ? "close" : "search"} size={22} />
        <span className="sr-only">{open ? "Close chat" : "Ask a question"}</span>
      </button>

      <div
        id="wm-chat-panel"
        ref={panelRef}
        role="region"
        aria-label="Ask a question"
        hidden={!open}
        className="fixed bottom-24 right-5 z-40 flex max-h-[min(36rem,calc(100vh-8rem))] w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-md border border-rule bg-paper shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-rule px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-linen">
              <Icon name="messageCircle" size={16} />
            </div>
            <span className="text-[0.95rem] font-semibold text-ink">Support</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMinimized(!minimized)}
              className="flex h-8 w-8 items-center justify-center rounded text-mute transition-colors hover:bg-rule hover:text-ink"
              title={minimized ? "Maximize" : "Minimize"}
            >
              <Icon name={minimized ? "plus" : "minus"} size={16} />
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); launcherRef.current?.focus(); }}
              className="flex h-8 w-8 items-center justify-center rounded text-mute transition-colors hover:bg-rule hover:text-ink"
              title="Close"
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        </div>

        {!minimized && hasCart && showCart && (
          <div className="border-b border-rule bg-linen-deep/50 px-5 py-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[1rem] font-semibold text-ink">👋 You left something behind.</p>
                <p className="mt-2 text-[0.9rem] leading-relaxed text-shade">
                  Your order is waiting — pick up where you left off and complete checkout. We deliver to all fifty states.
                </p>
              </div>
              <button
                onClick={() => setShowCart(false)}
                className="ml-2 shrink-0 text-mute hover:text-ink"
                title="Dismiss"
              >
                <Icon name="x" size={16} />
              </button>
            </div>
            <Link href="/checkout" onClick={() => setOpen(false)} className="mt-3 block rounded-xs bg-ink py-2.5 text-center text-[0.9rem] font-semibold text-linen transition-colors hover:bg-ink-soft">
              Go to checkout
            </Link>
          </div>
        )}

        {!minimized && (
        <div
          ref={logRef}
          className="flex-1 overflow-y-auto px-4 py-4"
          role="log"
          aria-live="polite"
          aria-atomic="false"
        >
          {thread.map((m, i) => (
            <div key={i} className={`mb-3 flex ${m.role === "visitor" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-md px-3 py-2 text-[0.9rem] leading-relaxed ${
                  m.role === "visitor" ? "bg-ink text-linen" : "bg-linen-deep text-ink"
                }`}
              >
                <p>{m.text}</p>
                {m.links?.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1">
                    {m.links.map((l) => (
                      <li key={l.href}>
                        <Link
                          href={l.href}
                          onClick={() => setOpen(false)}
                          className="text-[0.85rem] font-semibold text-ink underline decoration-orange/60 underline-offset-4 hover:decoration-orange"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}

          {busy && <p className="u-meta text-mute">Checking the menu…</p>}
          {error && <p className="u-meta text-orange-text" role="alert">{error}</p>}
          {handoff && <p className="u-meta text-ink">{handoff}</p>}

          {askingHuman && !handoff && (
            <form onSubmit={handOff} className="mt-2 rounded-md border border-rule bg-linen-deep p-3">
              <label className="u-label block text-mute" htmlFor="wm-chat-email">
                Your email, and a person will reply
              </label>
              <input
                id="wm-chat-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-1.5 h-11 w-full rounded-sm border border-rule bg-linen px-3 text-[0.9rem] text-ink outline-none focus:border-ink"
              />
              <textarea
                name="note"
                rows={2}
                placeholder="Anything else worth knowing (optional)"
                className="mt-2 w-full rounded-sm border border-rule bg-linen p-2.5 text-[0.9rem] text-ink outline-none focus:border-ink"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="u-pill inline-flex h-11 items-center bg-ink px-4 text-[0.85rem] font-semibold text-linen hover:bg-ink-soft disabled:opacity-60"
                >
                  Send
                </button>
                <button
                  type="button"
                  onClick={() => setAskingHuman(false)}
                  className="u-pill inline-flex h-11 items-center border border-rule px-4 text-[0.85rem] text-ink-soft hover:border-ink hover:text-ink"
                >
                  No thanks
                </button>
              </div>
            </form>
          )}

          {thread.length === 1 && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {OPENERS.map((o) => (
                <li key={o}>
                  <button
                    type="button"
                    onClick={() => send(o)}
                    className="u-pill inline-flex h-11 items-center border border-rule px-3 text-[0.8rem] text-ink-soft hover:border-ink hover:text-ink"
                  >
                    {o}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        )}

        {!minimized && (
        <div className="border-t border-rule px-4 py-3 space-y-3">
          {/* Agent Section */}
          <div className="rounded-sm bg-ink-soft/20 p-3">
            <div className="flex items-start gap-2">
              <Icon name="sparkles" size={16} className="mt-0.5 shrink-0 text-ink" />
              <div className="min-w-0">
                <p className="text-[0.8rem] font-semibold text-ink">Agent</p>
                <p className="mt-0.5 text-[0.75rem] leading-relaxed text-shade">
                  Get instant help with browsing, orders & delivery
                </p>
              </div>
            </div>
          </div>

          {/* Support Section */}
          <div className="rounded-sm bg-linen-deep/50 p-3">
            <div className="flex items-start gap-2">
              <Icon name="headphones" size={16} className="mt-0.5 shrink-0 text-ink" />
              <div className="min-w-0">
                <p className="text-[0.8rem] font-semibold text-ink">Support</p>
                <p className="mt-0.5 text-[0.75rem] leading-relaxed text-shade">
                  Help with account, tracking & general questions
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-[0.7rem] text-mute">
            💬 We typically reply within 2 hours
          </p>
        </div>
        )}

        {!minimized && (
        <form
          onSubmit={(e) => { e.preventDefault(); const v = inputRef.current.value; inputRef.current.value = ""; send(v); }}
          className="flex items-center gap-2 border-t border-rule p-3"
        >
          <input
            ref={inputRef}
            name="message"
            maxLength={1000}
            placeholder="Ask a question…"
            aria-label="Your question"
            className="h-11 min-w-0 flex-1 rounded-sm border border-rule bg-linen px-3 text-[0.9rem] text-ink outline-none focus:border-ink"
          />
          <button
            type="submit"
            disabled={busy}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-linen hover:bg-ink-soft disabled:opacity-60"
          >
            <Icon name="arrowUpRight" size={16} />
            <span className="sr-only">Send</span>
          </button>
        </form>
        )}
      </div>
    </>
  );
}
