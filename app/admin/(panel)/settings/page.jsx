import Link from "next/link";
import { sql } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { getSession } from "@/lib/auth";
import { cloudinaryConfigured } from "@/lib/images";

export const dynamic = "force-dynamic";

export default async function SettingsAdmin() {
  const session = await getSession();
  const [[counts]] = await Promise.all([
    db.select({
      products: sql`(select count(*) from ${schema.products})`.mapWith(Number),
      customers: sql`(select count(*) from ${schema.customers})`.mapWith(Number),
      orders: sql`(select count(*) from ${schema.orders})`.mapWith(Number),
      admins: sql`(select count(*) from ${schema.adminUsers})`.mapWith(Number),
      withImage: sql`(select count(*) from ${schema.products} where image_avif is not null)`.mapWith(Number),
      onCloud: sql`(select count(*) from ${schema.products} where image_cloud_id is not null)`.mapWith(Number),
    }).from(sql`(select 1) as t`),
  ]);

  const users = await db.select({
    id: schema.adminUsers.id, username: schema.adminUsers.username,
    displayName: schema.adminUsers.displayName, email: schema.adminUsers.email,
    role: schema.adminUsers.role, lastLoginAt: schema.adminUsers.lastLoginAt,
  }).from(schema.adminUsers);

  return (
    <>
      <div className="wp-head"><h1 className="wp-title">Settings</h1></div>

      <div className="wp-grid wp-grid-2">
        <div className="wp-box">
          <div className="wp-box-head">Users</div>
          <div className="wp-box-body" style={{ padding: 0 }}>
            <table className="wp-table">
              <thead><tr><th>Username</th><th>Name</th><th>Role</th><th>Last login</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.username}</strong>{u.username === session?.username && <span className="wp-pill is-blue" style={{ marginLeft: 6 }}>You</span>}</td>
                    <td>{u.displayName}<div className="wp-help">{u.email}</div></td>
                    <td>{u.role}</td>
                    <td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("en-US") : "Never"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="wp-box">
            <div className="wp-box-head">Site</div>
            <div className="wp-box-body">
              <table className="wp-table" style={{ border: 0 }}>
                <tbody>
                  <tr><td style={{ width: 150, color: "var(--wp-text-soft)" }}>Fulfilment</td><td>Delivery only — no pickup anywhere in this product</td></tr>
                  <tr><td style={{ color: "var(--wp-text-soft)" }}>Products</td><td>{counts.products}</td></tr>
                  <tr><td style={{ color: "var(--wp-text-soft)" }}>Customers</td><td>{counts.customers}</td></tr>
                  <tr><td style={{ color: "var(--wp-text-soft)" }}>Orders</td><td>{counts.orders}</td></tr>
                  <tr><td style={{ color: "var(--wp-text-soft)" }}>Admin users</td><td>{counts.admins}</td></tr>
                  <tr>
                    <td style={{ color: "var(--wp-text-soft)" }}>Image hosting</td>
                    <td>
                      {cloudinaryConfigured() ? (
                        <>
                          <span className="wp-pill is-green"><span className="wp-dot" />Cloudinary</span>{" "}
                          {counts.onCloud} of {counts.withImage} products served from the CDN
                        </>
                      ) : (
                        <>
                          <span className="wp-pill is-grey">Local /public</span>{" "}
                          {counts.withImage} products with a photo. Add Cloudinary keys to
                          <code> .env.local</code> and run <code>npm run images:upload</code>.
                        </>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="wp-box">
            <div className="wp-box-head">Managing this install</div>
            <div className="wp-box-body">
              <p style={{ marginTop: 0 }}>
                Passwords are stored as scrypt hashes and never in plain text. To issue a new
                admin password, run this from the project directory:
              </p>
              <pre style={{
                background: "#f6f7f7", border: "1px solid var(--wp-border-soft)",
                padding: "8px 10px", overflowX: "auto", margin: "0 0 12px", fontSize: 12,
              }}>node db/seed-admin.js --reset-password</pre>
              <p className="wp-help" style={{ margin: 0 }}>
                It prints the new password once. Set <code>ADMIN_SESSION_SECRET</code> in
                <code> .env.local</code> before exposing this admin beyond localhost — sessions
                currently fall back to signing with the database URL.
              </p>
              <p style={{ marginTop: 12, marginBottom: 0 }}>
                <Link href="/">View the storefront &rarr;</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
