import Link from "next/link";
import Icon from "./Icons";

export function Breadcrumb({ trail }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="u-meta flex flex-wrap items-center gap-x-2 gap-y-1 text-mute">
        {trail.map((step, i) => (
          <li key={step.href ?? step.label} className="flex items-center gap-2">
            {i > 0 && <span className="text-rule" aria-hidden="true">/</span>}
            {step.href ? (
              <Link href={step.href} className="decoration-orange/60 underline-offset-4 transition-colors duration-200 hover:text-ink hover:underline">
                {step.label}
              </Link>
            ) : (
              <span className="text-ink">{step.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default function PageHeader({ trail, title, blurb, meta, action }) {
  return (
    <header className="u-shell pt-[clamp(1.5rem,3vw,2.5rem)] pb-[clamp(1.25rem,2.4vw,2rem)]">
      {trail && <Breadcrumb trail={trail} />}
      <div className="flex flex-col gap-x-10 gap-y-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="u-display max-w-[18ch] text-[clamp(2rem,5.4vw,4rem)]">{title}</h1>
          {blurb && <p className="u-prose mt-4 text-[1rem] leading-[1.5] text-shade">{blurb}</p>}
        </div>
        {(meta || action) && (
          <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
            {meta && <p className="u-meta text-shade">{meta}</p>}
            {action}
          </div>
        )}
      </div>
    </header>
  );
}

export function BackLink({ href, children }) {
  return (
    <Link href={href} className="u-pill inline-flex h-11 items-center gap-2 border border-ink px-4 text-[0.85rem] hover:bg-ink hover:text-linen">
      <Icon name="chevronLeft" size={15} />
      {children}
    </Link>
  );
}
