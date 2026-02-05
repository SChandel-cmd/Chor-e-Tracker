import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SetupUsernameForm } from "./setup-username-form";

export default async function SetupUsernamePage() {
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

  if (profile?.username?.trim()) redirect("/");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-bold text-gray-900">
          Choose your username
        </h1>
        <p className="mt-2 text-center text-gray-600">
          This is how friends will find you.
        </p>
        <SetupUsernameForm />
      </div>
    </main>
  );
}
