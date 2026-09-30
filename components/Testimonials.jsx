import Icon from "./Icons";

export default function Testimonials({ testimonials = [] }) {
  if (!testimonials?.length) return null;

  return (
    <section className="u-shell py-[clamp(2.5rem,5vw,4rem)]">
      <div className="mb-10">
        <h2 className="u-heading text-[clamp(1.55rem,3.1vw,2.6rem)]">What customers say</h2>
        <p className="u-prose mt-2 max-w-[60ch] text-[0.95rem] leading-relaxed text-shade">
          Real reviews from real customers who trust our products and service.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t, i) => (
          <div key={i} className="rounded-lg border border-rule bg-linen-deep p-6">
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, j) => (
                <Icon
                  key={j}
                  name={j < t.rating ? "star-filled" : "star"}
                  size={16}
                  className={j < t.rating ? "text-orange-text" : "text-mute"}
                />
              ))}
            </div>
            <p className="u-prose text-[0.95rem] leading-relaxed text-ink mb-4">"{t.quote}"</p>
            <div className="flex items-center justify-between pt-4 border-t border-rule">
              <div>
                <p className="text-[0.85rem] font-semibold text-ink">{t.name}</p>
                <p className="text-[0.75rem] text-shade">{t.location}</p>
              </div>
              <span className="u-meta text-[0.75rem] text-mute">{t.product}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
