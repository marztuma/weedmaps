import Link from "next/link";
import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";

import { getSession } from "@/lib/auth";
import { db, schema } from "@/db/client";
import AdminMenu from "@/components/admin/AdminMenu";
import AdminIcon from "@/components/admin/AdminIcons";
import { logout } from "../actions";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const [{ awaiting }] = await db
    .select({ awaiting: sql`count(*) filter (where ${schema.orders.paymentStatus} = 'awaiting_payment')`.mapWith(Number) })
    .from(schema.orders);

  return (
    <>
      <header className="wp-bar">
        <div className="wp-bar-group">
          <Link href="/" className="wp-bar-item" target="_blank" rel="noreferrer">
            <AdminIcon name="site" size={16} />
            <span className="wp-bar-label">Visit site</span>
          </Link>
          <Link href="/admin/products/new" className="wp-bar-item">
            <AdminIcon name="plus" size={16} />
            <span className="wp-bar-label">New</span>
          </Link>
        </div>
        <div className="wp-bar-group">
          <span className="wp-bar-item wp-bar-label">Howdy, {session.name}</span>
          <form action={logout}>
            <button type="submit" className="wp-bar-item" style={{ background: "none", border: 0, color: "inherit", cursor: "pointer", font: "inherit" }}>
              <AdminIcon name="logout" size={16} />
              <span className="wp-bar-label">Log Out</span>
            </button>
          </form>
        </div>
      </header>

      <AdminMenu counts={{ awaiting }} />

      <main className="wp-content">{children}</main>
    </>
  );
}
