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
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      if (typeof window === "undefined") {
        setIsLoading(false);
        return;
      }

      if (!isSupabaseConfigured) {
        const demoUser = createDemoProfile(
          import.meta.env.VITE_OWNER_EMAIL || "demo@tradernakul.app",
          "Demo Owner",
          "user",
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
          setSession(data.session);
          setUser(data.session.user);
          await fetchProfile(data.session.user.id);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.warn("Supabase auth session fetch warning:", err);
        if (isMounted) setIsLoading(false);
      }
    }

    initAuth();

    let subscription: { unsubscribe: () => void } | null = null;
    if (typeof window !== "undefined" && isSupabaseConfigured) {
      try {
        const res = supabase.auth.onAuthStateChange((_event, session) => {
          if (!isMounted) return;
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            fetchProfile(session.user.id);
          } else {
            setProfile(null);
            setIsLoading(false);
          }
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

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setProfile(data as Profile);
      }
    } catch (err) {
      console.warn("Notice: User profile fetch caught:", err);
    } finally {
      setIsLoading(false);
    }
  }

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      const demoUser = createDemoProfile(
        import.meta.env.VITE_OWNER_EMAIL || "demo@tradernakul.app",
        "Demo Owner",
        "user",
        true,
      );
      setUser({ id: demoUser.id, email: demoUser.email, user_metadata: { full_name: demoUser.full_name } } as User);
      setSession({ access_token: "demo-session", user: { id: demoUser.id, email: demoUser.email } } as Session);
      setProfile(demoUser);
      setIsLoading(false);
      return;
    }

    const siteUrl = import.meta.env.VITE_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "https://tradernakul.vercel.app");
    const redirectTo = `${siteUrl.replace(/\/$/, "")}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      console.error("Google OAuth error:", error.message);
      throw error;
    }
  };

  const signOut = async () => {
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
  };

  const ownerEmails = [
    "nakultrader007@gmail.com",
    "tradernakul@gmail.com",
    (import.meta.env.VITE_OWNER_EMAIL || "").toLowerCase(),
  ].filter(Boolean);

  const isUserOwnerEmail = user?.email ? ownerEmails.includes(user.email.toLowerCase()) : false;

  const isApproved = profile?.status === "approved" || profile?.is_owner === true || isUserOwnerEmail;
  const isAdmin = profile?.role === "admin" || profile?.is_owner === true || isUserOwnerEmail;
  const isOwner = profile?.is_owner === true || isUserOwnerEmail;

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
        signInWithGoogle,
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
