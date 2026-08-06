export type Trade = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  pair: string;
  side: "Buy" | "Sell";
  session: "Asian" | "London" | "New York";
  entryTime: string;
  exitTime: string;
  entryPrice: number;
  exitPrice: number;
  result: "Win" | "Loss";
  rrr: number;
  riskPct: number;
  pnl: number;
  setup: string;
  confirmation: string;
  notes: string;
  screenshot: string;
  tags: string[];
};

export const PAIRS = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "BTCUSD", "NAS100"];
export const SETUPS = ["Order Block", "FVG Retest", "Liquidity Sweep", "Break & Retest", "Trend Continuation"];
export const SESSIONS = ["Asian", "London", "New York"] as const;
const CONFIRMS = ["CHoCH", "BOS", "Engulfing", "Sweep + MSS", "Volume Spike"];
const TAGS = ["A+ Setup", "Revenge", "Patience", "Early Entry", "Perfect TP", "Rule Break", "Scalp"];
const NOTES = [
  "Plan ke according entry liya, TP tak patience rakha.",
  "Thoda early entry ho gaya, confirmation ka wait karna chahiye tha.",
  "Revenge trade tha, risk zyada le liya. Dobara nahi.",
  "London open ka liquidity sweep perfect chala.",
  "News se pehle enter kiya, avoid karna chahiye tha.",
  "Setup A+ tha, size bhi sahi thi. Textbook execution.",
];

// Deterministic pseudo-random so SSR and client match.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function build(): Trade[] {
  const r = rng(20260805);
  const trades: Trade[] = [];
  const start = new Date(Date.UTC(2026, 1, 2));
  for (let i = 0; i < 168; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + Math.floor(i * 1.08));
    const day = d.getUTCDay();
    if (day === 0 || day === 6) d.setUTCDate(d.getUTCDate() + 2);
    const pair = PAIRS[Math.floor(r() * PAIRS.length)]!;
    const win = r() < (pair === "XAUUSD" ? 0.68 : pair === "USDJPY" ? 0.38 : 0.56);
    const rrr = Math.round((1 + r() * 3) * 10) / 10;
    const riskPct = Math.round((0.5 + r() * 1.5) * 10) / 10;
    const entryPrice = Math.round((100 + r() * 2000) * 100) / 100;
    const hour = 2 + Math.floor(r() * 16);
    const session = hour < 8 ? "Asian" : hour < 13 ? "London" : "New York";
    const pnl = Math.round((win ? riskPct * rrr : -riskPct) * 100) / 100;
    trades.push({
      id: `T-${1000 + i}`,
      date: d.toISOString().slice(0, 10),
      pair,
      side: r() < 0.5 ? "Buy" : "Sell",
      session,
      entryTime: `${String(hour).padStart(2, "0")}:${r() < 0.5 ? "15" : "45"}`,
      exitTime: `${String(hour + 1).padStart(2, "0")}:${r() < 0.5 ? "05" : "50"}`,
      entryPrice,
      exitPrice: Math.round((entryPrice * (1 + (win ? 1 : -1) * (0.002 + r() * 0.01))) * 100) / 100,
      result: win ? "Win" : "Loss",
      rrr,
      riskPct,
      pnl,
      setup: SETUPS[Math.floor(r() * SETUPS.length)]!,
      confirmation: CONFIRMS[Math.floor(r() * CONFIRMS.length)]!,
      notes: NOTES[Math.floor(r() * NOTES.length)]!,
      screenshot: `chart-${1 + Math.floor(r() * 4)}`,
      tags: [TAGS[Math.floor(r() * TAGS.length)]!, TAGS[Math.floor(r() * TAGS.length)]!].filter(
        (v, idx, a) => a.indexOf(v) === idx,
      ),
    });
  }
  return trades.sort((a, b) => (a.date < b.date ? -1 : 1));
}

export const trades: Trade[] = build();

export const money = (n: number, currency = "$") =>
  `${n < 0 ? "-" : ""}${currency}${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export const pct = (n: number) => `${n.toFixed(1)}%`;

const ACCOUNT = 10000;
export const pnlUsd = (t: Trade) => Math.round((t.pnl / 100) * ACCOUNT);

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

export function stats(list: Trade[] = trades) {
  if (!list || list.length === 0) {
    return {
      total: 0,
      winRate: 0,
      avgRRR: 0,
      profitFactor: 0,
      winStreak: 0,
      lossStreak: 0,
      bestPair: { name: "XAUUSD", trades: 0, wins: 0, pnl: 0, winRate: 0 },
      worstPair: { name: "USDJPY", trades: 0, wins: 0, pnl: 0, winRate: 0 },
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
    avgRRR: list.reduce((s2, t) => s2 + t.rrr, 0) / list.length,
    profitFactor: grossLoss === 0 ? gross : gross / grossLoss,
    winStreak: s.win,
    lossStreak: s.loss,
    bestPair: byPair[0] ?? { name: "XAUUSD", trades: 0, wins: 0, pnl: 0, winRate: 0 },
    worstPair: byPair[byPair.length - 1] ?? { name: "USDJPY", trades: 0, wins: 0, pnl: 0, winRate: 0 },
    net,
    monthlyPnl: list.filter((t) => t.date.startsWith(month)).reduce((s2, t) => s2 + pnlUsd(t), 0),
    weeklyPnl: list.slice(-8).reduce((s2, t) => s2 + pnlUsd(t), 0),
    avgWin: gross / Math.max(wins.length, 1),
    avgLoss: grossLoss / Math.max(losses.length, 1),
    wins: wins.length,
    losses: losses.length,
  };
}

export function equityCurve(list: Trade[] = trades) {
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

export function monthly(list: Trade[] = trades) {
  const g = groupStats(list, (t) => t.date.slice(0, 7));
  return g
    .sort((a, b) => (a.name < b.name ? -1 : 1))
    .map((m) => ({
      ...m,
      label: new Date(`${m.name}-01T00:00:00Z`).toLocaleString("en-US", { month: "short" }),
    }));
}

export const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

import { isSupabaseConfigured, readDemoTrades, supabase, writeDemoTrades } from "./supabase";

function normalizeTradeRecord(record: Record<string, unknown>): Trade {
  return {
    id: String(record.id ?? ""),
    date: String(record.date ?? ""),
    pair: String(record.pair ?? "XAUUSD"),
    side: (record.side as Trade["side"]) ?? "Buy",
    session: (record.session as Trade["session"]) ?? "London",
    entryTime: String(record.entryTime ?? record.entry_time ?? "12:00"),
    exitTime: String(record.exitTime ?? record.exit_time ?? "13:00"),
    entryPrice: Number(record.entryPrice ?? record.entry_price ?? 0),
    exitPrice: Number(record.exitPrice ?? record.exit_price ?? 0),
    result: (record.result as Trade["result"]) ?? "Win",
    rrr: Number(record.rrr ?? 0),
    riskPct: Number(record.riskPct ?? record.risk_pct ?? 0),
    pnl: Number(record.pnl ?? 0),
    setup: String(record.setup ?? ""),
    confirmation: String(record.confirmation ?? ""),
    notes: String(record.notes ?? ""),
    screenshot: String(record.screenshot ?? record.screenshot_url ?? "chart-1"),
    tags: Array.isArray(record.tags) ? record.tags.map((tag) => String(tag)) : [],
  };
}

export async function fetchUserTrades(): Promise<Trade[]> {
  if (!isSupabaseConfigured) {
    const demoTrades = readDemoTrades();
    return demoTrades.length > 0 ? demoTrades.map((record) => normalizeTradeRecord(record as Record<string, unknown>)) : trades;
  }

  try {
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .order("date", { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((t) => ({
        id: t.id,
        date: t.date,
        pair: t.pair,
        side: t.side,
        session: t.session,
        entryTime: t.entry_time,
        exitTime: t.exit_time,
        entryPrice: parseFloat(t.entry_price),
        exitPrice: parseFloat(t.exit_price),
        result: t.result,
        rrr: parseFloat(t.rrr),
        riskPct: parseFloat(t.risk_pct),
        pnl: parseFloat(t.pnl),
        setup: t.setup,
        confirmation: t.confirmation || "",
        notes: t.notes || "",
        screenshot: t.screenshot_url || "chart-1",
        tags: t.tags || [],
      }));
    }
  } catch (err) {
    console.error("Error fetching trades from Supabase:", err);
  }
  return trades;
}

export async function saveTradeToSupabase(tradePayload: Partial<Trade>, userId: string, imageFile?: File): Promise<void> {
  if (!isSupabaseConfigured) {
    const existing = readDemoTrades() as Record<string, unknown>[];
    const nextTrade: Trade = {
      id: tradePayload.id && !tradePayload.id.startsWith("T-") ? tradePayload.id : `demo-${Date.now()}`,
      date: tradePayload.date || new Date().toISOString().slice(0, 10),
      pair: tradePayload.pair || "XAUUSD",
      side: tradePayload.side || "Buy",
      session: tradePayload.session || "London",
      entryTime: tradePayload.entryTime || "12:00",
      exitTime: tradePayload.exitTime || "13:00",
      entryPrice: tradePayload.entryPrice || 0,
      exitPrice: tradePayload.exitPrice || 0,
      result: tradePayload.result || "Win",
      rrr: tradePayload.rrr || 1,
      riskPct: tradePayload.riskPct || 1,
      pnl: tradePayload.pnl || 0,
      setup: tradePayload.setup || "",
      confirmation: tradePayload.confirmation || "",
      notes: tradePayload.notes || "",
      screenshot: tradePayload.screenshot || "chart-1",
      tags: tradePayload.tags || [],
    };

    const next = tradePayload.id && !tradePayload.id.startsWith("T-")
      ? existing.map((item) => (String(item.id) === String(tradePayload.id) ? nextTrade : (item as Trade)))
      : [...existing, nextTrade];
    writeDemoTrades(next);
    return;
  }

  let screenshotUrl = tradePayload.screenshot || "chart-1";

  if (imageFile) {
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
  }

  const row = {
    user_id: userId,
    date: tradePayload.date || new Date().toISOString().slice(0, 10),
    pair: tradePayload.pair,
    side: tradePayload.side,
    session: tradePayload.session,
    entry_time: tradePayload.entryTime || "12:00",
    exit_time: tradePayload.exitTime || "13:00",
    entry_price: tradePayload.entryPrice,
    exit_price: tradePayload.exitPrice,
    result: tradePayload.result,
    rrr: tradePayload.rrr,
    risk_pct: tradePayload.riskPct,
    pnl: tradePayload.pnl,
    setup: tradePayload.setup,
    confirmation: tradePayload.confirmation || "",
    notes: tradePayload.notes || "",
    screenshot_url: screenshotUrl,
    tags: tradePayload.tags || [],
  };

  if (tradePayload.id && !tradePayload.id.startsWith("T-")) {
    const { error } = await supabase.from("trades").update(row).eq("id", tradePayload.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("trades").insert(row);
    if (error) throw error;
  }
}

export async function deleteTradeFromSupabase(tradeId: string): Promise<void> {
  if (tradeId.startsWith("T-")) return; // Demo trade

  if (!isSupabaseConfigured) {
    const existing = readDemoTrades() as Record<string, unknown>[];
    writeDemoTrades(existing.filter((item) => String(item.id) !== tradeId));
    return;
  }

  const { error } = await supabase.from("trades").delete().eq("id", tradeId);
  if (error) throw error;
}

