import { searchProducts } from "@/db/queries";
import PageHeader from "@/components/PageHeader";
import ProductGrid from "@/components/ProductGrid";
import SearchField from "@/components/SearchField";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Search — Weedmaps",
  // An unbounded query space: every ?q= is a permutation of the catalogue
  // rather than a page of its own. robots.txt disallows crawling it to protect
  // crawl budget; this keeps the URL itself out of the index even when it is
  // reached from an external link, which Disallow alone does not prevent.
  robots: { index: false, follow: true },
};

export default async function SearchPage({ searchParams }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const results = q ? await searchProducts(q) : [];

  return (
    <>
      <PageHeader
        trail={[{ label: "Home", href: "/" }, { label: "Search" }]}
        title={q ? `“${q}”` : "Search the shelf"}
        blurb={
          q
            ? null
            : "Look up a strain, a brand, a category or a strain type — Biscotti, STIIIZY, edibles, indica."
        }
        meta={q ? `${results.length} ${results.length === 1 ? "result" : "results"}` : null}
      />

      <section className="u-shell border-y border-rule py-5">
        <SearchField defaultValue={q} />
      </section>

      <section className="u-shell py-[clamp(2.5rem,5vw,4rem)]">
        {q ? (
          <ProductGrid
            products={results}
            emptyTitle={`Nothing matches “${q}”.`}
            emptyBody="Try a brand, a strain name, a category, or a strain type like indica or sativa."
          />
        ) : (
          <p className="u-prose text-[0.95rem] text-shade">
            Type something above to search 152 products across 80 brands.
          </p>
        )}
      </section>
    </>
  );
}
