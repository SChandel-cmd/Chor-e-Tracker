import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  // Use app URL when set (e.g. in prod) so redirects don't rely on request origin
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${baseUrl.replace(/\/$/, "")}${next}`);
    }
  }

  return NextResponse.redirect(`${baseUrl.replace(/\/$/, "")}/login?error=auth`);
}
