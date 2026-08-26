import Icon from "./Icons";

export default function AppCta() {
  return (
    <section className="bg-purple text-linen">
      <div className="u-shell grid items-center gap-x-16 gap-y-10 py-[clamp(3rem,6vw,5rem)] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div>
          <h2 className="u-display-thin max-w-[12ch] text-[clamp(2.4rem,6.5vw,4.5rem)]">
            Your shelf, in your pocket.
          </h2>
          <p className="u-prose mt-5 text-[1.05rem] leading-relaxed text-purple-tint">
            Save the products you keep coming back to, get a push the moment one drops below
            your price, and reorder from the shop that had it last time.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {[
              { icon: "apple", top: "Download on the", bottom: "App Store" },
              { icon: "android", top: "Get it on", bottom: "Google Play" },
            ].map((store) => (
              <button
                key={store.bottom}
                type="button"
                className="u-pill flex h-14 items-center gap-3 bg-linen px-6 text-ink transition-colors duration-200 hover:bg-ink hover:text-linen"
              >
                <Icon name={store.icon} size={22} />
                <span className="text-left leading-tight">
                  <span className="u-label block text-shade">{store.top}</span>
                  <span className="block text-[0.95rem] font-bold tracking-[-0.02em]">{store.bottom}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <ul className="grid gap-px overflow-hidden rounded-md bg-linen/25 sm:grid-cols-2 lg:grid-cols-1">
          {[
            { icon: "heart", title: "Price watch", body: "Told the moment a saved item drops." },
            { icon: "bag", title: "One-tap reorder", body: "Your last cart, at the shop that filled it." },
            { icon: "truck", title: "Live delivery windows", body: "Real ETAs, not a range from a brochure." },
          ].map((f) => (
            <li key={f.title} className="flex items-start gap-4 bg-purple p-5">
              <span className="mt-0.5 shrink-0 text-purple-tint">
                <Icon name={f.icon} size={22} />
              </span>
              <span>
                <span className="block text-[1rem] font-bold tracking-[-0.02em]">{f.title}</span>
                <span className="mt-1 block text-[0.9rem] leading-relaxed text-purple-tint">{f.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
