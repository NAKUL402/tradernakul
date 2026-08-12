import { createClient } from "@supabase/supabase-js";
import { groupStats } from "./src/lib/trades";

const supabase = createClient(
  "https://cszfyeeykucohwqmgfej.supabase.co",
  "sb_publishable_4fpTV_OIYntxnlj8G-O5xA_f3BW7lIC"
);

async function test() {
  const { data, error } = await supabase.from("trades").select("*");
  if (error) {
    console.error("Supabase Error:", error);
    return;
  }
  
  console.log("Total Trades:", data.length);
  
  const trades = data.map((t: any) => ({
    id: t.id,
    tradeNo: t.trade_no ? parseInt(t.trade_no, 10) : undefined,
    date: t.date,
    pair: t.pair,
    side: t.side,
    session: t.session,
    entryTime: t.entry_time,
    exitTime: t.exit_time,
    entryPrice: parseFloat(t.entry_price || "0"),
    exitPrice: parseFloat(t.exit_price || "0"),
    result: t.result,
    rrr: String(t.rrr || "1.0"),
    riskPct: parseFloat(t.risk_pct || "1"),
    pnl: parseFloat(t.pnl || "0"),
    setup: t.setup,
    confirmation: t.confirmation || "",
    notes: t.notes || "",
    screenshot: t.screenshot_url || "chart-1",
    tags: t.tags || [],
    lots: t.lots || "",
    mistakes: t.mistakes || "",
    rating: t.rating ? parseInt(t.rating, 10) : undefined,
    reason: t.reason || "",
  }));

  for (const t of trades) {
    try {
      (t.tags || []).map((tag: any) => tag);
    } catch (e: any) {
      console.error(`Crash on tags for trade ${t.id}:`, e.message);
    }

    try {
      if (t.mistakes) {
        t.mistakes.split(",");
      }
    } catch (e: any) {
      console.error(`Crash on mistakes for trade ${t.id}:`, e.message, 'mistakes=', t.mistakes);
    }
  }

  // test aggregateTradePatterns manually
  try {
    const list = trades;
    const wins = list.filter((t) => t.result === "Win");
    const setups = groupStats(list, (t) => t.setup || "Unknown").filter((g) => g.name !== "Unknown");
    const pairs = groupStats(list, (t) => t.pair || "Unknown").filter((g) => g.name !== "Unknown");
    const sessions = groupStats(list, (t) => t.session || "Unknown").filter((g) => g.name !== "Unknown");
    
    const mistakesMap = new Map<string, { count: number; pnl: number }>();
    list.forEach((t) => {
      if (t.mistakes) {
        const parts = t.mistakes.split(",").map((s: string) => s.trim().toLowerCase()).filter(Boolean);
        parts.forEach((m: string) => {
          const cur = mistakesMap.get(m) ?? { count: 0, pnl: 0 };
          cur.count += 1;
          cur.pnl += t.pnl;
          mistakesMap.set(m, cur);
        });
      }
    });
    console.log("aggregateTradePatterns safe");
  } catch (e: any) {
    console.error("aggregateTradePatterns CRASH:", e);
  }
}

test();
