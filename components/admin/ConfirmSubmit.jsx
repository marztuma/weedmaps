"use client";

/* A destructive submit that asks first. Deleting rows from a live catalogue
   should never be one stray click. */
export default function ConfirmSubmit({ message, className, children, ...rest }) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
