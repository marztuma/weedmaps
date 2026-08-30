# seocrawl

652 indexable URLs, generated 2026-08-30T12:17:03.306Z from the live catalogue.

Regenerate with `npm run seo:crawl` — never edit these by hand. They are
built from the same rules as the live sitemap, so a hand edit would make one
of them wrong.

## Files

| File | What it is |
|---|---|
| `all-urls.txt` | Every URL, one per line |
| `sitemap.xml` | The same set as XML |
| `core-pages.txt` | The handful that matter most — submit these first |
| `categories.txt` | Category listings |
| `products.txt` | Product pages |
| `delivery-services.txt` | Delivery service pages |
| `brands.txt` | Brand pages that have stock |
| `learn-articles.txt` | Written guides |

## Using these with Google

**The sitemap is the main route.** In Search Console, Sitemaps, submit
`sitemap.xml` — the site serves it live at `https://weedmaps-iota.vercel.app/sitemap.xml`, so it
stays current on its own and there is nothing to re-upload. That is the only
step most sites need.

**`all-urls.txt` is a valid sitemap too.** Google accepts a plain text file of
URLs, so it can be uploaded and submitted the same way if you want a static
snapshot rather than the live one.

**URL Inspection is one page at a time**, and requesting indexing is rate
limited to a handful per day. It is worth doing for `core-pages.txt` and
nothing else — the rest is what the sitemap is for. Submitting the same URL
repeatedly does not make it index faster.

## What is deliberately not here

- `/checkout` and `/checkout/<reference>` — transactional, and an order page
  carries somebody's address
- `/admin` — behind a login
- `/search` — an unbounded query space, which is a crawl trap rather than content
- Brand pages with no products — thin pages, and submitting dozens of them
  invites a low-value judgement on the whole crawl
- `?page=`, `?sort=`, `?sub=` variants — each listing page canonicalises to
  itself, and the crawler reaches the deeper pages by following the pager
