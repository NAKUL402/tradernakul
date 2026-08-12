import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUpsert() {
  console.log("Testing upsert without id...");

  const dummyUser = "8be2c575-b6d8-4f89-9477-85cd55447720";
  
  const testRow = {
    user_id: dummyUser,
    trade_no: 9999,
    date: "2026-08-12",
    pair: "XAUUSD",
    side: "Buy",
    session: "London",
    entry_time: "12:00",
    exit_time: "13:00",
    entry_price: 1800,
    exit_price: 1810,
    result: "Win",
    rrr: "2.0",
    risk_pct: 1,
    pnl: 100,
    setup: "Liquidity Sweep",
    confirmation: "EMA crossover",
    notes: "Test notes",
    screenshot_url: "chart-1",
    tags: ["test"],
    lots: "0.1",
    mistakes: "None",
    rating: 5,
    reason: "Plan followed"
  };

  const { data, error } = await (supabase.from("trades").upsert(testRow) as any).select();
  if (error) {
    console.error("Failed to upsert trade:", error);
  } else {
    console.log("Successfully upserted trade! Row:", data);
    if (data && data[0]) {
      await supabase.from("trades").delete().eq("id", data[0].id);
    }
  }
}

testUpsert();
