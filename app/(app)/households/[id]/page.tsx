import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HouseholdDetailContent } from "./household-detail-content";

export default async function HouseholdDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: householdId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: household, error: householdError } = await supabase
    .from("households")
    .select("id, name, created_by")
    .eq("id", householdId)
    .single();

  if (householdError || !household) notFound();

  const { data: membership } = await supabase
    .from("household_members")
    .select("role")
    .eq("household_id", householdId)
    .eq("user_id", user.id)
    .single();

  if (!membership) notFound();

  const [
    membersRes,
    templatesRes,
    entriesRes,
    friendsRes,
  ] = await Promise.all([
    supabase
      .from("household_members")
      .select("user_id, role, profiles(id, username, avatar_url)")
      .eq("household_id", householdId),
    supabase
      .from("chore_templates")
      .select("id, name, type, points")
      .eq("household_id", householdId)
      .order("name"),
    supabase
      .from("chore_entries")
      .select(
        `
        id,
        chore_id,
        created_by,
        created_at,
        chore_templates(name, points),
        chore_entry_participants(user_id, points_earned)
      `
      )
      .eq("household_id", householdId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("friend_requests")
      .select("sender_id, receiver_id")
      .eq("status", "accepted")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
  ]);

  type ProfileRow = { id: string; username: string | null; avatar_url: string | null };
  const members = (membersRes.data ?? []).map((m) => {
    const p: ProfileRow | null = Array.isArray(m.profiles)
      ? (m.profiles[0] as ProfileRow) ?? null
      : (m.profiles as ProfileRow | null);
    return {
      user_id: m.user_id,
      role: m.role,
      username: p?.username ?? "—",
      avatar_url: p?.avatar_url ?? null,
    };
  });

  const templates = templatesRes.data ?? [];
  const entries = entriesRes.data ?? [];

  const friendUserIds = new Set<string>();
  (friendsRes.data ?? []).forEach((r) => {
    friendUserIds.add(r.sender_id);
    friendUserIds.add(r.receiver_id);
  });
  friendUserIds.delete(user.id);
  const memberIds = new Set(members.map((m) => m.user_id));
  const inviteableFriendIds = Array.from(friendUserIds).filter((id) => !memberIds.has(id));

  const { data: inviteableProfiles } = inviteableFriendIds.length
    ? await supabase
        .from("profiles")
        .select("id, username")
        .in("id", inviteableFriendIds)
    : { data: [] };

  const leaderboardRows = (entriesRes.data ?? []).reduce(
    (acc, entry) => {
      const participants = (entry.chore_entry_participants ?? []) as { user_id: string; points_earned: number }[];
      participants.forEach((p) => {
        const cur = acc.get(p.user_id) ?? 0;
        acc.set(p.user_id, cur + Number(p.points_earned));
      });
      return acc;
    },
    new Map<string, number>()
  );

  const leaderboard = members.map((m) => ({
    user_id: m.user_id,
    username: m.username,
    avatar_url: m.avatar_url,
    total_points: leaderboardRows.get(m.user_id) ?? 0,
  })).sort((a, b) => b.total_points - a.total_points);

  const history = entries.map((e) => {
    const rawTemplate = e.chore_templates;
    const template = Array.isArray(rawTemplate)
      ? (rawTemplate[0] as { name: string; points: number } | undefined) ?? null
      : (rawTemplate as { name: string; points: number } | null);
    const participants = (e.chore_entry_participants ?? []) as { user_id: string; points_earned: number }[];
    return {
      id: e.id,
      chore_name: template?.name ?? "—",
      points: template?.points ?? 0,
      created_at: e.created_at,
      created_by: e.created_by,
      participants,
    };
  });

  const allUserIds = new Set<string>();
  history.forEach((h) => {
    allUserIds.add(h.created_by);
    h.participants.forEach((p) => allUserIds.add(p.user_id));
  });
  const { data: historyProfiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", Array.from(allUserIds));
  const usernameById = new Map(
    (historyProfiles ?? []).map((p) => [p.id, p.username ?? "—"])
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <Link
          href="/households"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Households
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900">{household.name}</h1>
      <p className="mt-1 text-gray-600">
        Chores, leaderboard, and history.
      </p>
      <HouseholdDetailContent
        householdId={householdId}
        members={members}
        templates={templates}
        leaderboard={leaderboard}
        history={history}
        usernameById={Object.fromEntries(usernameById)}
        inviteableFriends={inviteableProfiles ?? []}
        currentUserId={user.id}
      />
    </div>
  );
}
