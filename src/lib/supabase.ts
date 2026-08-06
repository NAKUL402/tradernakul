import { createClient } from "@supabase/supabase-js";

const isPlaceholderValue = (value: string) => !value || /placeholder|example/i.test(value);

// Direct literal evaluation to ensure Vite static string replacements 
// (e.g. process.env.SUPABASE_URL) match and compile correctly at build time.
const getSupabaseUrl = (): string => {
  try {
    if (typeof import.meta.env !== "undefined") {
      const val = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
      if (val && typeof val === "string") return val;
    }
  } catch {}
  
  try {
    if (typeof process !== "undefined" && process.env) {
      const val = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      if (val && typeof val === "string") return val;
    }
  } catch {}
  
  return "";
};

const getSupabaseAnonKey = (): string => {
  try {
    if (typeof import.meta.env !== "undefined") {
      const val = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;
      if (val && typeof val === "string") return val;
    }
  } catch {}
  
  try {
    if (typeof process !== "undefined" && process.env) {
      const val = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
      if (val && typeof val === "string") return val;
    }
  } catch {}
  
  return "";
};

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();
const isBrowser = typeof window !== "undefined";

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && !isPlaceholderValue(supabaseUrl) && !isPlaceholderValue(supabaseAnonKey),
);

const clientUrl = isSupabaseConfigured ? supabaseUrl : "https://placeholder.supabase.co";
const clientKey = isSupabaseConfigured ? supabaseAnonKey : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.placeholder";

export const supabase = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: isBrowser,
    autoRefreshToken: isBrowser,
    detectSessionInUrl: isBrowser,
    ...(isBrowser ? {} : { storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } }),
  },
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
