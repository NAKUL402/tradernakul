import { supabase } from "./supabase";

export type Trade = {
  id: string;
  tradeNo?: number;
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
  lots?: string;      // Lot size
  mistakes?: string;  // Mistakes section
  rating?: number;    // 1-5 Star rating
  reason?: string;    // Reason for taking trade
};

export const PAIRS = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "BTCUSD", "NAS100"];
export const SETUPS = ["Order Block", "FVG Retest", "Liquidity Sweep", "Break & Retest", "Trend Continuation"];
export const SESSIONS = ["Asian", "London", "New York"] as const;

export const trades: Trade[] = [];

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
  const groups: Record<string, { win: number; loss: number; pnl: number }> = {};
  list.forEach((t) => {
    const k = key(t);
    if (!groups[k]) groups[k] = { win: 0, loss: 0, pnl: 0 };
    if (t.result === "Win") groups[k].win++;
    else groups[k].loss++;
    groups[k].pnl += pnlUsd(t);
  });
  return Object.entries(groups).map(([name, stats]) => ({
    name,
    trades: stats.win + stats.loss,
    winRate: stats.win + stats.loss > 0 ? stats.win / (stats.win + stats.loss) : 0,
    pnl: stats.pnl,
  }));
}

export async function fetchUserTrades(): Promise<Trade[]> {
  try {
    const { data } = await supabase
      .from("trades")
      .select("*")
      .order("date", { ascending: false });

    if (data && data.length > 0) {
      return data.map((t) => ({
        id: t.id,
        tradeNo: t.trade_no ? parseInt(t.trade_no, 10) : undefined,
        date: t.date,
        pair: t.pair,
        side: t.side,
        session: t.session,
        entryTime: t.entry_time,
        exitTime: t.exit_time,
        entryPrice: parseFloat(t.entry_price),
        exitPrice: parseFloat(t.exit_price),
        result: t.result,
        rrr: String(t.rrr || "1.0"),
        riskPct: parseFloat(t.risk_pct),
        pnl: parseFloat(t.pnl),
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
    }
  } catch (err) {
    console.error("Error fetching trades:", err);
  }
  return [];
}

export async function saveTradeToSupabase(tradePayload: Partial<Trade>, userId: string, imageFile?: File): Promise<void> {
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
    id: tradePayload.id || `trade-${Math.random().toString(36).substr(2, 9)}`,
    user_id: userId,
    trade_no: tradePayload.tradeNo,
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
    lots: tradePayload.lots || "",
    mistakes: tradePayload.mistakes || "",
    rating: tradePayload.rating,
    reason: tradePayload.reason || "",
  };

  if (tradePayload.id) {
    const { error } = await supabase.from("trades").update(row).eq("id", tradePayload.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("trades").insert(row);
    if (error) throw error;
  }
}

export async function deleteTradeFromSupabase(tradeId: string): Promise<void> {
  const { error } = await supabase.from("trades").delete().eq("id", tradeId);
  if (error) throw error;
}
