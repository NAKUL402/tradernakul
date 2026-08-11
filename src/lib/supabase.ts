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

export type UserSettings = {
  user_id: string;
  theme: "dark" | "light" | "system" | "special";
  accent_color: string;
  compact_ui: boolean;
  currency: string;
  default_session: "Asian" | "London" | "New York" | null;
  default_risk_pct: number | null;
  default_rrr: string | null;
  daily_summary: boolean;
  weekly_report: boolean;
  ai_coach_alerts: boolean;
  ai_response_style: "Concise" | "Balanced" | "Detailed";
  trading_style?: string | null;
  preferred_timeframe?: string | null;
  primary_markets?: string[] | null;
  created_at: string;
  updated_at: string;
};


const isDevTestMode = typeof import.meta !== "undefined" && (import.meta as any).env && (import.meta as any).env.DEV && String((import.meta as any).env.VITE_DEV_TEST_MODE).trim() === "true";

// ── Real Supabase Client Instance ───────────────────────────────────────────
const realClient = createClient(
  supabaseUrl || "https://placeholder-not-configured.supabase.co",
  supabaseAnonKey || "placeholder-key-not-configured",
  {
    auth: {
      persistSession: isDevTestMode ? false : typeof window !== "undefined",
      autoRefreshToken: isDevTestMode ? false : typeof window !== "undefined",
      detectSessionInUrl: isDevTestMode ? false : typeof window !== "undefined",
    },
  }
);

// ── Unified Resilient Supabase Wrapper ─────────────────────────────────────
export const supabase = {
  auth: {
    signInWithOtp: async (options: any) => {
      if (isDevTestMode) {
         return { data: {}, error: null };
      }
      if (!isSupabaseConfigured) return { data: null, error: new Error("Supabase is not configured.") };
      return await realClient.auth.signInWithOtp(options);
    },

    verifyOtp: async (options: any) => {
      if (isDevTestMode) {
         return { data: { session: { user: { id: "dev-test-owner-id" } } }, error: null };
      }
      if (!isSupabaseConfigured) return { data: { session: null, user: null }, error: new Error("Supabase is not configured.") };
      return await realClient.auth.verifyOtp(options);
    },

    getUser: async () => {
      if (isDevTestMode) {
         const mockMeta = JSON.parse(localStorage.getItem("mock_user_metadata") || "{}");
         return { data: { user: { id: "dev-test-owner-id", email: "test-owner@local.test", user_metadata: mockMeta } }, error: null };
      }
      if (!isSupabaseConfigured) return { data: { user: null }, error: null };
      return await realClient.auth.getUser();
    },

    updateUser: async (attributes: any) => {
      if (isDevTestMode) {
         if (attributes.data) {
           const existing = JSON.parse(localStorage.getItem("mock_user_metadata") || "{}");
           localStorage.setItem("mock_user_metadata", JSON.stringify({ ...existing, ...attributes.data }));
         }
         return { data: { user: { id: "dev-test-owner-id" } }, error: null };
      }
      if (!isSupabaseConfigured) return { data: { user: null }, error: new Error("Supabase is not configured.") };
      return await realClient.auth.updateUser(attributes);
    },

    signOut: async () => {
      if (isDevTestMode) return { error: null };
      if (!isSupabaseConfigured) return { error: null };
      return await realClient.auth.signOut();
    },

    getSession: async () => {
      if (isDevTestMode) {
         return { data: { session: { user: { id: "dev-test-owner-id", email: "test-owner@local.test" }, access_token: "mock" } }, error: null };
      }
      if (!isSupabaseConfigured) return { data: { session: null }, error: null };
      return await realClient.auth.getSession();
    },

    onAuthStateChange: (callback: any) => {
      if (isDevTestMode) {
         return { data: { subscription: { unsubscribe: () => {} } } };
      }
      if (!isSupabaseConfigured) return { data: { subscription: { unsubscribe: () => {} } } };
      return realClient.auth.onAuthStateChange(callback);
    },

    resend: async (options: { type: any; email?: string; phone?: string; options?: any }) => {
      if (!isSupabaseConfigured) return { data: null, error: new Error("Supabase is not configured.") };
      return await realClient.auth.resend(options);
    },
  },

  storage: isDevTestMode ? {
    from: (bucket: string) => ({
      upload: async (path: string, file: File) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            localStorage.setItem(`mock_storage_${bucket}_${path}`, dataUrl);
            resolve({ data: { path }, error: null });
          };
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });
      },
      getPublicUrl: (path: string) => {
        const dataUrl = localStorage.getItem(`mock_storage_${bucket}_${path}`);
        return { data: { publicUrl: dataUrl || `https://mock-storage.local/${bucket}/${path}` } };
      },
      remove: async (paths: string[]) => {
        paths.forEach(p => localStorage.removeItem(`mock_storage_${bucket}_${p}`));
        return { data: paths, error: null };
      },
      list: async (path: string) => {
        const files = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`mock_storage_${bucket}_${path}`)) {
            const name = key.replace(`mock_storage_${bucket}_${path}/`, '');
            files.push({ name });
          }
        }
        return { data: files, error: null };
      }
    })
  } : realClient.storage,

  from: (tableName: string): any => {
    // DEV_TEST_MODE Database Mock Interceptor
    if (isDevTestMode) {
      
      const seedData = (table: string) => {
        if (table === "site_settings") {
          return [{
             id: 1,
             announcement_banner: "Welcome to Local Dev Mode",
             banner_active: true,
             maintenance_mode: false,
             ai_coach_enabled: true,
             mt5_sync_enabled: true,
             registration_enabled: true,
             login_enabled: true,
             journal_enabled: true,
             market_data_enabled: true,
             updated_at: new Date().toISOString()
          }];
        }
        if (table === "profiles") {
          return [
            { id: "dev-test-owner-id", email: "test-owner@local.test", full_name: "Local Test Owner", role: "admin", status: "approved", is_owner: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            { id: "user-2", email: "pending@local.test", full_name: "Pending User", role: "user", status: "pending", is_owner: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            { id: "user-3", email: "rejected@local.test", full_name: "Rejected User", role: "user", status: "rejected", is_owner: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            { id: "user-4", email: "suspended@local.test", full_name: "Suspended User", role: "user", status: "suspended", is_owner: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
          ];
        }
        if (table === "audit_logs") {
          return [
            { id: "log-1", admin_email: "test-owner@local.test", action: "test", target_type: "system", target_id: "1", previous_state: "{}", new_state: "{}", timestamp: new Date().toISOString(), result: "success" }
          ];
        }
        if (table === "announcements") return [];
        if (table === "feature_deadlines") return [];
        return [];
      };

      const dbStr = localStorage.getItem(`mock_db_${tableName}`);
      let tableData = dbStr ? JSON.parse(dbStr) : seedData(tableName);
      if (!dbStr) localStorage.setItem(`mock_db_${tableName}`, JSON.stringify(tableData));

      const persist = () => {
        localStorage.setItem(`mock_db_${tableName}`, JSON.stringify(tableData));
      };

      // Create a recursive mock query builder that records all chaining operations
      const createChain = (currentData: any[]) => {
        const chain: any = {
           _data: [...currentData],
           select: () => chain,
           eq: (col: string, val: any) => { chain._data = chain._data.filter((r: any) => r[col] === val); return chain; },
           neq: (col: string, val: any) => { chain._data = chain._data.filter((r: any) => r[col] !== val); return chain; },
           gt: (col: string, val: any) => { chain._data = chain._data.filter((r: any) => r[col] > val); return chain; },
           lt: (col: string, val: any) => { chain._data = chain._data.filter((r: any) => r[col] < val); return chain; },
           gte: (col: string, val: any) => { chain._data = chain._data.filter((r: any) => r[col] >= val); return chain; },
           lte: (col: string, val: any) => { chain._data = chain._data.filter((r: any) => r[col] <= val); return chain; },
           order: (col: string, { ascending = true } = {}) => {
              chain._data.sort((a: any, b: any) => ascending ? (a[col] > b[col] ? 1 : -1) : (a[col] < b[col] ? 1 : -1));
              return chain;
           },
           limit: (num: number) => { chain._data = chain._data.slice(0, num); return chain; },
           single: () => {
             if (chain._data.length === 0) return Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'No rows found' } });
             return Promise.resolve({ data: chain._data[0], error: null });
           },
           maybeSingle: () => {
             return Promise.resolve({ data: chain._data.length > 0 ? chain._data[0] : null, error: null });
           },
           then: (resolve: any) => resolve({ data: chain._data, error: null })
        };
        return chain;
      };

      return {
        select: () => createChain(tableData),
        upsert: (record: any) => {
          const index = tableData.findIndex((r: any) => r.id === record.id || (r.user_id && r.user_id === record.user_id));
          if (index !== -1) {
            tableData[index] = { ...tableData[index], ...record };
          } else {
            tableData.push({ id: record.id || Date.now().toString(), ...record });
          }
          persist();
          return Promise.resolve({ data: record, error: null });
        },
        update: (record: any) => {
           const updateChain: any = {
             eq: (col: string, val: any) => {
               tableData = tableData.map((r: any) => (r[col] === val ? { ...r, ...record } : r));
               persist();
               return Promise.resolve({ data: record, error: null });
             },
             in: (col: string, vals: any[]) => {
               tableData = tableData.map((r: any) => (vals.includes(r[col]) ? { ...r, ...record } : r));
               persist();
               return Promise.resolve({ data: record, error: null });
             }
           };
           return updateChain;
        },
        insert: (record: any) => {
          const newRecord = { id: record.id || Date.now().toString(), ...record };
          tableData.push(newRecord);
          persist();
          return {
            select: () => ({
              single: () => Promise.resolve({ data: newRecord, error: null }),
              then: (resolve: any) => resolve({ data: [newRecord], error: null })
            }),
            then: (resolve: any) => resolve({ data: [newRecord], error: null })
          };
        },
        delete: () => {
          const delChain: any = {
            eq: (col: string, val: any) => {
              tableData = tableData.filter((r: any) => r[col] !== val);
              persist();
              return Promise.resolve({ data: null, error: null });
            }
          };
        }
      };
      return mockQueryBuilder;
    }
    return realClient.from(tableName);
  },

  rpc: (fn: string, args?: Record<string, unknown>): any => {
    return realClient.rpc(fn as any, args);
  },
};

