import { createClient } from "@supabase/supabase-js";

// ── Environment Variable Reading ────────────────────────────────────────────
// CRITICAL: Vite's static replacement engine ONLY replaces dot notation:
// import.meta.env.VITE_SUPABASE_URL
// Bracket notation (import.meta.env['VITE_SUPABASE_URL']) is NOT replaced at build time.
type ViteEnv = {
  VITE_SUPABASE_URL: string | undefined;
  VITE_SUPABASE_ANON_KEY: string | undefined;
  [key: string]: string | undefined;
};

const env = import.meta.env as unknown as ViteEnv;
export const supabaseUrl = env.VITE_SUPABASE_URL || "";
export const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith("https://") &&
  supabaseUrl.includes(".supabase.co") &&
  supabaseAnonKey.length > 20
);

// Diagnostic runtime log
if (typeof window !== "undefined") {
  console.log(
    "[TraderNakul Auth Engine]",
    isSupabaseConfigured ? "✅ Live Supabase Cloud Connected:" : "⚡ Unified Resilient Auth Active:",
    supabaseUrl ? supabaseUrl.substring(0, 35) + "..." : "(No external DB URL)"
  );
}

// ── UUID Generator ─────────────────────────────────────────────────────────
export function generateUUID() {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ── Profile Type ────────────────────────────────────────────────────────────
export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "admin" | "user";
  status: "pending" | "approved" | "rejected" | "suspended";
  is_owner: boolean;
  subscription_plan?: "free" | "pro" | "enterprise";
  subscription_status?: "active" | "past_due" | "canceled" | "trialing";
  created_at: string;
  updated_at: string;
};


// ── Real Supabase Client Instance ───────────────────────────────────────────
const realClient = createClient(
  supabaseUrl || "https://placeholder-not-configured.supabase.co",
  supabaseAnonKey || "placeholder-key-not-configured",
  {
    auth: {
      persistSession: typeof window !== "undefined",
      autoRefreshToken: typeof window !== "undefined",
      detectSessionInUrl: typeof window !== "undefined",
    },
  }
);

// ── Unified Resilient Supabase Wrapper ─────────────────────────────────────
export const supabase = {
  auth: {
    signUp: async (options: { email: string; password: string; options?: any }) => {
      if (!isSupabaseConfigured) {
        return { data: { user: null, session: null }, error: new Error("Supabase is not configured.") };
      }
      return await realClient.auth.signUp(options);
    },

    signInWithPassword: async (options: { email: string; password: string }) => {
      if (!isSupabaseConfigured) {
        return { data: { user: null, session: null }, error: new Error("Supabase is not configured.") };
      }
      return await realClient.auth.signInWithPassword(options);
    },

    signInWithOAuth: async (options: { provider: 'google' | string, options?: any }) => {
      if (!isSupabaseConfigured) {
        return { data: { provider: options.provider, url: null }, error: new Error("Supabase is not configured. Cannot login with Google.") };
      }
      return await realClient.auth.signInWithOAuth({ provider: options.provider as any, options: options.options });
    },

    signOut: async () => {
      if (!isSupabaseConfigured) return { error: null };
      return await realClient.auth.signOut();
    },

    getSession: async () => {
      if (!isSupabaseConfigured) return { data: { session: null }, error: null };
      return await realClient.auth.getSession();
    },

    onAuthStateChange: (callback: any) => {
      if (!isSupabaseConfigured) return { data: { subscription: { unsubscribe: () => {} } } };
      return realClient.auth.onAuthStateChange(callback);
    },
  },

  storage: realClient.storage,

  from: (tableName: string): any => {
    return realClient.from(tableName);
  },
};
