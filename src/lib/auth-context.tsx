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
  fetchError: string | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadAuth() {
      try {
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

  const isApproved = profile?.status === "approved" || profile?.is_owner === true;
  const isAdmin = profile?.role === "admin" || profile?.is_owner === true;
  const isOwner = profile?.is_owner === true;

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
        fetchError,
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
