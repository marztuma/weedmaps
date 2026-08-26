import { asc } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { savePaymentMethod } from "../../actions";
import PaymentMethodForm from "@/components/admin/PaymentMethodForm";
import { emailConfigured } from "@/lib/notify";

export const dynamic = "force-dynamic";

export default async function PaymentsAdmin() {
  const methods = await db.select().from(schema.paymentMethods)
    .orderBy(asc(schema.paymentMethods.sortOrder));

  const crypto = methods.filter((m) => m.kind === "crypto");
  const apps = methods.filter((m) => m.kind === "app");
  const mail = emailConfigured();

  return (
    <>
      <div className="wp-head">
        <h1 className="wp-title">Payments</h1>
        <span className="wp-subtitle">Wallets and handles shown to customers at checkout</span>
      </div>

      <div className="wp-notice is-warning">
        <p>
          <strong>Nothing here confirms itself.</strong> Crypto, Cash App and Zelle are push
          payments with no callback into this site, so every order stays <em>Awaiting
          payment</em> until someone verifies the funds arrived and marks it paid on the{" "}
          <a href="/admin/orders">Orders</a> screen. There is no automatic confirmation
          anywhere in this system, by design.
        </p>
      </div>

      <div className={`wp-notice ${mail ? "is-success" : ""}`}>
        <p>
          {mail ? (
            <>Order emails are configured and will be sent to <code>{process.env.ADMIN_EMAIL}</code>.</>
          ) : (
            <>
              <strong>Email is not configured.</strong> New orders still appear in the admin
              panel and on the Orders screen — nothing is lost. To also receive them by email,
              set <code>SMTP_HOST</code>, <code>SMTP_PORT</code>, <code>SMTP_USER</code>,{" "}
              <code>SMTP_PASS</code> and <code>ADMIN_EMAIL</code> in <code>.env.local</code>.
            </>
          )}
        </p>
      </div>

      <div className="wp-box">
        <div className="wp-box-head">Crypto wallets</div>
        <div className="wp-box-body">
          <p className="wp-help" style={{ marginTop: 0 }}>
            Addresses are format-checked before saving. A wrong character sends customer funds
            somewhere nobody can recover them — verify against your own wallet, not just the
            screen.
          </p>
          <div className="wp-grid wp-grid-3" style={{ marginTop: 14 }}>
            {crypto.map((m) => (
              <PaymentMethodForm key={m.id} action={savePaymentMethod} method={m} />
            ))}
          </div>
        </div>
      </div>

      <div className="wp-box">
        <div className="wp-box-head">Cash App &amp; Zelle</div>
        <div className="wp-box-body">
          <p className="wp-help" style={{ marginTop: 0 }}>
            These are handled by email after the order lands, so no handle is published on the
            storefront. Whatever you write here is shown to the customer as instructions.
          </p>
          <div className="wp-grid wp-grid-2" style={{ marginTop: 14 }}>
            {apps.map((m) => (
              <PaymentMethodForm key={m.id} action={savePaymentMethod} method={m} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
