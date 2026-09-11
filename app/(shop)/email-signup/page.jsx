import Link from "next/link";
import Subscribe from "@/components/Subscribe";
import PageHeader from "@/components/PageHeader";
import JsonLd from "@/components/JsonLd";
import { canonical, breadcrumbSchema } from "@/lib/seo";

export const metadata = {
  title: "Get Email Notifications — Weedmaps",
  description:
    "Subscribe to Weedmaps email notifications to get weekly deals, new product arrivals, and cannabis news delivered to your inbox.",
  alternates: canonical("/email-signup"),
};

export default function EmailSignup() {
  const trail = [{ label: "Home", href: "/" }, { label: "Email Notifications" }];

  return (
    <>
      <JsonLd data={breadcrumbSchema(trail)} />

      <PageHeader
        trail={trail}
        title="Stay in the loop"
        blurb="Get weekly deals, product releases, and cannabis news delivered straight to your inbox. We'll never spam you — just the good stuff."
      />

      <section className="u-shell py-[clamp(3rem,5vw,5rem)]">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscribe to our newsletter</h2>
            <p className="text-gray-600 mb-8">
              Get weekly deals, restock alerts, and the latest cannabis news delivered to your email. Unsubscribe anytime.
            </p>

            <div className="mb-8">
              <Subscribe source="email-signup" />
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">What you'll get:</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-orange-500 font-bold mt-1">✓</span>
                  <span>Weekly deals and discounts from delivery services</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-500 font-bold mt-1">✓</span>
                  <span>Product restock alerts for your favorite brands</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-500 font-bold mt-1">✓</span>
                  <span>Cannabis education and strain information</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-500 font-bold mt-1">✓</span>
                  <span>Latest cannabis news and industry updates</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
              <p>
                By subscribing, you agree to our{" "}
                <Link href="/privacy" className="text-orange-600 hover:underline">
                  Privacy Policy
                </Link>
                . Unsubscribe link included in every email.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
