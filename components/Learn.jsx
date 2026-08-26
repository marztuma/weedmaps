import Reveal from "./Reveal";
import Icon from "./Icons";

export default function Learn({ learn }) {
  return (
    <section id="learn" className="u-shell py-[clamp(3rem,6vw,5rem)]">
      <div className="grid gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div>
          <h2 className="u-heading text-[clamp(1.75rem,3.2vw,2.6rem)]">
            Four steps, then you&rsquo;re done.
          </h2>
          <ol className="mt-8">
            {learn.steps.map((step, i) => (
              <Reveal as="li" key={step.n} index={i} className="border-t border-rule py-5">
                <h3 className="text-[1.05rem] font-bold tracking-[-0.025em] text-ink">{step.n}</h3>
                <p className="u-prose mt-1.5 text-[0.95rem] leading-relaxed text-shade">{step.body}</p>
              </Reveal>
            ))}
          </ol>

          <div className="mt-8 flex items-start gap-3 border-t border-rule pt-6">
            <Icon name="shield" size={22} className="mt-0.5 shrink-0 text-green-text" />
            <p className="u-prose text-[0.9rem] leading-relaxed text-shade">
              Every shop listed here holds a current state license, and every product is
              lab-tested with a certificate of analysis on file. You must be 21+, or 18+ with a
              valid medical recommendation.
            </p>
          </div>
        </div>

        <div>
          <h2 className="u-heading text-[clamp(1.75rem,3.2vw,2.6rem)]">Worth reading first.</h2>
          <ul className="mt-8">
            {learn.reads.map((read, i) => (
              <Reveal as="li" key={read.title} index={i} className="border-t border-rule">
                <a href="#learn" className="group flex items-start gap-5 py-5">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[1.05rem] font-bold leading-snug tracking-[-0.025em] text-ink decoration-orange/60 underline-offset-4 group-hover:underline">
                      {read.title}
                    </span>
                    <span className="mt-1.5 block text-[0.9rem] leading-relaxed text-shade">
                      {read.deck}
                    </span>
                    <span className="u-meta mt-2 block text-mute">{read.mins} min read</span>
                  </span>
                  <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-rule text-ink transition-colors duration-200 group-hover:border-ink group-hover:bg-ink group-hover:text-linen">
                    <Icon name="arrowUpRight" size={16} />
                  </span>
                </a>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
