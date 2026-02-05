"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addChoreTemplate(
  householdId: string,
  name: string,
  type: string,
  points: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const trimmedName = name.trim();
  const trimmedType = type.trim();
  if (!trimmedName) return { error: "Chore name is required." };
  if (points < 1) return { error: "Points must be at least 1." };

  const { error } = await supabase.from("chore_templates").insert({
    household_id: householdId,
    name: trimmedName,
    type: trimmedType || "general",
    points: Math.floor(points),
    created_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath(`/households/${householdId}`);
  return { error: null };
}

export async function logChore(
  householdId: string,
  choreId: string,
  participantUserIds: string[]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  if (participantUserIds.length === 0)
    return { error: "Select at least one participant." };

  const { data: template, error: templateError } = await supabase
    .from("chore_templates")
    .select("points")
    .eq("id", choreId)
    .eq("household_id", householdId)
    .single();

  if (templateError || !template)
    return { error: "Chore template not found." };

  const pointsEach =
    participantUserIds.length > 0
      ? Math.floor((template.points * 100) / participantUserIds.length) / 100
      : 0;

  const { data: entry, error: entryError } = await supabase
    .from("chore_entries")
    .insert({
      household_id: householdId,
      chore_id: choreId,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (entryError) return { error: entryError.message };

  const participants = participantUserIds.map((uid) => ({
    entry_id: entry.id,
    user_id: uid,
    points_earned: pointsEach,
  }));

  const { error: participantsError } = await supabase
    .from("chore_entry_participants")
    .insert(participants);

  if (participantsError) return { error: participantsError.message };

  revalidatePath(`/households/${householdId}`);
  return { error: null };
}
