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
    </>
  );
}
