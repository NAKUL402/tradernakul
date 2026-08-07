import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase, type Profile } from "./supabase";
import { toast } from "sonner";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isApproved: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  sendOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Open Access Default Profile
const OPEN_ACCESS_USER: User = {
  id: "open-access-trader-007",
  app_metadata: { provider: "email" },
  user_metadata: { name: "Trader Nakul" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
  email: "nakultrader007@gmail.com",
} as unknown as User;

const OPEN_ACCESS_PROFILE: Profile = {
  id: "open-access-trader-007",
  email: "nakultrader007@gmail.com",
  full_name: "Trader Nakul",
  avatar_url: null,
  role: "admin",
  status: "approved",
  is_owner: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const OPEN_ACCESS_SESSION: Session = {
  access_token: "open-access-token",
  token_type: "bearer",
  expires_in: 3600000,
  refresh_token: "open-access-refresh",
  user: OPEN_ACCESS_USER,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(OPEN_ACCESS_USER);
  const [session, setSession] = useState<Session | null>(OPEN_ACCESS_SESSION);
  const [profile, setProfile] = useState<Profile | null>(OPEN_ACCESS_PROFILE);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Open Access Mode — immediately active for all visitors
    setUser(OPEN_ACCESS_USER);
    setSession(OPEN_ACCESS_SESSION);
    setProfile(OPEN_ACCESS_PROFILE);
    setIsLoading(false);
  }, []);

  const sendOTP = async (email: string) => {
    toast.success(`Open Access active! Verification code sent to ${email} (Instant Access Enabled).`);
  };

  const verifyOTP = async (email: string, _token: string) => {
    const cleanedEmail = email.toLowerCase().trim();
    const activeProfile: Profile = {
      id: `usr-${cleanedEmail.replace(/[^a-z0-9]/g, "")}`,
      email: cleanedEmail,
      full_name: cleanedEmail.split("@")[0] || "Trader",
      avatar_url: null,
      role: "admin",
      status: "approved",
      is_owner: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setUser({ id: activeProfile.id, email: cleanedEmail } as User);
    setProfile(activeProfile);
    toast.success("Welcome to TraderNakul AI! Instant Open Access Granted.");
  };

  const signOut = async () => {
    toast.info("Open Access Mode: You are free to browse and use all features.");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading: false,
        isApproved: true,
        isAdmin: true,
        isOwner: true,
        sendOTP,
        verifyOTP,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
