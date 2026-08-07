import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = import.meta.env['VITE_SUPABASE_URL'] || "";
export const supabaseAnonKey = import.meta.env['VITE_SUPABASE_ANON_KEY'] || "";

// Verify variables exist; if not, use placeholder fallback that triggers explicit library errors on query
const cleanUrl = supabaseUrl.trim() || "https://your-project-id.supabase.co";
const cleanKey = supabaseAnonKey.trim() || "your-anon-key";

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !/placeholder|example|local-storage|your-project-id/i.test(supabaseUrl) && 
  !/placeholder|example|local-storage|your-anon-key/i.test(supabaseAnonKey)
);

// ── UUID Generator ─────────────────────────────────────────────────────────
// Generates standard compliant RFC4122 v4 UUIDs for Supabase PK compatibility
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

// ── Client Export ───────────────────────────────────────────────────────────
// Exposes the real Supabase client as the single source of truth (no mock fallback).
export const supabase = createClient(cleanUrl, cleanKey, {
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: typeof window !== "undefined",
    detectSessionInUrl: typeof window !== "undefined",
  }
});

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

