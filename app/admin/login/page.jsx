import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Log In — Weedmaps Admin", robots: { index: false } };

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/admin");
  return <LoginForm />;
}
