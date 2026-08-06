import { createClient } from "@supabase/supabase-js";

const isPlaceholderValue = (value: string) => !value || /placeholder|example/i.test(value);

// Robust environment variable resolver supporting both client-side Vite (VITE_ prefix)
// and Node/Vercel server environments (standard SUPABASE_ prefix)
const getEnv = (key: string): string => {
  // 1. Check client-side Vite import.meta.env
  if (typeof window !== "undefined" && import.meta.env) {
    const val = import.meta.env[key] || import.meta.env[`VITE_${key}`];
    if (val && typeof val === "string") return val;
  }
  
  // 2. Check process.env (injected by Vite or present in Node runtime)
  if (typeof process !== "undefined" && process.env) {
    const val = process.env[key] || process.env[`VITE_${key}`];
    if (val && typeof val === "string") return val;
  }
  
  return "";
};

const supabaseUrl = getEnv("SUPABASE_URL") || getEnv("VITE_SUPABASE_URL");
const supabaseAnonKey = getEnv("SUPABASE_ANON_KEY") || getEnv("VITE_SUPABASE_ANON_KEY");
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
