import { supabase, isSupabaseConfigured, generateUUID } from "./supabase";

export type Trade = {
  id: string;
  tradeNo?: number | undefined;
  date: string; // ISO yyyy-mm-dd
  createdAt?: string; // ISO timestamp
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

export function isValidImageUrl(url?: string | null): boolean {
  if (!url || url === "chart-1") return false;
  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:image/") ||
    url.startsWith("blob:")
  );
}

export function parseTradeTimestamp(t: Trade): number {
  if (t.createdAt) {
    const ts = new Date(t.createdAt).getTime();
    if (!isNaN(ts) && ts > 0) return ts;
  }
  if (t.date) {
    const timePart = t.entryTime && t.entryTime.includes(":") ? t.entryTime : "00:00";
    const dateIso = `${t.date.slice(0, 10)}T${timePart.padStart(5, "0")}:00Z`;
    const ts = new Date(dateIso).getTime();
    if (!isNaN(ts) && ts > 0) return ts;
  }
  return 0;
}

export function sortTradesNewestFirst(trades: Trade[]): Trade[] {
  return [...trades].sort((a, b) => {
    const timeA = parseTradeTimestamp(a);
    const timeB = parseTradeTimestamp(b);
    if (timeB !== timeA) return timeB - timeA;
    return (b.id || "").localeCompare(a.id || "");
  });
}

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
    .format(n || 0)
    .replace("USD", "")
    .trim();

export const compactMoney = (n: number) => {
  const num = n || 0;
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  if (abs >= 1_000_000_000) {
    return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 100_000) {
    return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  }
  return money(num);
};

export const formatProfitFactor = (pf: number) => {
  if (isNaN(pf) || !isFinite(pf)) return "0.00";
  if (pf >= 100) return ">99.0";
  if (pf <= 0) return "0.00";
  return pf.toFixed(2);
};

export const pct = (n: number) => `${(n || 0).toFixed(1)}%`;

const ACCOUNT = 0;
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
    profitFactor: grossLoss === 0 ? (gross > 0 ? 100 : 0) : gross / grossLoss,
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
      drawdown: Math.round(eq - peak),
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

export function weekly(list: Trade[] = []) {
  const map = new Map<string, Trade[]>();
  for (const t of list) {
    if (!t.date) continue;
    const d = new Date(`${t.date}T00:00:00Z`);
    if (isNaN(d.getTime())) continue;
    // Get Monday of the week
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setUTCDate(diff));
    const weekKey = monday.toISOString().slice(0, 10);
    if (!map.has(weekKey)) map.set(weekKey, []);
    map.get(weekKey)!.push(t);
  }

  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([weekStart, weekTrades]) => {
      const wins = weekTrades.filter((t) => t.result === "Win");
      const pnl = weekTrades.reduce((sum, t) => sum + pnlUsd(t), 0);
      return {
        name: weekStart,
        label: `W/C ${new Date(weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        trades: weekTrades.length,
        winRate: weekTrades.length > 0 ? (wins.length / weekTrades.length) * 100 : 0,
        pnl,
      };
    });
}

export const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── Local Persistence Store Helpers for Trades ──────────────────────────────
// ── Local Persistence Store Helpers for Trades ──────────────────────────────
const LOCAL_TRADES_KEY = "tn_trades_store_v2";
const LOCAL_DELETED_KEY = "tn_deleted_trades_v1";

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

function getDeletedTradeIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addDeletedTradeId(id: string) {
  if (typeof window === "undefined") return;
  try {
    const list = getDeletedTradeIds();
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem(LOCAL_DELETED_KEY, JSON.stringify(list));
    }
  } catch {}
}

export async function fetchUserTrades(): Promise<Trade[]> {
  const deletedIds = new Set(getDeletedTradeIds());
  let remoteTrades: Trade[] = [];

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .order("created_at", { ascending: false, nullsFirst: false })
        .order("date", { ascending: false });

      if (error) {
        console.error("[Trades] Supabase fetch error:", error.message);
      } else if (data) {
        let parsedTrades = data.map((t: any) => {
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
            createdAt: t.created_at || (t.date ? `${t.date}T${t.entry_time || "00:00"}:00Z` : undefined),
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

        // Batch fetch signed URLs for valid relative paths (excluding data URLs, blob URLs, and full http URLs)
        const pathsToSign = parsedTrades
          .map((t: Trade) => t.screenshot)
          .filter((s: string) => s && s !== "chart-1" && !s.startsWith("http") && !s.startsWith("data:") && !s.startsWith("blob:"));

        if (pathsToSign.length > 0) {
          const urlMap = new Map<string, string>();
          try {
            const { data: signedUrlsData, error: signError } = await (supabase.storage
              .from("trade-screenshots") as any)
              .createSignedUrls(pathsToSign, 31536000); // 1 year expiry for cached viewing

            if (!signError && signedUrlsData) {
              signedUrlsData.forEach((item: any) => {
                if (item.signedUrl) {
                  urlMap.set(item.path, item.signedUrl);
                }
              });
            }
          } catch (e) {
            console.warn("[Storage] Signed URL notice:", e);
          }

          // Fallback to getPublicUrl for any path that couldn't generate a signed URL
          pathsToSign.forEach((path) => {
            if (!urlMap.has(path)) {
              const publicUrl = supabase.storage.from("trade-screenshots").getPublicUrl(path).data?.publicUrl;
              if (publicUrl) {
                urlMap.set(path, publicUrl);
              }
            }
          });

          parsedTrades = parsedTrades.map((t: Trade) => {
            if (t.screenshot && urlMap.has(t.screenshot)) {
              return { ...t, screenshot: urlMap.get(t.screenshot)! };
            }
            return t;
          });
        }

        remoteTrades = parsedTrades;
      }
    } catch (err) {
      console.warn("[Trades] Supabase fetch notice:", err);
    }
  }

  // Merge remote and local trades cleanly
  const localTrades = getLocalTrades();
  const resultMap = new Map<string, Trade>();

  // Add remote trades first
  for (const t of remoteTrades) {
    if (!deletedIds.has(t.id)) {
      resultMap.set(t.id, t);
    }
  }

  // Add/override with local trades if not marked deleted
  for (const t of localTrades) {
    if (!deletedIds.has(t.id)) {
      resultMap.set(t.id, t);
    }
  }

  return sortTradesNewestFirst(Array.from(resultMap.values()));
}

export async function saveTradeToSupabase(
  tradePayload: Partial<Trade>,
  userId: string,
  imageFile?: File,
): Promise<void> {
  let screenshotUrl = tradePayload.screenshot || "chart-1";

  const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  
  const tradeId =
    tradePayload.id && isUUID(tradePayload.id)
      ? tradePayload.id
      : generateUUID();

  const createdAt = tradePayload.createdAt || new Date().toISOString();

  // Convert File to base64 Data URL so image is instantly previewable & stored locally even offline
  if (imageFile) {
    try {
      screenshotUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });
    } catch (e) {
      console.warn("Failed to convert image to data URL:", e);
    }
  }

  // Upload to Supabase Storage bucket if configured
  if (imageFile && isSupabaseConfigured) {
    try {
      const fileExt = imageFile.name.split(".").pop() || "png";
      const filePath = `${userId}/${tradeId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = (await supabase.storage
        .from("trade-screenshots")
        .upload(filePath, imageFile, { upsert: true })) as any;

      if (!uploadError) {
        const { data: signedData } = await (supabase.storage.from("trade-screenshots") as any).createSignedUrl(filePath, 31536000);
        if (signedData?.signedUrl) {
          screenshotUrl = signedData.signedUrl;
        } else {
          const publicUrl = supabase.storage.from("trade-screenshots").getPublicUrl(filePath).data?.publicUrl;
          if (publicUrl) {
            screenshotUrl = publicUrl;
          } else {
            screenshotUrl = filePath;
          }
        }
      } else {
        console.error("[Storage] Image upload warning:", uploadError.message);
      }
    } catch (err) {
      console.error("[Storage] Upload notice:", err);
    }
  }

  const newTradeObj: Trade = {
    id: tradeId,
    tradeNo: tradePayload.tradeNo,
    date: tradePayload.date || new Date().toISOString().slice(0, 10),
    createdAt,
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

  // Always update local persistent storage so UI is 100% immediate & consistent
  const currentList = getLocalTrades();
  const existingIdx = currentList.findIndex((t) => t.id === tradeId);
  if (existingIdx >= 0) {
    currentList[existingIdx] = newTradeObj;
  } else {
    currentList.unshift(newTradeObj);
  }
  setLocalTrades(currentList);

  // Sync to Supabase Cloud if configured
  if (isSupabaseConfigured) {
    const row: any = {
      id: tradeId,
      user_id: userId,
      trade_no: newTradeObj.tradeNo !== undefined && newTradeObj.tradeNo !== null ? newTradeObj.tradeNo : null,
      date: newTradeObj.date,
      created_at: createdAt,
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
      confirmation: newTradeObj.confirmation || null,
      notes: newTradeObj.notes || null,
      screenshot_url: screenshotUrl,
      tags: newTradeObj.tags,
      lots: newTradeObj.lots || null,
      mistakes: newTradeObj.mistakes || null,
      rating: newTradeObj.rating !== undefined && newTradeObj.rating !== null ? newTradeObj.rating : null,
      reason: newTradeObj.reason || null,
    };

    try {
      const { error } = await supabase.from("trades").upsert(row);
      if (error) {
        console.warn("[Database] Trades sync warning:", error.message);
      }
    } catch (e: any) {
      console.warn("[Database] Trades sync notice:", e.message);
    }
  }
}

export async function deleteTradeFromSupabase(tradeId: string): Promise<void> {
  // 1. Mark ID as deleted locally so it can NEVER re-appear on UI
  addDeletedTradeId(tradeId);

  // 2. Clean up from local storage cache
  const currentList = getLocalTrades();
  const remaining = currentList.filter((t) => t.id !== tradeId);
  setLocalTrades(remaining);

  // 3. Remove from Supabase Cloud if configured
  if (isSupabaseConfigured) {
    try {
      const { data: trade } = await supabase
        .from("trades")
        .select("screenshot_url")
        .eq("id", tradeId)
        .maybeSingle();
      
      if (trade?.screenshot_url && !trade.screenshot_url.startsWith("http") && trade.screenshot_url !== "chart-1") {
        await supabase.storage
          .from("trade-screenshots")
          .remove([trade.screenshot_url]);
      }

      await supabase
        .from("trades")
        .delete()
        .eq("id", tradeId);
    } catch (e: any) {
      console.warn("[Database] Delete trade notice:", e);
    }
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
