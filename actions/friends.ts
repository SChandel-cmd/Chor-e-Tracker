"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function sendFriendRequest(username: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const trimmed = username.trim().toLowerCase();
  if (!trimmed) return { error: "Username is required." };

  const { data: receiver } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", trimmed)
    .single();

  if (!receiver || receiver.id === user.id)
    return { error: "User not found or cannot add yourself." };

  const { error } = await supabase.from("friend_requests").insert({
    sender_id: user.id,
    receiver_id: receiver.id,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") return { error: "Request already sent." };
    return { error: error.message };
  }
  revalidatePath("/friends");
  return { error: null };
}

export async function acceptFriendRequest(requestId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("friend_requests")
    .update({ status: "accepted" })
    .eq("id", requestId)
    .eq("receiver_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/friends");
  return { error: null };
}

export async function declineFriendRequest(requestId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  await supabase
    .from("friend_requests")
    .delete()
    .eq("id", requestId)
    .eq("receiver_id", user.id);
  revalidatePath("/friends");
  return { error: null };
}
