"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const signOut = async () => {
    // Get user email before clearing
    const savedUser = localStorage.getItem("chore_tracker_google_user");
    let userEmail: string | null = null;
    if (savedUser) {
      try {
        userEmail = JSON.parse(savedUser).email;
      } catch {
        // ignore
      }
    }

    // Clear localStorage
    localStorage.removeItem("chore_tracker_google_user");

    // Revoke Google token if available
    if (window.google && userEmail) {
      window.google.accounts.id.revoke(userEmail, () => {
        console.log("Google session revoked");
      });
    }

    // Sign out from Supabase
    const supabase = createClient();
    await supabase.auth.signOut();
    
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={signOut}
      className="text-sm font-medium text-gray-600 hover:text-gray-900"
    >
      Sign out
    </button>
  );
}
