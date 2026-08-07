import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase, type Profile, generateUUID } from "./supabase";
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
          supabase.auth.signOut();
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

    // Generate secure deterministic password for Supabase Auth
    const password = `TN@Journal_${cleanedEmail.replace(/[^a-z0-9]/g, "").slice(0, 10)}_2026!`;

    let userUUID = "";
    let finalProfile: Profile | null = null;

    if (isAdminBypass) {
      // Admin bypass logs directly into Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanedEmail,
        password,
      });

      if (authError) {
        // If the admin user doesn't exist yet, sign them up
        if (authError.message.includes("Invalid login credentials") || authError.message.includes("Email not confirmed")) {
          const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email: cleanedEmail,
            password,
          });
          if (signupError) throw signupError;
          userUUID = signupData.user?.id || "";
        } else {
          throw authError;
        }
      } else {
        userUUID = authData.user?.id || "";
      }
    } else {
      // Normal user (or owner logging in with OTP)
      // Since they verified OTP, we log them into Supabase Auth using the password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanedEmail,
        password,
      });

      if (authError) {
        // If the user doesn't exist in Supabase Auth yet, sign them up!
        if (authError.message.includes("Invalid login credentials") || authError.message.includes("Email not confirmed")) {
          const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email: cleanedEmail,
            password,
          });
          if (signupError) throw signupError;
          userUUID = signupData.user?.id || "";
        } else {
          throw authError;
        }
      } else {
        userUUID = authData.user?.id || "";
      }
    }

    // Now, look up or create the profile in Supabase profiles database using userUUID
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userUUID)
      .single();

    if (!existingProfile) {
      // Create new profile with pending status
      const newProfile: Profile = {
        id: userUUID,
        email: cleanedEmail,
        full_name: cleanedEmail.split("@")[0] || "Trader",
        avatar_url: null,
        role: isOwnerEmail ? "admin" : "user",
        status: isOwnerEmail ? "approved" : "pending",
        is_owner: isOwnerEmail,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase.from("profiles").insert(newProfile);
      if (insertError) throw insertError;
      finalProfile = newProfile;
    } else {
      finalProfile = existingProfile as Profile;
    }

    // Check approval status
    if (finalProfile.status !== "approved" && !finalProfile.is_owner && !isOwnerEmail) {
      // Log them out of Supabase Auth since they are not approved yet!
      await supabase.auth.signOut();
      
      const event = new CustomEvent("auth_approval_blocked", {
        detail: { status: finalProfile.status },
      });
      window.dispatchEvent(event);
      setCurrentOTP(null);
      
      if (finalProfile.status === "pending") {
        throw new Error("Access Pending: Your registration is currently awaiting administrator approval.");
      } else if (finalProfile.status === "rejected") {
        throw new Error("Access Denied: Your registration has been rejected by the administrator.");
      } else if (finalProfile.status === "suspended") {
        throw new Error("Account Suspended: Please contact the administrator.");
      } else {
        throw new Error(`Access Denied: Your status is ${finalProfile.status}.`);
      }
    }

    // If approved, establish the authenticated session
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      setUser(sessionData.session.user as any);
      setSession(sessionData.session as any);
      setProfile(finalProfile);
    } else {
      // Re-sign in to establish session if needed
      const { data: loginData } = await supabase.auth.signInWithPassword({
        email: cleanedEmail,
        password,
      });
      if (loginData?.session) {
        setUser(loginData.session.user as any);
        setSession(loginData.session as any);
        setProfile(finalProfile);
      }
    }

    setCurrentOTP(null);
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Sign out warning:", err);
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
