import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "./logout-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl flex-wrap items-center justify-between gap-2 px-4 sm:flex-nowrap">
          <Link href="/" className="text-lg font-semibold text-gray-900">
            Chore Tracker
          </Link>
          <nav className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Dashboard
            </Link>
            <Link
              href="/friends"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Friends
            </Link>
            <Link
              href="/households"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Households
            </Link>
            <span className="text-sm text-gray-500">@{profile?.username ?? "—"}</span>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
