import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { HouseholdsContent } from "./households-content";

export default async function HouseholdsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: memberships } = await supabase
    .from("household_members")
    .select("household_id, households(id, name)")
    .eq("user_id", user.id);

  const { data: invites } = await supabase
    .from("household_invites")
    .select("id, household_id, inviter_id, households(id, name)")
    .eq("invitee_id", user.id)
    .eq("status", "pending");

  const households = (memberships ?? [])
    .map((m) => {
      const h = m.households;
      const row = Array.isArray(h) ? (h[0] as { id: string; name: string } | undefined) : (h as { id: string; name: string } | null);
      return row ?? null;
    })
    .filter(Boolean) as { id: string; name: string }[];

  const pendingInvites = (invites ?? []).map((i) => {
    const h = i.households;
    const row = Array.isArray(h) ? (h[0] as { id: string; name: string } | undefined) : (h as { id: string; name: string } | null);
    return {
      id: i.id,
      household_id: row?.id ?? "",
      household_name: row?.name ?? "—",
    };
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Households</h1>
      <p className="mt-1 text-gray-600">
        Create or join a household to track chores together.
      </p>
      <HouseholdsContent
        households={households}
        pendingInvites={pendingInvites}
      />
    </div>
  );
}
