import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";

const isPlaceholderValue = (value: string) => !value || /placeholder|example/i.test(value);

// Direct, guard-free assignments to ensure Vite's macro replacement engine 
// directly replaces these strings with actual values at build-time.
export const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "";

export const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";

const isBrowser = typeof window !== "undefined";

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && !isPlaceholderValue(supabaseUrl) && !isPlaceholderValue(supabaseAnonKey),
);

// Server Function to safely query Vercel serverless runtime environment
export const getServerEnvDiagnostics = createServerFn("GET", async () => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
  return {
    serverUrlLength: url.length,
    serverKeyLength: key.length,
    serverUrlStart: url.slice(0, 15),
  };
});

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
