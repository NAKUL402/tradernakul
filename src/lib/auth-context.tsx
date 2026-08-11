import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase, type Profile, type SiteSettings } from "./supabase";
import { toast } from "sonner";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  siteSettings: SiteSettings | null;
  isLoading: boolean;
  isApproved: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  fetchError: string | null;
  signOut: () => Promise<void>;
  refreshSettings: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshSettings() {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("id", 1)
        .single();

      if (!error && data) {
        setSiteSettings(data as SiteSettings);
      }
    } catch (err) {
      console.warn("Failed to fetch site settings:", err);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function loadAuth() {
      try {
        await refreshSettings();
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session && mounted) {
          setSession(session);
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else if (mounted) {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error loading auth session:", err);
        if (mounted) setIsLoading(false);
      }
    }

    loadAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT" || !session) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setFetchError(null);
        setIsLoading(false);
      } else if (session) {
        setSession(session);
        setUser(session.user);
        await fetchProfile(session.user.id);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Force Sign Out if site-wide login is disabled for regular users
  useEffect(() => {
    if (user && siteSettings && !siteSettings.login_enabled) {
      const isUserAdminOrOwner = profile?.role === "admin" || profile?.is_owner === true || user?.email === "nakulrathi641@gmail.com";
      if (!isUserAdminOrOwner) {
        signOut();
        toast.error("Access blocked: Login is temporarily disabled by administrator.");
      }
    }
  }, [user, siteSettings, profile]);

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.warn("Failed to fetch profile:", error);
      } else if (data) {
        setProfile(data as Profile);
        setFetchError(null);
      }
    } catch (err: any) {
      console.error("Exception fetching profile:", err);
      setFetchError(err?.message || "Failed to fetch profile");
    } finally {
      setIsLoading(false);
    }
  }

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      toast.success("Successfully logged out");
    } catch (err) {
      toast.error("Failed to log out");
    } finally {
      setIsLoading(false);
    }
  };

  const isOwner = profile?.is_owner === true || user?.email === "nakulrathi641@gmail.com";
  const isApproved = profile?.status === "approved" || profile?.is_owner === true || user?.email === "nakulrathi641@gmail.com";
  const isAdmin = profile?.role === "admin" || profile?.is_owner === true || user?.email === "nakulrathi641@gmail.com";

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        siteSettings,
        isLoading,
        isApproved,
        isAdmin,
        isOwner,
        fetchError,
        signOut,
        refreshSettings,
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
