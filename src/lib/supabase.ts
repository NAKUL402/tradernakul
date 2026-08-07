import { createClient } from "@supabase/supabase-js";

// ── Environment Variable Reading ────────────────────────────────────────────
// VITE_ prefix required for Vite to embed these into the client-side bundle.
// They MUST be set in Vercel → Project Settings → Environment Variables.
export const supabaseUrl = (import.meta.env['VITE_SUPABASE_URL'] as string | undefined) || "";
export const supabaseAnonKey = (import.meta.env['VITE_SUPABASE_ANON_KEY'] as string | undefined) || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith("https://") &&
  supabaseUrl.includes(".supabase.co") &&
  supabaseAnonKey.length > 20
);

if (!isSupabaseConfigured && typeof window !== "undefined") {
  console.error(
    "[TraderNakul] ❌ Supabase is NOT configured.\n" +
    "  VITE_SUPABASE_URL:", supabaseUrl || "(empty)",
    "\n  VITE_SUPABASE_ANON_KEY:", supabaseAnonKey ? `(set, ${supabaseAnonKey.length} chars)` : "(empty)",
    "\n\n  Fix: Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Vercel Environment Variables, then Redeploy."
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

// ── Supabase Client ─────────────────────────────────────────────────────────
// Uses real credentials when configured; falls back to a no-op placeholder URL
// that triggers clear Supabase API errors rather than silent crashes.
const effectiveUrl = isSupabaseConfigured
  ? supabaseUrl
  : "https://placeholder-not-configured.supabase.co";

const effectiveKey = isSupabaseConfigured
  ? supabaseAnonKey
  : "placeholder-key-not-configured";

export const supabase = createClient(effectiveUrl, effectiveKey, {
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: typeof window !== "undefined",
    detectSessionInUrl: typeof window !== "undefined",
  },
});

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
