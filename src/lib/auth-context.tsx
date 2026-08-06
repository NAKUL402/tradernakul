import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { createDemoProfile, isSupabaseConfigured, supabase, type Profile } from "./supabase";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isApproved: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Define owner emails
  const ownerEmails = [
    "nakultrader007@gmail.com",
    "tradernakul@gmail.com",
  ];

  const checkUserOwnerEmail = (u: User | null) => {
    return u?.email ? ownerEmails.includes(u.email.toLowerCase()) : false;
  };

  const isUserOwnerEmail = checkUserOwnerEmail(user);
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
        const isOwnerEmail = checkUserOwnerEmail(currentUser);
        
        // If they are not approved and not owner, auto-signout to prevent dashboard access
        if (fetchedProfile.status !== "approved" && !fetchedProfile.is_owner && !isOwnerEmail) {
          await supabase.auth.signOut();
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

      const isLoggedOut = localStorage.getItem("tradernakul_logged_out") === "true";

      if (!isSupabaseConfigured) {
        if (isLoggedOut) {
          setIsLoading(false);
          return;
        }
        const demoUser = createDemoProfile(
          "nakultrader007@gmail.com",
          "Nakul (Owner)",
          "admin",
          true,
        );
        if (isMounted) {
          setUser({ id: demoUser.id, email: demoUser.email, user_metadata: { full_name: demoUser.full_name } } as User);
          setSession({ access_token: "demo-session", user: { id: demoUser.id, email: demoUser.email } } as Session);
          setProfile(demoUser);
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (!error && data?.session) {
          const sessionUser = data.session.user;
          const prof = await fetchProfile(sessionUser.id, sessionUser);
          if (prof) {
            setSession(data.session);
            setUser(sessionUser);
          }
        }
      } catch (err) {
        console.warn("Supabase auth session fetch warning:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initAuth();

    let subscription: { unsubscribe: () => void } | null = null;
    if (typeof window !== "undefined" && isSupabaseConfigured) {
      try {
        const res = supabase.auth.onAuthStateChange(async (_event, newSession) => {
          if (!isMounted) return;
          if (newSession?.user) {
            const prof = await fetchProfile(newSession.user.id, newSession.user);
            if (prof) {
              setSession(newSession);
              setUser(newSession.user);
            } else {
              setSession(null);
              setUser(null);
              setProfile(null);
            }
          } else {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
          setIsLoading(false);
        });
        subscription = res.data.subscription;
      } catch (err) {
        console.warn("Auth state change subscription warning:", err);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("tradernakul_logged_out");
    }

    if (!isSupabaseConfigured) {
      const normalizedEmail = email.trim().toLowerCase();
      const isOwnerEmail = ownerEmails.includes(normalizedEmail);
      
      // Allow testing signin locally for owners with any password, or any test users
      const demoUser = createDemoProfile(
        normalizedEmail,
        isOwnerEmail ? "Nakul (Owner)" : "Trader User",
        isOwnerEmail ? "admin" : "user",
        isOwnerEmail,
      );

      // Set access approval simulation
      if (normalizedEmail.includes("pending")) {
        demoUser.status = "pending";
      } else if (normalizedEmail.includes("reject")) {
        demoUser.status = "rejected";
      } else if (normalizedEmail.includes("suspend")) {
        demoUser.status = "suspended";
      } else {
        demoUser.status = "approved";
      }

      if (demoUser.status !== "approved" && !demoUser.is_owner) {
        // Trigger approval block custom event
        setTimeout(() => {
          const event = new CustomEvent("auth_approval_blocked", { 
            detail: { status: demoUser.status } 
          });
          window.dispatchEvent(event);
        }, 100);
        throw new Error(`Access blocked: status is ${demoUser.status.toUpperCase()}`);
      }

      setUser({ id: demoUser.id, email: demoUser.email, user_metadata: { full_name: demoUser.full_name } } as User);
      setSession({ access_token: "demo-session", user: { id: demoUser.id, email: demoUser.email } } as Session);
      setProfile(demoUser);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      setUser(data.user);
      setSession(data.session);
      await fetchProfile(data.user.id, data.user);
    }
  };

  const signOut = async () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("tradernakul_logged_out", "true");
    }
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn("SignOut notice:", err);
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
        signIn,
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
