import "./admin.css";

export const metadata = {
  title: "Weedmaps — Admin",
  robots: { index: false, follow: false },
};

/* Only the visual shell. The auth guard lives in (panel)/layout.jsx so that
   /admin/login can render inside the same world without guarding itself. */
export default function AdminRootLayout({ children }) {
  return <div className="wp">{children}</div>;
}
