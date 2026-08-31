import Link from "next/link";
import Icon from "./Icons";
import Subscribe from "./Subscribe";
import { Wordmark } from "@/components/Logo";

export default function Footer({ site }) {
  return (
    <footer className="u-tooth border-t border-rule bg-linen-deep">
      <div className="u-shell py-[clamp(3rem,5vw,4.5rem)]">
        <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(0,1fr))]">
          <div>
            <Link href="/" className="flex items-center gap-2.5" aria-label="Weedmaps home">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-linen">
                <Icon name="pin" size={17} />
              </span>
              <Wordmark height={28} />
            </Link>
            <p className="u-prose mt-4 text-[0.9rem] leading-relaxed text-shade">
              A community connecting cannabis consumers, patients, retailers, doctors and
              brands since 2008.
            </p>
          </div>

          {site.footer.columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="u-label text-mute">{col.title}</h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[0.9rem] text-ink-soft decoration-orange/60 underline-offset-4 transition-colors duration-200 hover:text-ink hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 border-t border-rule pt-7">
          <h3 className="u-label text-mute">Delivering in</h3>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2.5">
            {site.footer.cities.map((city) => (
              <li key={city}>
                <Link
                  href="/deliveries"
                  className="text-[0.9rem] text-ink-soft decoration-orange/60 underline-offset-4 transition-colors duration-200 hover:text-ink hover:underline"
                >
                  {city}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 border-t border-rule pt-8">
          <h3 className="u-heading text-[clamp(1.1rem,2vw,1.4rem)]">Discount codes, now and then</h3>
          <p className="u-prose mt-2 max-w-[46ch] text-[0.9rem] leading-relaxed text-shade">
            A few emails a month with codes and what is new. Nothing else.
          </p>
          <div className="mt-4">
            <Subscribe source="footer" />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-5 border-t border-rule pt-7 md:flex-row md:items-start md:justify-between">
          <p className="u-prose text-[0.8rem] leading-relaxed text-shade">{site.footer.legal}</p>
          <p className="u-label shrink-0 text-mute">© 2026 Weedmaps · Terms · Privacy</p>
        </div>
      </div>
    </footer>
  );
}
