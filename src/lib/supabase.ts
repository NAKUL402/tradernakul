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

const getEnvVar = (key: string): string => {
  if (typeof window !== "undefined" && (window as any).__TRADERNAKUL_ENV__) {
    if ((window as any).__TRADERNAKUL_ENV__[key]) {
      return (window as any).__TRADERNAKUL_ENV__[key];
    }
  }
  
  if (typeof process !== "undefined" && process.env) {
    if (process.env[key]) return process.env[key] as string;
    if (key === "VITE_SUPABASE_ANON_KEY" && process.env.VITE_SUPABASE_ANOM_KEY) {
      return process.env.VITE_SUPABASE_ANOM_KEY as string;
    }
  }
  
  if (typeof import.meta !== "undefined" && (import.meta as any).env) {
    if ((import.meta as any).env[key]) return (import.meta as any).env[key];
    if (key === "VITE_SUPABASE_ANON_KEY" && (import.meta as any).env.VITE_SUPABASE_ANOM_KEY) {
      return (import.meta as any).env.VITE_SUPABASE_ANOM_KEY;
    }
  }
  
  return "";
};

const rawUrl = getEnvVar("VITE_SUPABASE_URL");
const rawKey = getEnvVar("VITE_SUPABASE_ANON_KEY");

export const supabaseUrl = rawUrl.trim();
export const supabaseAnonKey = rawKey.trim();

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
    isSupabaseConfigured ? "✅ Live Supabase Cloud Connected" : "⚡ Unified Resilient Auth Active"
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

export type SiteSettings = {
  id: number;
  announcement_banner: string | null;
  banner_active: boolean;
  maintenance_mode: boolean;
  ai_coach_enabled: boolean;
  mt5_sync_enabled: boolean;
  registration_enabled: boolean;
  login_enabled: boolean;
  journal_enabled: boolean;
  market_data_enabled: boolean;
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
    signInWithOtp: async (options: { email: string; options?: any }) => {
      if (!isSupabaseConfigured) {
        return { data: { user: null, session: null }, error: new Error("Supabase is not configured.") };
      }
      return await realClient.auth.signInWithOtp(options);
    },

    verifyOtp: async (options: { email: string; token: string; type: any }) => {
      if (!isSupabaseConfigured) {
        return { data: { user: null, session: null }, error: new Error("Supabase is not configured.") };
      }
      return await realClient.auth.verifyOtp(options);
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

    resend: async (options: { type: any; email?: string; phone?: string; options?: any }) => {
      if (!isSupabaseConfigured) return { data: null, error: new Error("Supabase is not configured.") };
      return await realClient.auth.resend(options);
    },
  },

  storage: realClient.storage,

  from: (tableName: string): any => {
    return realClient.from(tableName);
  },

  rpc: (fn: string, args?: Record<string, unknown>): any => {
    return realClient.rpc(fn as any, args);
  },
};
