"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";

// ============================================
// Types
// ============================================

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name?: string;
  family_name?: string;
}

interface AuthContextType {
  user: GoogleUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGoogleLoaded: boolean;
  hasGoogleClientId: boolean;
  signInWithGoogle: () => void;
  /** Redirects to Google OAuth – use this for the main button so sign-in always works */
  signInWithGoogleRedirect: () => Promise<void>;
  signOut: () => Promise<void>;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleInitializeConfig) => void;
          renderButton: (element: HTMLElement, config: GoogleButtonConfig) => void;
          prompt: (callback?: (notification: PromptNotification) => void) => void;
          revoke: (email: string, callback: () => void) => void;
          cancel: () => void;
        };
      };
    };
    handleGoogleCredentialResponse?: (response: GoogleCredentialResponse) => void;
  }
}

interface GoogleInitializeConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  itp_support?: boolean;
}

interface GoogleButtonConfig {
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  width?: number;
  logo_alignment?: "left" | "center";
}

interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

interface PromptNotification {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  isDismissedMoment: () => boolean;
  getNotDisplayedReason: () => string;
  getSkippedReason: () => string;
  getDismissedReason: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Google Client ID from environment
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

// ============================================
// Auth Provider
// ============================================

export const GoogleAuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  // Parse JWT token from Google
  const parseJwt = (token: string): Record<string, string> | null => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  // Handle credential response from Google
  const handleCredentialResponse = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (response.credential) {
        const decoded = parseJwt(response.credential);

        if (decoded) {
          const googleUser: GoogleUser = {
            id: decoded.sub,
            email: decoded.email,
            name: decoded.name,
            picture: decoded.picture,
            given_name: decoded.given_name,
            family_name: decoded.family_name,
          };

          // Save to localStorage for quick access
          localStorage.setItem("chore_tracker_google_user", JSON.stringify(googleUser));

          setUser(googleUser);

          // Sign in to Supabase using the Google ID token
          // This exchanges the Google credential for a Supabase session
          const supabase = createClient();
          const { error } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: response.credential,
          });

          if (error) {
            console.error("Failed to sign in with Supabase:", error);
            // Clear the local user if Supabase sign-in failed
            localStorage.removeItem("chore_tracker_google_user");
            setUser(null);
            return;
          }

          // Reload to update server-side session
          window.location.href = "/";
        }
      }
    },
    []
  );

  // Load Google Identity Services script
  useEffect(() => {
    // Check for existing session from localStorage
    const savedUser = localStorage.getItem("chore_tracker_google_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("chore_tracker_google_user");
      }
    }
    setIsLoading(false);

    // Never block the UI for more than 1.5s – always show the sign-in button (or config message)
    const unblockUi = setTimeout(() => setIsGoogleLoaded(true), 1500);

    // If no Client ID, mark as "loaded" so UI shows config message instead of infinite Loading
    if (!GOOGLE_CLIENT_ID) {
      console.warn("Google Client ID not configured. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your .env.local");
      setIsGoogleLoaded(true);
      return () => {
        clearTimeout(unblockUi);
      };
    }

    // If script already in page (e.g. from previous nav), consider ready
    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );
    if (existingScript) {
      if (typeof window !== "undefined" && window.google) {
        setIsGoogleLoaded(true);
      }
      return () => clearTimeout(unblockUi);
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setIsGoogleLoaded(true);
    script.onerror = () => {
      console.warn("Google Identity Services script failed to load. Check network or try disabling ad blockers.");
      setIsGoogleLoaded(true);
    };
    document.head.appendChild(script);

    // Poll for window.google in case onload doesn't fire (e.g. some browsers/extensions)
    let pollCount = 0;
    const maxPoll = 25; // 5s
    const poll = setInterval(() => {
      if (typeof window !== "undefined" && window.google) {
        setIsGoogleLoaded(true);
        clearInterval(poll);
        return;
      }
      pollCount += 1;
      if (pollCount >= maxPoll) clearInterval(poll);
    }, 200);

    // Set global callback
    window.handleGoogleCredentialResponse = handleCredentialResponse;

    return () => {
      clearTimeout(unblockUi);
      clearInterval(poll);
      delete window.handleGoogleCredentialResponse;
    };
  }, [handleCredentialResponse]);

  // Initialize Google Sign-In when script is loaded
  useEffect(() => {
    if (isGoogleLoaded && window.google && GOOGLE_CLIENT_ID) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false, // Don't auto sign-in, let user click
        cancel_on_tap_outside: true,
        itp_support: true,
      });
    }
  }, [isGoogleLoaded, handleCredentialResponse]);

  const signInWithGoogle = useCallback(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.error(
        "Google Client ID not configured. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your .env.local"
      );
      return;
    }

    if (window.google) {
      // Show the One Tap prompt (may not always display)
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          console.log("One Tap not displayed:", notification.getNotDisplayedReason());
        }
        if (notification.isSkippedMoment()) {
          console.log("One Tap skipped:", notification.getSkippedReason());
        }
      });
    }
  }, []);

  const signInWithGoogleRedirect = useCallback(async () => {
    const supabase = createClient();
    // Use NEXT_PUBLIC_APP_URL in production so Supabase redirects to your real domain (not localhost)
    const baseUrl =
      typeof window !== "undefined"
        ? process.env.NEXT_PUBLIC_APP_URL || window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || "";
    const redirectTo = baseUrl ? `${baseUrl.replace(/\/$/, "")}/auth/callback` : "/auth/callback";
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      console.error("Google OAuth error:", error);
      return;
    }
    if (data?.url) {
      window.location.href = data.url;
    }
  }, []);

  const signOut = async () => {
    const userEmail = user?.email;

    // Clear local storage
    localStorage.removeItem("chore_tracker_google_user");
    setUser(null);

    // Revoke Google token
    if (window.google && userEmail) {
      window.google.accounts.id.revoke(userEmail, () => {
        console.log("Google session revoked");
      });
    }

    // Sign out from Supabase
    const supabase = createClient();
    await supabase.auth.signOut();

    // Refresh the page to reflect logout state
    window.location.href = "/login";
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isGoogleLoaded,
    hasGoogleClientId: !!GOOGLE_CLIENT_ID,
    signInWithGoogle,
    signInWithGoogleRedirect,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============================================
// Auth Hook
// ============================================

export const useGoogleAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useGoogleAuth must be used within a GoogleAuthProvider");
  }
  return context;
};

// ============================================
// Helper Functions
// ============================================

export const getUserDisplayName = (user: GoogleUser | null): string => {
  if (!user) return "Guest";
  return user.name || user.email?.split("@")[0] || "User";
};

export const getUserAvatar = (user: GoogleUser | null): string | null => {
  if (!user) return null;
  return user.picture || null;
};
