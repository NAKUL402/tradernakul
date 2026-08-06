import { createClient } from "@supabase/supabase-js";

const isPlaceholderValue = (value: string) => !value || /placeholder|example/i.test(value);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
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

export function createDemoProfile(email: string, fullName?: string, role: Profile["role"] = "user", isOwner = false): Profile {
  const normalizedEmail = email.trim().toLowerCase();
  const displayName = fullName?.trim() || normalizedEmail.split("@")[0] || "Demo Trader";
  const now = new Date().toISOString();

  return {
    id: `demo-${normalizedEmail.replace(/[^a-z0-9]/gi, "-")}`,
    email: normalizedEmail,
    full_name: displayName,
    avatar_url: null,
    role,
    status: isOwner ? "approved" : "pending",
    is_owner: isOwner,
    created_at: now,
    updated_at: now,
  };
}

export function getDemoTradesKey() {
  return "tradernakul-demo-trades";
}

export function readDemoTrades(): unknown[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(getDemoTradesKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeDemoTrades(trades: unknown[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(getDemoTradesKey(), JSON.stringify(trades));
  } catch {
    // Ignore storage issues in demo mode.
  }
}
