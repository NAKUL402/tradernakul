import { supabase, isSupabaseConfigured } from "./supabase";

export type Trade = {
  id: string;
  tradeNo?: number | undefined;
  date: string; // ISO yyyy-mm-dd
  pair: string;
  side: "Buy" | "Sell";
  session: "Asian" | "London" | "New York";
  entryTime: string;
  exitTime: string;
  entryPrice: number;
  exitPrice: number;
  result: "Win" | "Loss";
  rrr: string; // Free text input now
  riskPct: number;
  pnl: number;
  setup: string;
  confirmation: string;
  notes: string;
  screenshot: string;
  tags: string[];
  lots?: string | undefined; // Lot size
  mistakes?: string | undefined; // Mistakes section
  rating?: number | undefined; // 1-5 Star rating
  reason?: string | undefined; // Reason for taking trade
};

export const PAIRS = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "BTCUSD", "NAS100"];
export const SETUPS = [
  "Order Block",
  "FVG Retest",
  "Liquidity Sweep",
  "Break & Retest",
  "Trend Continuation",
];
export const SESSIONS = ["Asian", "London", "New York"] as const;

export const money = (n: number, currency = "$") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
    .format(n)
    .replace("USD", "")
    .trim();

export const pct = (n: number) => `${n.toFixed(1)}%`;

const ACCOUNT = 10000;
export const pnlUsd = (t: Trade) => Math.round(t.pnl || 0);

export function streaks(list: Trade[]) {
  let win = 0,
    loss = 0;
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i]!.result === "Win" && loss === 0) win++;
    else break;
  }
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i]!.result === "Loss" && win === 0) loss++;
    else break;
  }
  return { win, loss };
}

export function groupStats(list: Trade[], key: (t: Trade) => string) {
  const map = new Map<string, { name: string; trades: number; wins: number; pnl: number }>();
  for (const t of list) {
    const k = key(t);
    const cur = map.get(k) ?? { name: k, trades: 0, wins: 0, pnl: 0 };
    cur.trades++;
    if (t.result === "Win") cur.wins++;
    cur.pnl += pnlUsd(t);
    map.set(k, cur);
  }
  return [...map.values()].map((g) => ({ ...g, winRate: (g.wins / g.trades) * 100 }));
}

export function stats(list: Trade[] = []) {
  if (!list || list.length === 0) {
    return {
      total: 0,
      winRate: 0,
      avgRRR: 0,
      profitFactor: 0,
      winStreak: 0,
      lossStreak: 0,
      bestPair: { name: "N/A", trades: 0, wins: 0, pnl: 0, winRate: 0 },
      worstPair: { name: "N/A", trades: 0, wins: 0, pnl: 0, winRate: 0 },
      net: 0,
      monthlyPnl: 0,
      weeklyPnl: 0,
      avgWin: 0,
      avgLoss: 0,
      wins: 0,
      losses: 0,
    };
  }
  const wins = list.filter((t) => t.result === "Win");
  const losses = list.filter((t) => t.result === "Loss");
  const gross = wins.reduce((s, t) => s + pnlUsd(t), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + pnlUsd(t), 0));
  const byPair = groupStats(list, (t) => t.pair).sort((a, b) => b.pnl - a.pnl);
  const s = streaks(list);
  const net = gross - grossLoss;
  const month = new Date().toISOString().slice(0, 7);
  return {
    total: list.length,
    winRate: (wins.length / list.length) * 100,
    avgRRR: list.reduce((sum, t) => {
      let val = 0;
      if (t.rrr) {
        const parts = String(t.rrr).split(":");
        val = parseFloat(parts[parts.length - 1] || "0") || 0;
      }
      return sum + val;
    }, 0) / list.length,
    profitFactor: grossLoss === 0 ? gross : gross / grossLoss,
    winStreak: s.win,
    lossStreak: s.loss,
    bestPair: byPair[0] ?? { name: "N/A", trades: 0, wins: 0, pnl: 0, winRate: 0 },
    worstPair: byPair[byPair.length - 1] ?? { name: "N/A", trades: 0, wins: 0, pnl: 0, winRate: 0 },
    net,
    monthlyPnl: list.filter((t) => t.date.startsWith(month)).reduce((s2, t) => s2 + pnlUsd(t), 0),
    weeklyPnl: list.slice(-8).reduce((s2, t) => s2 + pnlUsd(t), 0),
    avgWin: gross / Math.max(wins.length, 1),
    avgLoss: grossLoss / Math.max(losses.length, 1),
    wins: wins.length,
    losses: losses.length,
  };
}

export function equityCurve(list: Trade[] = []) {
  let eq = ACCOUNT;
  let peak = ACCOUNT;
  return list.map((t, i) => {
    eq += pnlUsd(t);
    peak = Math.max(peak, eq);
    return {
      i: i + 1,
      date: t.date,
      equity: Math.round(eq),
      drawdown: Math.round(((eq - peak) / peak) * 1000) / 10,
    };
  });
}

export function monthly(list: Trade[] = []) {
  const g = groupStats(list, (t) => t.date.slice(0, 7));
  return g
    .sort((a, b) => (a.name < b.name ? -1 : 1))
    .map((m) => ({
      ...m,
      label: new Date(`${m.name}-01T00:00:00Z`).toLocaleString("en-US", { month: "short" }),
    }));
}

export const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── Local Persistence Store Helpers for Trades ──────────────────────────────
const LOCAL_TRADES_KEY = "tn_trades_store_v2";

function getLocalTrades(): Trade[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_TRADES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalTrades(list: Trade[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_TRADES_KEY, JSON.stringify(list));
  } catch {}
}

export async function fetchUserTrades(): Promise<Trade[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .order("date", { ascending: false });

      if (error) {
        console.error("[Trades] Supabase fetch error:", error.message);
        return [];
      }

      if (data) {
        return data.map((t: any) => {
          let parsedTags: string[] = [];
          if (Array.isArray(t.tags)) {
            parsedTags = t.tags;
          } else if (typeof t.tags === "string") {
            try {
              if (t.tags.startsWith("[")) {
                parsedTags = JSON.parse(t.tags);
              } else {
                parsedTags = t.tags.replace(/^{|}$/g, "").replace(/"/g, "").split(",").map((s: string) => s.trim()).filter(Boolean);
              }
            } catch {
              parsedTags = [];
            }
          }

          let parsedMistakes = "";
          if (typeof t.mistakes === "string") {
            parsedMistakes = t.mistakes;
          } else if (Array.isArray(t.mistakes)) {
            parsedMistakes = t.mistakes.join(", ");
          }

          return {
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
            tags: parsedTags,
            lots: t.lots || "",
            mistakes: parsedMistakes,
            rating: t.rating ? parseInt(t.rating, 10) : undefined,
            reason: t.reason || "",
          };
        });
      }
    } catch (err) {
      console.warn("[Trades] Supabase fetch notice:", err);
    }
  }

  // Fallback ONLY if Supabase is completely unconfigured (e.g. dev mock mode)
  return getLocalTrades();
}

export async function saveTradeToSupabase(
  tradePayload: Partial<Trade>,
  userId: string,
  imageFile?: File,
): Promise<void> {
  let screenshotUrl = tradePayload.screenshot || "chart-1";

  if (imageFile && isSupabaseConfigured) {
    try {
      const fileExt = imageFile.name.split(".").pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("trade-screenshots")
        .upload(filePath, imageFile);

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from("trade-screenshots")
          .getPublicUrl(filePath);
        screenshotUrl = publicUrlData.publicUrl;
      }
    } catch (err) {
      console.warn("[Storage] Image upload notice:", err);
    }
  }

  const tradeId =
    tradePayload.id || `trade-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  const newTradeObj: Trade = {
    id: tradeId,
    tradeNo: tradePayload.tradeNo,
    date: tradePayload.date || new Date().toISOString().slice(0, 10),
    pair: tradePayload.pair || "XAUUSD",
    side: tradePayload.side || "Buy",
    session: tradePayload.session || "London",
    entryTime: tradePayload.entryTime || "12:00",
    exitTime: tradePayload.exitTime || "13:00",
    entryPrice: tradePayload.entryPrice || 0,
    exitPrice: tradePayload.exitPrice || 0,
    result: tradePayload.result || "Win",
    rrr: String(tradePayload.rrr || "2.0"),
    riskPct: tradePayload.riskPct || 1,
    pnl: tradePayload.pnl || 0,
    setup: tradePayload.setup || "Liquidity Sweep",
    confirmation: tradePayload.confirmation || "",
    notes: tradePayload.notes || "",
    screenshot: screenshotUrl,
    tags: tradePayload.tags || [],
    lots: tradePayload.lots || "",
    mistakes: tradePayload.mistakes || "",
    rating: tradePayload.rating,
    reason: tradePayload.reason || "",
  };

  // 1. Sync to Supabase Cloud if configured
  if (isSupabaseConfigured) {
    const row: any = {
      user_id: userId,
      trade_no: newTradeObj.tradeNo,
      date: newTradeObj.date,
      pair: newTradeObj.pair,
      side: newTradeObj.side,
      session: newTradeObj.session,
      entry_time: newTradeObj.entryTime,
      exit_time: newTradeObj.exitTime,
      entry_price: newTradeObj.entryPrice,
      exit_price: newTradeObj.exitPrice,
      result: newTradeObj.result,
      rrr: newTradeObj.rrr,
      risk_pct: newTradeObj.riskPct,
      pnl: newTradeObj.pnl,
      setup: newTradeObj.setup,
      confirmation: newTradeObj.confirmation,
      notes: newTradeObj.notes,
      screenshot_url: screenshotUrl,
      tags: newTradeObj.tags,
      lots: newTradeObj.lots,
      mistakes: newTradeObj.mistakes,
      rating: newTradeObj.rating,
      reason: newTradeObj.reason,
    };
    
    if (tradePayload.id) {
      row.id = tradePayload.id;
    }

    try {
      const { error } = await supabase.from("trades").upsert(row);
      if (error) throw error;
    } catch (e: any) {
      console.warn("[Database] Trades sync notice:", e);
      // Prevent raw database errors from reaching the user
      const msg = e.message || "";
      if (msg.includes("Could not find") || msg.includes("column")) {
        throw new Error("Database schema update required. Please contact support.");
      }
      throw new Error("Failed to save trade to the database. Please try again.");
    }
  } else {
    // 2. Instantly save to local persistent storage ONLY IF NOT SUPABASE
    const currentList = getLocalTrades();
    const existingIdx = currentList.findIndex((t) => t.id === tradeId);
    if (existingIdx >= 0) {
      currentList[existingIdx] = newTradeObj;
    } else {
      currentList.unshift(newTradeObj);
    }
    setLocalTrades(currentList);
  }
}

export async function deleteTradeFromSupabase(tradeId: string): Promise<void> {
  // Remove from Supabase Cloud if configured
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from("trades").delete().eq("id", tradeId);
      if (error) throw error;
    } catch (e) {
      console.warn("[Database] Delete trade notice:", e);
      throw new Error("Failed to delete trade. Please try again.");
    }
  } else {
    // Remove from local storage ONLY IF NOT SUPABASE
    const currentList = getLocalTrades();
    const remaining = currentList.filter((t) => t.id !== tradeId);
    setLocalTrades(remaining);
  }
}

// ── Pattern Aggregation for AI Coach ────────────────────────────────────────

export function aggregateTradePatterns(list: Trade[] = []) {
  if (list.length === 0) return null;

  const wins = list.filter((t) => t.result === "Win");
  
  // 1. Setup Performance
  const setups = groupStats(list, (t) => t.setup || "Unknown").filter((g) => g.name !== "Unknown");
  const bestSetup = setups.filter(s => s.trades >= 3).sort((a, b) => b.winRate - a.winRate)[0];
  const worstSetup = setups.filter(s => s.trades >= 3).sort((a, b) => a.winRate - b.winRate)[0];

  // 2. Pair Performance
  const pairs = groupStats(list, (t) => t.pair || "Unknown").filter((g) => g.name !== "Unknown");
  const bestPair = pairs.filter(p => p.trades >= 3).sort((a, b) => b.winRate - a.winRate)[0];
  
  // 3. Session Performance
  const sessions = groupStats(list, (t) => t.session || "Unknown").filter((g) => g.name !== "Unknown");

  // 4. Mistake Frequency
  const mistakesMap = new Map<string, { count: number; pnl: number }>();
  list.forEach(t => {
    if (t.mistakes) {
      const parts = t.mistakes.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
      parts.forEach(m => {
        const cur = mistakesMap.get(m) ?? { count: 0, pnl: 0 };
        cur.count += 1;
        cur.pnl += t.pnl;
        mistakesMap.set(m, cur);
      });
    }
  });
  const sortedMistakes = Array.from(mistakesMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 5. Recent vs Historical Trend
  const recent10 = list.slice(0, 10);
  const recentWinRate = recent10.length > 0 ? (recent10.filter(t => t.result === "Win").length / recent10.length) * 100 : null;
  const overallWinRate = (wins.length / list.length) * 100;

  return {
    totalTrades: list.length,
    overallWinRate: Math.round(overallWinRate),
    recent10WinRate: recentWinRate !== null ? Math.round(recentWinRate) : null,
    trend: recentWinRate !== null ? (recentWinRate > overallWinRate ? "Improving" : recentWinRate < overallWinRate ? "Deteriorating" : "Stable") : "Unknown",
    topMistakes: sortedMistakes,
    setupsSummary: setups.map(s => ({ name: s.name, trades: s.trades, winRate: Math.round(s.winRate) })),
    bestSetup: bestSetup ? { name: bestSetup.name, winRate: Math.round(bestSetup.winRate), trades: bestSetup.trades } : null,
    worstSetup: worstSetup ? { name: worstSetup.name, winRate: Math.round(worstSetup.winRate), trades: worstSetup.trades } : null,
    pairsSummary: pairs.map(p => ({ name: p.name, trades: p.trades, winRate: Math.round(p.winRate) })),
    bestPair: bestPair ? { name: bestPair.name, winRate: Math.round(bestPair.winRate), trades: bestPair.trades } : null,
    sessionsSummary: sessions.map(s => ({ name: s.name, trades: s.trades, winRate: Math.round(s.winRate) }))
  };
}
