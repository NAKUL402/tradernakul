import { createClient } from "@supabase/supabase-js";

// ── Environment Variable Reading ────────────────────────────────────────────
// CRITICAL: Vite's static replacement only works with DOT notation.
// import.meta.env['VITE_KEY'] (bracket notation) is NOT replaced at build time.
// We must use import.meta.env.VITE_KEY (dot notation).
// To satisfy TypeScript's noPropertyAccessFromIndexSignature, we cast the whole
// import.meta.env object to a typed interface first, then use dot notation.
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

if (typeof window !== "undefined") {
  if (isSupabaseConfigured) {
    console.log("[TraderNakul] ✅ Supabase connected:", supabaseUrl.substring(0, 40) + "...");
  } else {
    console.error(
      "[TraderNakul] ❌ Supabase NOT configured.\n",
      "  VITE_SUPABASE_URL:", supabaseUrl ? `"${supabaseUrl}"` : "(empty — not embedded by Vite build)",
      "\n  VITE_SUPABASE_ANON_KEY:", supabaseAnonKey ? `(set, ${supabaseAnonKey.length} chars)` : "(empty — not embedded by Vite build)",
      "\n\n  Cause: VITE_ variables must use DOT notation in source code (import.meta.env.VITE_KEY)",
      "\n  and must be set in Vercel Environment Variables before the build runs."
    );
  }
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

// ── Supabase Client ─────────────────────────────────────────────────────────
export const supabase = createClient(
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
