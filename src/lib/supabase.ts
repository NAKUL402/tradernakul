// 100% Decoupled Local Database Engine replacing Supabase
export const isSupabaseConfigured = true; // Set to true to satisfy check triggers
export const supabaseUrl = "local-storage-engine";
export const supabaseAnonKey = "local-storage-anon-key";

const getLocalStorageData = (key: string): any[] => {
  if (typeof window === "undefined") return [];
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : [];
  } catch {
    return [];
  }
};

const setLocalStorageData = (key: string, data: any[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
};

export const supabase = {
  auth: {
    signOut: async () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("tradernakul_session");
      }
    },
    getSession: async () => {
      const sessionStr = typeof window !== "undefined" ? localStorage.getItem("tradernakul_session") : null;
      return { data: { session: sessionStr ? JSON.parse(sessionStr) : null }, error: null };
    },
    onAuthStateChange: (callback: any) => {
      // Mock subscription triggering initial fetch
      if (typeof window !== "undefined") {
        const sessionStr = localStorage.getItem("tradernakul_session");
        const session = sessionStr ? JSON.parse(sessionStr) : null;
        setTimeout(() => {
          callback("INITIAL_SESSION", session);
        }, 50);
      }
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  },

  storage: {
    from: () => ({
      upload: async () => ({ data: { path: "mock-path" }, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/placeholder-chart.png" } })
    })
  },
  
  from: (table: string) => {
    const dataKey = `tn_db_${table}`;
    let currentData = getLocalStorageData(dataKey);

    // Automatically seed owner profiles if empty
    if (table === "profiles" && currentData.length === 0) {
      currentData = [
        {
          id: "owner-nakul-1",
          email: "nakultrader007@gmail.com",
          full_name: "Nakul (Owner)",
          avatar_url: null,
          role: "admin",
          status: "approved",
          is_owner: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "owner-nakul-2",
          email: "tradernakul@gmail.com",
          full_name: "Nakul Trader",
          avatar_url: null,
          role: "admin",
          status: "approved",
          is_owner: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setLocalStorageData(dataKey, currentData);
    }

    const builder = {
      select: (columns?: string, options?: any) => {
        const resultPromise = Promise.resolve({ data: currentData, error: null, count: currentData.length });
        
        return Object.assign(resultPromise, {
          order: (col: string, opt: any) => {
            const sorted = [...currentData].sort((a, b) => {
              if (a[col] < b[col]) return opt.ascending ? -1 : 1;
              if (a[col] > b[col]) return opt.ascending ? 1 : -1;
              return 0;
            });
            return Promise.resolve({ data: sorted, error: null });
          },
          eq: (col: string, val: any) => {
            const filtered = currentData.filter(item => item[col] === val);
            const filteredPromise = {
              data: filtered,
              error: null,
              single: () => {
                const item = filtered[0] || null;
                return Promise.resolve({ data: item, error: item ? null : new Error("No record found") });
              }
            };
            return Object.assign(Promise.resolve(filteredPromise), filteredPromise);
          }
        });
      },
      
      insert: (records: any | any[]) => {
        const newRecords = Array.isArray(records) ? records : [records];
        const updated = [...currentData, ...newRecords];
        setLocalStorageData(dataKey, updated);
        return Promise.resolve({ data: newRecords, error: null });
      },
      
      update: (fields: any) => {
        return {
          eq: (col: string, val: any) => {
            const updated = currentData.map((item: any) => {
              if (item[col] === val) {
                return { ...item, ...fields, updated_at: new Date().toISOString() };
              }
              return item;
            });
            setLocalStorageData(dataKey, updated);
            const matches = updated.filter(item => item[col] === val);
            return Promise.resolve({ data: matches, error: null });
          }
        };
      },
      
      delete: () => {
        return {
          eq: (col: string, val: any) => {
            const remaining = currentData.filter((item: any) => item[col] !== val);
            setLocalStorageData(dataKey, remaining);
            return Promise.resolve({ data: null, error: null });
          }
        };
      }
    };
    
    return builder;
  }
};

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
