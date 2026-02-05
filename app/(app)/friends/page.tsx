import { createClient } from "@/lib/supabase/server";
import { FriendsContent } from "./friends-content";

export default async function FriendsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [outgoingRes, incomingRes, acceptedRes] = await Promise.all([
    supabase
      .from("friend_requests")
      .select("id, receiver_id, status")
      .eq("sender_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("friend_requests")
      .select("id, sender_id, status")
      .eq("receiver_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("friend_requests")
      .select("id, sender_id, receiver_id")
      .eq("status", "accepted")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false }),
  ]);

  const pendingOutgoing = (outgoingRes.data ?? []).filter(
    (r) => r.status === "pending"
  );
  const pendingIncoming = incomingRes.data ?? [];
  const accepted = acceptedRes.data ?? [];

  const allIds = new Set<string>();
  pendingOutgoing.forEach((r) => allIds.add(r.receiver_id));
  pendingIncoming.forEach((r) => allIds.add(r.sender_id));
  accepted.forEach((r) => {
    allIds.add(r.sender_id);
    allIds.add(r.receiver_id);
  });

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", Array.from(allIds));

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, { username: p.username ?? "—", avatar_url: p.avatar_url }])
  );

  const pendingIncomingWithProfile = pendingIncoming.map((r) => ({
    id: r.id,
    sender_id: r.sender_id,
    status: r.status,
    username: profileMap.get(r.sender_id)?.username ?? "—",
    avatar_url: profileMap.get(r.sender_id)?.avatar_url ?? null,
  }));

  const pendingOutgoingWithProfile = pendingOutgoing.map((r) => ({
    id: r.id,
    receiver_id: r.receiver_id,
    status: r.status,
    username: profileMap.get(r.receiver_id)?.username ?? "—",
    avatar_url: profileMap.get(r.receiver_id)?.avatar_url ?? null,
  }));

  const friendsList = accepted.map((r) => {
    const otherId = r.sender_id === user.id ? r.receiver_id : r.sender_id;
    return {
      id: r.id,
      username: profileMap.get(otherId)?.username ?? "—",
      avatar_url: profileMap.get(otherId)?.avatar_url ?? null,
    };
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Friends</h1>
      <p className="mt-1 text-gray-600">
        Add friends by username and manage requests.
      </p>
      <FriendsContent
        pendingIncoming={pendingIncomingWithProfile}
        pendingOutgoing={pendingOutgoingWithProfile}
        friendsList={friendsList}
      />
    </div>
  );
}
