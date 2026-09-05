"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "./CartContext";
import SearchField from "./SearchField";
import Icon from "./Icons";
import { Wordmark } from "@/components/Logo";

export default function Header({ site }) {
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const pathname = usePathname();
  const { count, setOpen, openGate, identity } = useCart();

  /* Signed in shows who, not a second copy of the word. The local part is
     enough to recognise yourself by and short enough to sit in a 68px bar;
     the full address is one press away in the panel. */
  const who = identity ? identity.split("@")[0] : null;

  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menu]);

  useEffect(() => { setMenu(false); setSearch(false); }, [pathname]);

  const isActive = (href) => href !== "/" && pathname.startsWith(href);

  return (
    <header className="relative z-40 border-b border-rule">
      <div className="u-shell flex h-[68px] items-center justify-between gap-6">
        <Link href="/" className="flex items-center" aria-label="Weedmaps home">
          <Wordmark height={30} />
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {site.nav.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`relative text-[0.9rem] font-medium transition-colors duration-200 after:absolute after:-bottom-1.5 after:left-0 after:h-px after:bg-orange after:transition-all after:duration-300 hover:text-ink ${
                    isActive(item.href) ? "text-ink after:w-full" : "text-ink-soft after:w-0 hover:after:w-full"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSearch((v) => !v)}
            aria-label="Search"
            aria-expanded={search}
            className="grid h-11 w-11 place-items-center rounded-full text-ink-soft transition-colors duration-200 hover:bg-linen-deep hover:text-ink"
          >
            <Icon name={search ? "close" : "search"} size={19} />
          </button>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={count > 0 ? `Your bag, ${count} items` : "Your bag"}
            className="relative grid h-11 w-11 place-items-center rounded-full text-ink-soft transition-colors duration-200 hover:bg-linen-deep hover:text-ink"
          >
            <Icon name="bag" size={19} />
            {count > 0 && (
              <span className="u-data absolute right-1 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-orange px-1 text-[0.6875rem] font-semibold text-ink">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => openGate("signin")}
            aria-haspopup="dialog"
            aria-label={who ? `Signed in as ${identity}` : "Sign in"}
            className="u-pill ml-1 hidden h-11 max-w-[11rem] items-center gap-2 border border-ink px-4 text-[0.85rem] transition-colors duration-200 hover:bg-ink hover:text-linen sm:flex"
          >
            <Icon name={who ? "check" : "user"} size={16} className="shrink-0" />
            <span className="truncate">{who ?? "Sign in"}</span>
          </button>

          <button
            type="button"
            onClick={() => setMenu(true)}
            aria-label="Open menu"
            className="grid h-11 w-11 place-items-center rounded-full text-ink lg:hidden"
          >
            <span className="flex flex-col gap-[5px]">
              <span className="block h-px w-5 bg-current" />
              <span className="block h-px w-5 bg-current" />
              <span className="block h-px w-3.5 bg-current" />
            </span>
          </button>
        </div>
      </div>

      {search && (
        <div className="border-t border-rule bg-linen">
          <div className="u-shell py-4">
            <SearchField autoFocus onDone={() => setSearch(false)} />
          </div>
        </div>
      )}

      {menu && (
        <div className="fixed inset-0 z-50 flex flex-col bg-linen lg:hidden">
          <div className="u-shell flex h-[68px] shrink-0 items-center justify-between border-b border-rule">
            <span className="u-heading text-[1.35rem]">Weedmaps</span>
            <button
              type="button"
              onClick={() => setMenu(false)}
              aria-label="Close menu"
              className="grid h-11 w-11 place-items-center rounded-full text-ink hover:bg-linen-deep"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
          <nav aria-label="Mobile" className="u-shell flex-1 overflow-y-auto py-8">
            <SearchField onDone={() => setMenu(false)} />
            <ul className="mt-8 flex flex-col">
              {site.nav.map((item) => (
                <li key={item.label} className="border-b border-rule-soft">
                  <Link href={item.href} className="u-heading flex items-center justify-between py-5 text-[2rem] text-ink">
                    {item.label}
                    <Icon name="arrowUpRight" size={22} className="text-fade" />
                  </Link>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => { setMenu(false); openGate("signin"); }}
              aria-haspopup="dialog"
              className="u-pill mt-8 flex h-12 w-full items-center justify-center gap-2 bg-ink px-5 text-linen"
            >
              <Icon name={who ? "check" : "user"} size={17} />
              <span className="truncate">{who ? `Signed in as ${who}` : "Sign in"}</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
