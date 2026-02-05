"use client";

import { GoogleAuthProvider, CustomGoogleButton } from "@/lib/auth";

export function LoginForm() {
  return (
    <GoogleAuthProvider>
      <div className="mt-6 flex justify-center">
        <CustomGoogleButton />
      </div>
    </GoogleAuthProvider>
  );
}
