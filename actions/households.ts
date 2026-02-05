"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createHousehold(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in.", id: null };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Household name is required.", id: null };

  const { data: householdId, error: rpcError } = await supabase.rpc(
    "create_household",
    { p_name: trimmed }
  );

  if (rpcError) return { error: rpcError.message, id: null };
  if (!householdId) return { error: "Failed to create household.", id: null };

  revalidatePath("/households");
  revalidatePath("/");
  return { error: null, id: householdId };
}

export async function inviteToHousehold(householdId: string, inviteeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("household_invites").insert({
    household_id: householdId,
    inviter_id: user.id,
    invitee_id: inviteeId,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") return { error: "Invite already sent." };
    return { error: error.message };
  }
  revalidatePath(`/households/${householdId}`);
  revalidatePath("/households");
  return { error: null };
}

export async function acceptHouseholdInvite(inviteId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: invite, error: fetchError } = await supabase
    .from("household_invites")
    .select("household_id")
    .eq("id", inviteId)
    .eq("invitee_id", user.id)
    .eq("status", "pending")
    .single();

  if (fetchError || !invite) return { error: "Invite not found or already used." };

  const { error: updateError } = await supabase
    .from("household_invites")
    .update({ status: "accepted" })
    .eq("id", inviteId);

  if (updateError) return { error: updateError.message };

  const { error: insertError } = await supabase.from("household_members").insert({
    household_id: invite.household_id,
    user_id: user.id,
    role: "member",
  });

  if (insertError) return { error: insertError.message };

  revalidatePath(`/households/${invite.household_id}`);
  revalidatePath("/households");
  revalidatePath("/");
  return { error: null };
}

export async function declineHouseholdInvite(inviteId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  await supabase
    .from("household_invites")
    .update({ status: "declined" })
    .eq("id", inviteId)
    .eq("invitee_id", user.id);

  revalidatePath("/households");
  revalidatePath("/");
  return { error: null };
}
