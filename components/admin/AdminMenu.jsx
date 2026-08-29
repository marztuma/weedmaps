"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminIcon from "./AdminIcons";

const MENU = [
  { label: "Dashboard", href: "/admin", icon: "dashboard", exact: true },
  { sep: true },
  {
    label: "Products", href: "/admin/products", icon: "products",
    sub: [
      { label: "All Products", href: "/admin/products" },
      { label: "Add New", href: "/admin/products/new" },
      { label: "Categories", href: "/admin/categories" },
      { label: "Brands", href: "/admin/brands" },
    ],
  },
  { label: "Delivery", href: "/admin/deliveries", icon: "delivery" },
  { sep: true },
  {
    label: "CRM", href: "/admin/customers", icon: "customers", countKey: "awaiting",
    sub: [
      { label: "Customers", href: "/admin/customers" },
      { label: "Orders", href: "/admin/orders" },
      { label: "Activity", href: "/admin/activity" },
    ],
  },
  { sep: true },
  { label: "Reviews", href: "/admin/reviews", icon: "customers", countKey: "pendingReviews" },
  { sep: true },
  { label: "Payments", href: "/admin/payments", icon: "orders" },
  { label: "Settings", href: "/admin/settings", icon: "settings" },
];

export default function AdminMenu({ counts = {} }) {
  const pathname = usePathname();

  const isCurrent = (item) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");

  const sectionOpen = (item) =>
    isCurrent(item) || (item.sub ?? []).some((s) => pathname === s.href || pathname.startsWith(s.href + "/"));

  return (
    <nav className="wp-menu" aria-label="Admin menu">
      <ul>
        {MENU.map((item, i) => {
          if (item.sep) return <li key={`sep-${i}`} className="wp-menu-sep" aria-hidden="true" />;
          const open = sectionOpen(item);
          return (
            <li key={item.href} className={`wp-menu-item${open ? " is-current" : ""}`}>
              <Link href={item.href} aria-current={isCurrent(item) ? "page" : undefined}>
                <AdminIcon name={item.icon} size={18} />
                <span>{item.label}</span>
                {item.countKey && counts[item.countKey] > 0 && (
                  <span className="wp-count">{counts[item.countKey]}</span>
                )}
              </Link>
              {item.sub && open && (
                <div className="wp-submenu">
                  {item.sub.map((s) => (
                    <Link
                      key={s.href}
                      href={s.href}
                      className={pathname === s.href ? "is-current" : undefined}
                    >
                      {s.label}
                    </Link>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
