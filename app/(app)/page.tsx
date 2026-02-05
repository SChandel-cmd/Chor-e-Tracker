import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: households } = await supabase
    .from("household_members")
    .select(
      `
      household_id,
      households (
        id,
        name
      )
    `
    )
    .eq("user_id", user.id);

  const list = households?.flatMap((r) => {
    const h = r.households;
    if (!h) return [];
    return (Array.isArray(h) ? h : [h]) as { id: string; name: string }[];
  }) ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-gray-600">
        Your households and quick links.
      </p>
      <div className="mt-6 flex flex-col gap-4">
        <Link
          href="/households"
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:bg-gray-50"
        >
          <h2 className="font-semibold text-gray-900">Households</h2>
          <p className="text-sm text-gray-600">
            {list.length === 0
              ? "Create or join a household to start tracking chores."
              : `You're in ${list.length} household(s).`}
          </p>
        </Link>
        <Link
          href="/friends"
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:bg-gray-50"
        >
          <h2 className="font-semibold text-gray-900">Friends</h2>
          <p className="text-sm text-gray-600">
            Add friends and invite them to your households.
          </p>
        </Link>
        {list.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-gray-900">Your households</h2>
            <ul className="mt-2 space-y-2">
              {list.map((h) => (
                <li key={h.id}>
                  <Link
                    href={`/households/${h.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {h.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
