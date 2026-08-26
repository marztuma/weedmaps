"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SubmitButton, StateNotice } from "./FormState";

/* The small add/edit panel WordPress puts beside taxonomy list tables.
   Declarative fields so brands, categories and similar reuse one component. */
export default function SimpleEditor({
  action, title, record, fields, submitLabel, cancelHref, extraHidden,
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <div className="wp-box">
      <div className="wp-box-head">{title}</div>
      <div className="wp-box-body">
        <StateNotice state={state} />
        <form action={formAction} key={record?.id ?? "new"}>
          {record && <input type="hidden" name="id" value={record.id} />}
          {Object.entries(extraHidden ?? {}).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}

          {fields.map((f) => {
            const value = record?.[f.name];
            if (f.type === "checkbox") {
              return (
                <label key={f.name} className="wp-check" style={{ margin: "10px 0" }}>
                  <input type="checkbox" name={f.name} defaultChecked={Boolean(value)} />
                  {f.label}
                </label>
              );
            }
            if (f.type === "textarea") {
              return (
                <div className="wp-field" key={f.name}>
                  <label className="wp-label" htmlFor={`f-${f.name}`}>{f.label}</label>
                  <textarea id={`f-${f.name}`} name={f.name} className="wp-textarea" defaultValue={value ?? ""} />
                  {f.help && <p className="wp-help">{f.help}</p>}
                </div>
              );
            }
            if (f.type === "select") {
              return (
                <div className="wp-field" key={f.name}>
                  <label className="wp-label" htmlFor={`f-${f.name}`}>{f.label}</label>
                  <select id={`f-${f.name}`} name={f.name} className="wp-select" defaultValue={value ?? f.options?.[0]?.value ?? ""}>
                    {(f.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  {f.help && <p className="wp-help">{f.help}</p>}
                </div>
              );
            }
            return (
              <div className="wp-field" key={f.name}>
                <label className="wp-label" htmlFor={`f-${f.name}`}>
                  {f.label}{f.required && <span className="wp-required"> *</span>}
                </label>
                <input
                  id={`f-${f.name}`} name={f.name} className="wp-input"
                  required={f.required} inputMode={f.inputMode}
                  defaultValue={value ?? f.defaultValue ?? ""}
                  placeholder={f.placeholder}
                />
                {f.help && <p className="wp-help">{f.help}</p>}
              </div>
            );
          })}

          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
            <SubmitButton className="wp-btn wp-btn-primary">{submitLabel}</SubmitButton>
            {record && cancelHref && <Link href={cancelHref} className="wp-btn">Cancel</Link>}
          </div>
        </form>
      </div>
    </div>
  );
}
