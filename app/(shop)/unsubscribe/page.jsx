import { unsubscribeByToken } from "@/app/(shop)/subscribe-actions";
import PageHeader from "@/components/PageHeader";

/* One click, no login, no confirmation step.
 *
 * Every extra step between "I want out" and being out converts an unsubscribe
 * into a spam complaint, and a complaint costs the sending domain far more than
 * the address was ever worth. So the link in the email does the thing, and this
 * page reports that it is done.
 *
 * noindex because the URL carries a token. */

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Unsubscribed — Weedmaps",
  robots: { index: false, follow: false },
};

export default async function Unsubscribe({ searchParams }) {
  const sp = await searchParams;
  const token = typeof sp?.t === "string" ? sp.t : "";
  const result = token ? await unsubscribeByToken(token) : { ok: false };

  return (
    <>
      <PageHeader
        trail={[{ label: "Home", href: "/" }, { label: "Unsubscribe" }]}
        title={result.ok ? "You're unsubscribed" : "That link did not work"}
        blurb={
          result.ok
            ? "No more marketing emails will be sent to that address. Anything about an order you have placed will still reach you — that is not marketing, and turning it off would leave you without your own receipt."
            : "The link may already have been used, or it may be incomplete. If you are still receiving emails you did not ask for, reply to any of them and a person will sort it."
        }
      />
    </>
  );
}
