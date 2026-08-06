import { createClient } from "@supabase/supabase-js";

const isPlaceholderValue = (value: string) => !value || /placeholder|example/i.test(value);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const isBrowser = typeof window !== "undefined";

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && !isPlaceholderValue(supabaseUrl) && !isPlaceholderValue(supabaseAnonKey),
);

// Fallback to empty strings instead of placeholder strings if not configured
const clientUrl = isSupabaseConfigured ? supabaseUrl : "";
const clientKey = isSupabaseConfigured ? supabaseAnonKey : "";

export const supabase = createClient(clientUrl || "https://placeholder.supabase.co", clientKey || "placeholder", {
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
