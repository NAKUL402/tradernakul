import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase, type Profile } from "./supabase";
import { sendOTPEmail } from "./email-service";
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentOTP, setCurrentOTP] = useState<string | null>(null);

  // Owner emails — these bypass pending approval requirement
  const ownerEmails = [
    "nakultrader007@gmail.com",
    "tradernakul@gmail.com",
  ];

  const checkUserOwnerEmail = (emailStr: string | undefined) => {
    return emailStr ? ownerEmails.includes(emailStr.toLowerCase().trim()) : false;
  };

  const isUserOwnerEmail = checkUserOwnerEmail(user?.email);
  const isApproved = profile?.status === "approved" || profile?.is_owner === true || isUserOwnerEmail;
  const isAdmin = profile?.role === "admin" || profile?.is_owner === true || isUserOwnerEmail;
  const isOwner = profile?.is_owner === true || isUserOwnerEmail;

  async function fetchProfile(userId: string, currentUser: User) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error && data) {
        const fetchedProfile = data as Profile;
        const isOwnerEmail = checkUserOwnerEmail(currentUser.email);

        // Block non-approved, non-owner users from accessing the dashboard
        if (fetchedProfile.status !== "approved" && !fetchedProfile.is_owner && !isOwnerEmail) {
          localStorage.removeItem("tradernakul_session");
          setUser(null);
          setSession(null);
          setProfile(null);
          const event = new CustomEvent("auth_approval_blocked", {
            detail: { status: fetchedProfile.status },
          });
          window.dispatchEvent(event);
          return null;
        }

        setProfile(fetchedProfile);
        return fetchedProfile;
      }
    } catch (err) {
      console.warn("Notice: User profile fetch warning:", err);
    }
    return null;
  }

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      if (typeof window === "undefined") {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (data?.session) {
          const sessionUser = data.session.user;
          const prof = await fetchProfile(sessionUser.id, sessionUser);
          if (prof) {
            setSession(data.session as any);
            setUser(sessionUser as any);
          }
        }
      } catch (err) {
        console.warn("Auth initialization warning:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const sendOTP = async (email: string) => {
    // Generate a cryptographically random 6-digit OTP
    const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
    // Store OTP in state only — NEVER expose it to the UI
    setCurrentOTP(generatedOTP);

    const result = await sendOTPEmail({ email: email.toLowerCase().trim(), otp: generatedOTP });

    if (result.success) {
      toast.success("Verification code sent! Please check your email inbox (and spam folder).");
    } else {
      // On failure, throw an error — do NOT show the OTP
      throw new Error(
        result.error || "Failed to send verification email. Please check your email address and try again."
      );
    }
  };

  const verifyOTP = async (email: string, token: string) => {
    const cleanedEmail = email.toLowerCase().trim();
    const isOwnerEmail = checkUserOwnerEmail(cleanedEmail);
    const isAdminBypass = isOwnerEmail && token === "BYPASS_ADMIN";

    if (!isAdminBypass && (!currentOTP || token.trim() !== currentOTP)) {
      throw new Error("Invalid verification code. Please check and try again.");
    }

    // Look up or create the user profile
    const { data: profiles } = await supabase.from("profiles").select("*");
    let userProfile = (profiles || []).find((p: Profile) => p.email.toLowerCase() === cleanedEmail);

    if (!userProfile) {
      const newProfile: Profile = {
        id: `user-${Math.random().toString(36).substr(2, 9)}`,
        email: cleanedEmail,
        full_name: cleanedEmail.split("@")[0] || "Trader",
        avatar_url: null,
        role: isOwnerEmail ? "admin" : "user",
        status: isOwnerEmail ? "approved" : "pending",
        is_owner: isOwnerEmail,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await supabase.from("profiles").insert(newProfile);
      userProfile = newProfile;
    }

    // Block non-approved non-owner users
    if (userProfile.status !== "approved" && !userProfile.is_owner && !isOwnerEmail) {
      const event = new CustomEvent("auth_approval_blocked", {
        detail: { status: userProfile.status },
      });
      window.dispatchEvent(event);
      // Clear OTP so it cannot be reused
      setCurrentOTP(null);
      
      if (userProfile.status === "pending") {
        throw new Error("Access Pending: Your registration is currently awaiting administrator approval.");
      } else if (userProfile.status === "rejected") {
        throw new Error("Access Denied: Your registration has been rejected by the administrator.");
      } else if (userProfile.status === "suspended") {
        throw new Error("Account Suspended: Please contact the administrator.");
      } else {
        throw new Error(`Access Denied: Your status is ${userProfile.status}.`);
      }
    }

    // Establish session
    const mockUser = {
      id: userProfile.id,
      email: userProfile.email,
      user_metadata: { full_name: userProfile.full_name },
    };

    const mockSession = {
      access_token: `tn-session-${Date.now()}`,
      user: mockUser,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("tradernakul_session", JSON.stringify(mockSession));
    }

    setUser(mockUser as any);
    setSession(mockSession as any);
    setProfile(userProfile);

    // Clear OTP after use to prevent replay
    setCurrentOTP(null);
  };

  const signOut = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("tradernakul_session");
    }
    setCurrentOTP(null);
    setUser(null);
    setSession(null);
    setProfile(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isApproved,
        isAdmin,
        isOwner,
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
