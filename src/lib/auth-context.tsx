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

  // Define owner emails
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
        
        // If they are not approved and not owner, auto-signout to prevent dashboard access
        if (fetchedProfile.status !== "approved" && !fetchedProfile.is_owner && !isOwnerEmail) {
          localStorage.removeItem("tradernakul_session");
          setUser(null);
          setSession(null);
          setProfile(null);
          // Broadcast custom event for login screen to capture the rejection reason
          const event = new CustomEvent("auth_approval_blocked", { 
            detail: { status: fetchedProfile.status } 
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
    // Generate a secure 6-digit OTP code
    const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
    setCurrentOTP(generatedOTP);

    try {
      // Attempt to email OTP code via Vercel serverless function
      const result = await sendOTPEmail({ email: email.toLowerCase().trim(), otp: generatedOTP });
      
      if (!result.success) {
        if (result.mode === "debug" || result.mode === "missing_config") {
          // SMTP not configured. Reveal OTP for easy testing
          toast.info(`[Debug mode] Verification code is: ${generatedOTP}`, { duration: 10000 });
          console.log(`[Debug mode] OTP Code: ${generatedOTP}`);
        } else {
          toast.error(`Email delivery error: ${result.error || result.message || "Unknown error"}. Code is: ${generatedOTP}`);
        }
      } else {
        toast.success("Verification code sent to your email!");
      }
    } catch (err) {
      console.warn("SMTP fetch warning, exposing fallback code:", err);
      toast.info(`[Fallback mode] Verification code is: ${generatedOTP}`, { duration: 10000 });
    }
  };

  const verifyOTP = async (email: string, token: string) => {
    if (!currentOTP || token.trim() !== currentOTP) {
      throw new Error("Invalid verification code. Please check your spelling.");
    }

    const cleanedEmail = email.toLowerCase().trim();
    const isOwnerEmail = checkUserOwnerEmail(cleanedEmail);

    // Fetch and check profiles list in local database simulator
    const { data: profiles } = await supabase.from("profiles").select("*");
    let profile = (profiles || []).find((p: Profile) => p.email.toLowerCase() === cleanedEmail);

    if (!profile) {
      // Automatically register profile record if first time logging in
      const newProfile: Profile = {
        id: `user-${Math.random().toString(36).substr(2, 9)}`,
        email: cleanedEmail,
        full_name: cleanedEmail.split("@")[0] || "Trader",
        avatar_url: null,
        role: isOwnerEmail ? "admin" : "user",
        status: isOwnerEmail ? "approved" : "pending",
        is_owner: isOwnerEmail,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await supabase.from("profiles").insert(newProfile);
      profile = newProfile;
    }

    // Gatekeeper verification
    if (profile.status !== "approved" && !profile.is_owner && !isOwnerEmail) {
      const event = new CustomEvent("auth_approval_blocked", { 
        detail: { status: profile.status } 
      });
      window.dispatchEvent(event);
      return;
    }

    // Setup session
    const mockUser = {
      id: profile.id,
      email: profile.email,
      user_metadata: { full_name: profile.full_name }
    };

    const mockSession = {
      access_token: "mock-session-jwt",
      user: mockUser
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("tradernakul_session", JSON.stringify(mockSession));
    }

    setUser(mockUser as any);
    setSession(mockSession as any);
    setProfile(profile);
  };

  const signOut = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("tradernakul_session");
    }
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
