import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase, type Profile, type SiteSettings, type UserSettings } from "./supabase";
import { toast } from "sonner";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  siteSettings: SiteSettings | null;
  userSettings: UserSettings | null;
  isLoading: boolean;
  isApproved: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  fetchError: string | null;
  signOut: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  updateUserSettings: (newSettings: Partial<UserSettings>) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
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
          await fetchUserSettings(session.user.id);
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
        await fetchUserSettings(session.user.id);
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

  async function fetchUserSettings(userId: string) {
    const defaultSettings: UserSettings = {
      user_id: userId,
      theme: "system",
      accent_color: "oklch(0.64 0.21 268)",
      compact_ui: false,
      currency: "USD ($)",
      default_session: null,
      default_risk_pct: null,
      default_rrr: null,
      daily_summary: true,
      weekly_report: true,
      ai_coach_alerts: false,
      ai_response_style: "Balanced",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.warn("Failed to fetch user settings from metadata:", error);
        setUserSettings(defaultSettings);
        return;
      }
      
      const meta = data?.user?.user_metadata?.settings;
      if (meta) {
        setUserSettings({ ...defaultSettings, ...meta, user_id: userId });
      } else {
        setUserSettings(defaultSettings);
      }
    } catch (err) {
      console.error("Exception fetching user settings:", err);
      setUserSettings(defaultSettings);
    }
  }

  async function updateUserSettings(newSettings: Partial<UserSettings>) {
    if (!user) return false;
    const updated = { ...userSettings, ...newSettings } as UserSettings;
    setUserSettings(updated); // Optimistic
    try {
      const { error } = await supabase.auth.updateUser({
        data: { settings: updated }
      });
      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error("Error updating settings in metadata:", {
        message: err?.message || err,
        code: err?.code
      });
      toast.error(`Failed to save settings: ${err?.message || "Unknown error"}`);
      // Revert optimistic if needed
      await fetchUserSettings(user.id);
      return false;
    }
  }

  // Apply theme and accent color globally whenever userSettings change
  useEffect(() => {
    if (userSettings) {
      const isDark = userSettings.theme === "dark" || (userSettings.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", isDark);
      
      document.documentElement.style.setProperty("--primary", userSettings.accent_color);
      document.documentElement.style.setProperty("--ring", userSettings.accent_color);
      
      if (userSettings.compact_ui) {
        document.documentElement.setAttribute("data-compact", "true");
      } else {
        document.documentElement.removeAttribute("data-compact");
      }
    } else {
      // Default to dark if not logged in
      document.documentElement.classList.toggle("dark", true);
      document.documentElement.style.setProperty("--primary", "oklch(0.64 0.21 268)");
      document.documentElement.style.setProperty("--ring", "oklch(0.64 0.21 268)");
    }
  }, [userSettings]);

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
        userSettings,
        isLoading,
        isApproved,
        isAdmin,
        isOwner,
        fetchError,
        signOut,
        refreshSettings,
        updateUserSettings,
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
