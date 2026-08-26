"use client";

import { useActionState, useRef, useEffect } from "react";
import { SubmitButton, StateNotice } from "./FormState";

export default function NoteForm({ action, customerId }) {
  const [state, formAction] = useActionState(action, {});
  const ref = useRef(null);

  // Clear the box once the note has actually saved, not before.
  useEffect(() => { if (state?.ok && ref.current) ref.current.value = ""; }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="customerId" value={customerId} />
      <StateNotice state={state} />
      <div className="wp-field">
        <label className="wp-label" htmlFor="note-body">Add a note</label>
        <textarea
          id="note-body" name="body" ref={ref} className="wp-textarea"
          placeholder="Called about a delayed delivery…"
        />
      </div>
      <SubmitButton className="wp-btn wp-btn-primary" pendingLabel="Saving…">Add Note</SubmitButton>
    </form>
  );
}
