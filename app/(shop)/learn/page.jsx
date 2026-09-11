import Link from "next/link";
import learn from "@/data/learn.json";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import Icon from "@/components/Icons";
import JsonLd from "@/components/JsonLd";
import { canonical, breadcrumbSchema } from "@/lib/seo";

export const metadata = {
  title: "Learn — how delivery, dosing and lab reports actually work — Weedmaps",
  description:
    "Plain explanations of the things worth knowing before you order: what a certificate of analysis says, why THC percentage misleads, how to dose edibles, and what happens after checkout.",
  alternates: canonical("/learn"),
};

export default function LearnIndex() {
  const trail = [{ label: "Home", href: "/" }, { label: "Learn" }];

  return (
    <>
      <JsonLd data={breadcrumbSchema(trail)} />

      <PageHeader
        trail={trail}
        title="Worth reading first"
        blurb="Four things that change how you shop: what the lab report says, why the potency number misleads, how edibles actually land, and what happens between checkout and the door."
        meta={`${learn.reads.length} articles`}
      />

      <section className="u-shell py-[clamp(2.5rem,5vw,4rem)]">
        <ul className="grid gap-x-16 sm:grid-cols-2">
          {learn.reads.map((read, i) => (
            <Reveal as="li" key={read.slug} index={i % 2} className="border-t border-rule">
              <Link href={`/learn/${read.slug}`} className="group flex items-start gap-5 py-6">
                <span className="min-w-0 flex-1">
                  <span className="block text-[1.15rem] font-bold leading-snug tracking-[-0.025em] text-ink decoration-orange/60 underline-offset-4 group-hover:underline">
                    {read.title}
                  </span>
                  <span className="mt-2 block text-[0.95rem] leading-relaxed text-shade">
                    {read.deck}
                  </span>
                  <span className="u-meta mt-3 block text-mute">{read.mins} min read</span>
                </span>
                <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-rule text-ink transition-colors duration-200 group-hover:border-ink group-hover:bg-ink group-hover:text-linen">
                  <Icon name="arrowUpRight" size={16} />
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="u-shell py-[clamp(2.5rem,5vw,4rem)]">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 p-8 sm:p-12 lg:p-16">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-600/30 via-transparent to-transparent" />
          </div>

          <div className="relative z-10 grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left Side */}
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Stay highly informed.</h2>
              <p className="text-lg text-white/80 mb-8">Get weekly cannabis news right to your inbox.</p>
              <Link
                href="/email-signup"
                className="inline-block px-6 py-3 rounded-full bg-cyan-300 hover:bg-cyan-200 text-slate-900 font-semibold transition-colors duration-200"
              >
                Get updates
              </Link>
            </div>

            {/* Right Side */}
            <div className="space-y-4 lg:pl-8">
              <div className="flex items-center gap-3">
                <Icon name="pin" size={24} className="text-cyan-300 flex-shrink-0" />
                <span className="text-lg text-white">Learn about strains</span>
              </div>
              <div className="flex items-center gap-3">
                <Icon name="pin" size={24} className="text-cyan-300 flex-shrink-0" />
                <span className="text-lg text-white">Get the latest cannabis news</span>
              </div>
              <div className="flex items-center gap-3">
                <Icon name="pin" size={24} className="text-cyan-300 flex-shrink-0" />
                <span className="text-lg text-white">Get curated content</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
