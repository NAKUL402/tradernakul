import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/app/AppShell";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Flame,
  Info,
  Percent,
  Scale,
  Target,
  TrendingUp,
  Trophy,
  Wallet,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DOW,
  equityCurve,
  fetchUserTrades,
  getLocalTrades,
  sortTradesNewestFirst,
  groupStats,
  money,
  compactMoney,
  formatProfitFactor,
  monthly,
  pct,
  pnlUsd,
  stats,
  streaks,
  type Trade,
} from "@/lib/trades";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Edge Journal" },
      {
        name: "description",
        content:
          "Deep insights into your trading performance with advanced analytics.",
      },
    ],
  }),
  component: Analytics,
});

/* ─── Tooltip styles for Recharts ────────────────────────────────── */
const ttStyle = {
  contentStyle: {
    background: "#0d111c",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: 10,
    fontSize: 12,
    color: "#ffffff",
    boxShadow: "0 14px 36px -8px rgba(0,0,0,0.8)",
  },
  itemStyle: { color: "#ffffff", fontWeight: 700 },
  labelStyle: { color: "#94a3b8", fontWeight: 600, marginBottom: 4 },
} as const;

const axisProps = {
  stroke: "rgba(255,255,255,0.06)",
  tickLine: false,
  axisLine: false,
  tick: { fill: "#cbd5e1", fontSize: 11, fontWeight: 500 },
} as const;

/* ─── Panel wrapper (3D depth card) ──────────────────────────────── */
function Panel3D({ title, info, action, children, className }: {
  title: string;
  info?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      "neon-card group p-6",
      className
    )}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          {info && <Info className="size-4 text-muted-foreground" />}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────── */
function parseRRR(rrr: string): number {
  if (!rrr) return 0;
  const parts = String(rrr).split(":");
  return parseFloat(parts[parts.length - 1] || "0") || 0;
}

function getTimeBlock(time: string): string {
  const h = parseInt(time.slice(0, 2), 10);
  if (h < 4) return "00-04";
  if (h < 8) return "04-08";
  if (h < 12) return "08-12";
  if (h < 16) return "12-16";
  if (h < 20) return "16-20";
  return "20-24";
}

function getRRBin(rrr: string): string {
  const val = parseRRR(rrr);
  if (val < 1) return "0-1R";
  if (val < 2) return "1-2R";
  if (val < 3) return "2-3R";
  return "3R+";
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────────── */
function Analytics() {
  const [userTrades, setUserTrades] = useState<Trade[]>(() => sortTradesNewestFirst(getLocalTrades()));

  // Stateful controls for Daily Performance, Performance Heatmap, Monthly Overview, and Header Date Range
  const [dailyMode, setDailyMode] = useState<"Cumulative PnL" | "Daily PnL" | "Trades Count">("Cumulative PnL");
  const [dailyDropdownOpen, setDailyDropdownOpen] = useState(false);

  const [heatmapMode, setHeatmapMode] = useState<"Win Rate %" | "Net PnL $" | "Trade Count">("Win Rate %");
  const [heatmapDropdownOpen, setHeatmapDropdownOpen] = useState(false);

  const [monthlyYear, setMonthlyYear] = useState<"2026" | "2025" | "All Time">("2026");
  const [monthlyDropdownOpen, setMonthlyDropdownOpen] = useState(false);

  const [headerDateRangeOpen, setHeaderDateRangeOpen] = useState(false);
  const [headerDateLabel, setHeaderDateLabel] = useState("Aug 07, 2025 – Aug 13, 2025");

  useEffect(() => {
    fetchUserTrades().then((trades) => setUserTrades(sortTradesNewestFirst(trades)));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest(".analytics-dropdown-container")) {
        setDailyDropdownOpen(false);
        setHeatmapDropdownOpen(false);
        setMonthlyDropdownOpen(false);
        setHeaderDateRangeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const s = useMemo(() => stats(userTrades), [userTrades]);
  const eq = useMemo(() => equityCurve(userTrades), [userTrades]);
  const months = useMemo(() => monthly(userTrades), [userTrades]);
  const stk = useMemo(() => streaks(userTrades), [userTrades]);

  /* ── Derived data ── */

  // Daily PnL aggregation for the area chart
  const dailyPnl = useMemo(() => {
    const map = new Map<string, { pnl: number; count: number }>();
    for (const t of userTrades) {
      const cur = map.get(t.date) || { pnl: 0, count: 0 };
      cur.pnl += pnlUsd(t);
      cur.count += 1;
      map.set(t.date, cur);
    }
    let cum = 0;
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, val]) => {
        cum += val.pnl;
        const d = new Date(`${date}T00:00:00Z`);
        return {
          date,
          label: d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
          pnl: val.pnl,
          cumPnl: cum,
          count: val.count,
        };
      });
  }, [userTrades]);

  const bestDay = useMemo(() => dailyPnl.reduce((best, d) => d.pnl > (best?.pnl ?? -Infinity) ? d : best, dailyPnl[0]), [dailyPnl]);
  const worstDay = useMemo(() => dailyPnl.reduce((worst, d) => d.pnl < (worst?.pnl ?? Infinity) ? d : worst, dailyPnl[0]), [dailyPnl]);
  const avgDailyPnl = useMemo(() => dailyPnl.length > 0 ? dailyPnl.reduce((s, d) => s + d.pnl, 0) / dailyPnl.length : 0, [dailyPnl]);

  // Heatmap: Day of Week × Time Block
  const heatmapData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const blocks = ["00-04", "04-08", "08-12", "12-16", "16-20", "20-24"];
    const map = new Map<string, { wins: number; total: number; pnl: number }>();
    for (const t of userTrades) {
      const d = new Date(`${t.date}T00:00:00Z`);
      const dow = DOW[d.getUTCDay()];
      if (!dow || !days.includes(dow)) continue;
      const block = getTimeBlock(t.entryTime);
      const key = `${dow}-${block}`;
      const cur = map.get(key) || { wins: 0, total: 0, pnl: 0 };
      cur.total++;
      cur.pnl += pnlUsd(t);
      if (t.result === "Win") cur.wins++;
      map.set(key, cur);
    }
    return { days, blocks, map };
  }, [userTrades]);

  // Direction donut
  const directionData = useMemo(() => {
    const long = userTrades.filter(t => t.side === "Buy").length;
    const short = userTrades.filter(t => t.side === "Sell").length;
    const be = 0;
    return [
      { name: "Long", value: long, color: "#10b981" },
      { name: "Short", value: short, color: "#ef4444" },
      { name: "Breakeven", value: be, color: "#71717a" },
    ].filter(d => d.value > 0);
  }, [userTrades]);

  // Time of day donut
  const timeData = useMemo(() => {
    const colors = ["#8b5cf6", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];
    const blocks = ["00-04", "04-08", "08-12", "12-16", "16-20", "20-24"];
    const counts = new Map<string, number>();
    for (const t of userTrades) {
      const b = getTimeBlock(t.entryTime);
      counts.set(b, (counts.get(b) || 0) + 1);
    }
    return blocks.map((b, i) => ({
      name: b,
      value: counts.get(b) || 0,
      color: colors[i]!,
    }));
  }, [userTrades]);

  // RR distribution donut
  const rrData = useMemo(() => {
    const bins = new Map<string, number>();
    for (const t of userTrades) {
      const bin = getRRBin(t.rrr);
      bins.set(bin, (bins.get(bin) || 0) + 1);
    }
    return [
      { name: "0-1R", value: bins.get("0-1R") || 0, color: "#ef4444" },
      { name: "1-2R", value: bins.get("1-2R") || 0, color: "#f59e0b" },
      { name: "2-3R", value: bins.get("2-3R") || 0, color: "#10b981" },
      { name: "3R+", value: bins.get("3R+") || 0, color: "#3b82f6" },
    ].filter(d => d.value > 0);
  }, [userTrades]);

  // Rolling 11 Recent-Results Window (Newest trade at front/left position #1)
  const recentResults = useMemo(() => {
    return userTrades.slice(0, 11).map(t => t.result);
  }, [userTrades]);

  // Current streak calculation
  const currentStreak = useMemo(() => {
    if (userTrades.length === 0) return { type: "wins", count: 0 };
    const first = userTrades[0]!.result;
    let count = 0;
    for (const t of userTrades) {
      if (t.result === first) count++;
      else break;
    }
    return { type: first === "Win" ? "wins" : "losses", count };
  }, [userTrades]);

  // Longest streaks
  const longestStreaks = useMemo(() => {
    let maxW = 0, maxL = 0, curW = 0, curL = 0;
    for (const t of userTrades) {
      if (t.result === "Win") { curW++; curL = 0; maxW = Math.max(maxW, curW); }
      else { curL++; curW = 0; maxL = Math.max(maxL, curL); }
    }
    return { win: maxW, loss: maxL };
  }, [userTrades]);

  // Monthly overview (filtered by monthlyYear)
  const monthlyBars = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of userTrades) {
      if (monthlyYear === "2026" && !t.date.startsWith("2026")) continue;
      if (monthlyYear === "2025" && !t.date.startsWith("2025")) continue;
      const m = t.date.slice(0, 7);
      map.set(m, (map.get(m) || 0) + pnlUsd(t));
    }
    const targetYear = monthlyYear === "2025" ? "2025" : "2026";
    const allMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return allMonths.map((label, i) => {
      const key = `${targetYear}-${String(i + 1).padStart(2, "0")}`;
      return { label, pnl: map.get(key) || 0 };
    });
  }, [userTrades, monthlyYear]);

  const totalPnl = useMemo(() => monthlyBars.reduce((s, m) => s + m.pnl, 0), [monthlyBars]);
  const bestMonth = useMemo(() => {
    const m = months.reduce((best, cur) => cur.pnl > (best?.pnl ?? -Infinity) ? cur : best, months[0]);
    return m;
  }, [months]);
  const worstMonth = useMemo(() => {
    const m = months.reduce((worst, cur) => cur.pnl < (worst?.pnl ?? Infinity) ? cur : worst, months[0]);
    return m;
  }, [months]);

  // Expectancy
  const expectancy = useMemo(() => {
    if (s.total === 0) return 0;
    const wr = s.winRate / 100;
    return (wr * s.avgWin) - ((1 - wr) * s.avgLoss);
  }, [s]);

  // 7-day trend comparison
  const prev7 = useMemo(() => {
    const now = new Date();
    const d7 = new Date(now); d7.setDate(d7.getDate() - 7);
    const d14 = new Date(now); d14.setDate(d14.getDate() - 14);
    const recent = userTrades.filter(t => new Date(t.date) >= d7);
    const previous = userTrades.filter(t => { const d = new Date(t.date); return d >= d14 && d < d7; });
    const rs = stats(recent);
    const ps = stats(previous);
    return { rs, ps };
  }, [userTrades]);

  function trendPct(current: number, previous: number): string {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const diff = ((current - previous) / Math.abs(previous)) * 100;
    return `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`;
  }

  const hasData = userTrades.length > 0;

  /* ─── Top 6 metric cards config ─── */
  const topCards = [
    {
      icon: <Activity className="size-4" />,
      iconBg: "bg-ai-bg text-ai elevation-1 border border-ai/10",
      label: "Total Trades",
      value: String(s.total),
      fullValue: String(s.total),
      trend: trendPct(prev7.rs.total, prev7.ps.total),
    },
    {
      icon: <Target className="size-4" />,
      iconBg: "bg-info-bg text-info elevation-1 border border-info/10",
      label: "Win Rate",
      value: pct(s.winRate),
      fullValue: pct(s.winRate),
      trend: trendPct(prev7.rs.winRate, prev7.ps.winRate),
    },
    {
      icon: <Zap className="size-4" />,
      iconBg: "bg-info-bg text-info elevation-1 border border-info/10",
      label: "Profit Factor",
      value: formatProfitFactor(s.profitFactor),
      fullValue: isFinite(s.profitFactor) ? s.profitFactor.toFixed(2) : "N/A",
      trend: trendPct(prev7.rs.profitFactor, prev7.ps.profitFactor),
    },
    {
      icon: <Wallet className="size-4" />,
      iconBg: "bg-success-bg text-success elevation-1 border border-success/10",
      label: "Net PnL",
      value: Math.abs(s.net) >= 1_000_000 ? compactMoney(s.net) : money(s.net),
      fullValue: money(s.net),
      trend: trendPct(prev7.rs.net, prev7.ps.net),
    },
    {
      icon: <TrendingUp className="size-4" />,
      iconBg: "bg-primary/10 text-primary elevation-1 border border-primary/10",
      label: "Expectancy",
      value: Math.abs(expectancy) >= 1_000_000 ? compactMoney(expectancy) : money(expectancy),
      fullValue: money(expectancy),
      trend: trendPct(expectancy, 0),
    },
    {
      icon: <Scale className="size-4" />,
      iconBg: "bg-danger-bg text-danger elevation-1 border border-danger/10",
      label: "Average R:R",
      value: `1:${s.avgRRR ? s.avgRRR.toFixed(2) : "0.00"}`,
      fullValue: `1:${s.avgRRR ? s.avgRRR.toFixed(2) : "0.00"}`,
      trend: trendPct(prev7.rs.avgRRR || 0, prev7.ps.avgRRR || 0),
    },
  ];

  const customHeader = (
    <div className="flex items-center gap-3">
      <div className="relative analytics-dropdown-container z-30">
        <button 
          onClick={() => setHeaderDateRangeOpen(!headerDateRangeOpen)}
          className="flex items-center gap-2 text-[12px] text-foreground bg-surface px-3 py-1.5 rounded-lg border border-border font-medium hover:bg-muted transition cursor-pointer"
        >
          <span className="text-muted-foreground">📅</span>
          <span>{headerDateLabel}</span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </button>
        {headerDateRangeOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-48 bg-surface border border-border rounded-xl shadow-2xl py-1 z-50">
            {[
              "Aug 07, 2025 – Aug 13, 2025",
              "Last 7 Days",
              "Last 30 Days",
              "Last 90 Days",
              "This Month",
              "This Year",
              "All Time"
            ].map(lbl => (
              <button
                key={lbl}
                onClick={() => { setHeaderDateLabel(lbl); setHeaderDateRangeOpen(false); }}
                className="w-full text-left px-3.5 py-2 text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground flex items-center justify-between cursor-pointer"
              >
                {lbl}
              </button>
            ))}
          </div>
        )}
      </div>

      <button 
        aria-label="Filter"
        onClick={() => setHeaderDateRangeOpen(!headerDateRangeOpen)}
        className="flex items-center justify-center size-8 rounded-lg border border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
      >
        <Scale className="size-3.5" />
      </button>
    </div>
  );

  return (
    <AppShell title="Analytics" subtitle="Deep insights into your trading performance" headerAction={customHeader}>
      {!hasData ? (
        <div className="flex h-[50vh] items-center justify-center text-center">
          <div className="flex flex-col items-center gap-4">
            <BarChart3 className="size-14 text-muted-foreground" />
            <p className="font-semibold text-lg text-foreground">No trades to analyze</p>
            <p className="max-w-xs text-sm text-muted-foreground">Add trades in the Journal to see your analytics.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-5 pb-12">

          {/* ═══════ ROW 1: 6 Metric Cards ═══════ */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {topCards.map((card, idx) => (
              <div
                key={card.label}
                className={cn("neon-card group p-3.5 sm:p-4 xl:p-5 flex flex-col justify-between min-w-0 overflow-hidden transition-all duration-200",
                  idx === 0 ? "neon-glow-blue" :
                  idx === 1 ? "neon-glow-green" :
                  idx === 2 ? "neon-glow-purple" :
                  idx === 3 ? "neon-glow-green" :
                  idx === 4 ? "neon-glow-amber" : "neon-glow-blue"
                )}
              >
                <div>
                  <div className={cn("flex size-8 sm:size-9 items-center justify-center rounded-xl mb-3", card.iconBg)}>
                    {card.icon}
                  </div>
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground mb-1 truncate">{card.label}</p>
                  <p 
                    title={card.fullValue}
                    className="font-display text-lg sm:text-xl xl:text-2xl font-bold tabular-nums text-foreground truncate max-w-full"
                  >
                    {card.value}
                  </p>
                </div>
                <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground mt-3 truncate">
                  vs prev 7 days{" "}
                  <span className="text-success font-bold ml-1">{card.trend}</span>
                </p>
              </div>
            ))}
          </div>

          {/* ═══════ ROW 2: Daily Performance + Heatmap ═══════ */}
          <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
            {/* Daily Performance */}
            <Panel3D
              title="Daily Performance"
              className="neon-glow-green"
              info
              action={
                <div className="relative analytics-dropdown-container z-20">
                  <button 
                    onClick={() => setDailyDropdownOpen(!dailyDropdownOpen)}
                    className="flex items-center gap-1.5 text-[11px] text-foreground bg-muted/40 px-2.5 py-1 rounded-lg border border-border font-medium hover:bg-muted transition cursor-pointer"
                  >
                    {dailyMode}
                    <ChevronDown className="size-3 text-muted-foreground" />
                  </button>
                  {dailyDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-36 bg-surface border border-border rounded-xl shadow-2xl py-1 z-50">
                      {(["Cumulative PnL", "Daily PnL", "Trades Count"] as const).map(opt => (
                        <button
                          key={opt}
                          onClick={() => { setDailyMode(opt); setDailyDropdownOpen(false); }}
                          className="w-full text-left px-3.5 py-1.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground flex items-center justify-between cursor-pointer"
                        >
                          {opt}
                          {dailyMode === opt && <CheckCircle2 className="size-3 text-emerald-500" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              }
            >
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyPnl} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dailyGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="dailyRed" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="rgba(15,17,21,0.04)" />
                    <XAxis dataKey="label" {...axisProps} />
                    <YAxis {...axisProps} width={52} tickFormatter={(v: number) => dailyMode === "Trades Count" ? `${v}` : `$${(v / 1000).toFixed(1)}K`} />
                    <Tooltip {...ttStyle} formatter={(v: number) => [dailyMode === "Trades Count" ? `${v} trades` : money(v), dailyMode]} />
                    <Area
                      type="monotone"
                      dataKey={dailyMode === "Cumulative PnL" ? "cumPnl" : dailyMode === "Daily PnL" ? "pnl" : "count"}
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fill="url(#dailyGreen)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {/* Bottom stats */}
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Best Day</p>
                  <p className="text-sm font-bold text-foreground mt-1">{bestDay ? new Date(`${bestDay.date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "2-digit" }) : "—"}</p>
                  <p className="text-xs font-semibold text-success">{bestDay ? money(bestDay.pnl) : "$0"}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Worst Day</p>
                  <p className="text-sm font-bold text-foreground mt-1">{worstDay ? new Date(`${worstDay.date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "2-digit" }) : "—"}</p>
                  <p className="text-xs font-semibold text-danger">{worstDay ? money(worstDay.pnl) : "$0"}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Avg Daily PnL</p>
                  <p className="text-sm font-bold text-success mt-1">{money(avgDailyPnl)}</p>
                </div>
              </div>
            </Panel3D>

            {/* Performance Heatmap */}
            <Panel3D
              title="Performance Heatmap"
              className="neon-glow-purple"
              info
              action={
                <div className="relative analytics-dropdown-container z-20">
                  <button 
                    onClick={() => setHeatmapDropdownOpen(!heatmapDropdownOpen)}
                    className="flex items-center gap-1.5 text-[11px] text-foreground bg-muted/40 px-2.5 py-1 rounded-lg border border-border font-medium hover:bg-muted transition cursor-pointer"
                  >
                    {heatmapMode}
                    <ChevronDown className="size-3 text-muted-foreground" />
                  </button>
                  {heatmapDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-32 bg-surface border border-border rounded-xl shadow-2xl py-1 z-50">
                      {(["Win Rate %", "Net PnL $", "Trade Count"] as const).map(opt => (
                        <button
                          key={opt}
                          onClick={() => { setHeatmapMode(opt); setHeatmapDropdownOpen(false); }}
                          className="w-full text-left px-3.5 py-1.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground flex items-center justify-between cursor-pointer"
                        >
                          {opt}
                          {heatmapMode === opt && <CheckCircle2 className="size-3 text-[#10b981]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-center text-[11px]">
                  <thead>
                    <tr>
                      <th className="pb-2 text-zinc-600 font-medium"></th>
                      {heatmapData.blocks.map(b => (
                        <th key={b} className="pb-2 text-muted-foreground font-medium px-1">{b}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapData.days.map(day => (
                      <tr key={day}>
                        <td className="pr-2 py-1 text-muted-foreground font-medium text-left">{day}</td>
                        {heatmapData.blocks.map(block => {
                          const key = `${day}-${block}`;
                          const cell = heatmapData.map.get(key);
                          const wr = cell && cell.total > 0 ? Math.round((cell.wins / cell.total) * 100) : null;
                          let bg = "bg-zinc-800/30";
                          if (cell && cell.total > 0) {
                            if (heatmapMode === "Net PnL $") {
                              bg = cell.pnl >= 0 ? "bg-emerald-500/35" : "bg-rose-500/35";
                            } else if (heatmapMode === "Trade Count") {
                              bg = "bg-indigo-500/35";
                            } else {
                              if (wr! >= 80) bg = "bg-emerald-500/70";
                              else if (wr! >= 70) bg = "bg-emerald-500/50";
                              else if (wr! >= 60) bg = "bg-emerald-500/35";
                              else if (wr! >= 50) bg = "bg-emerald-600/25";
                              else if (wr! >= 40) bg = "bg-amber-500/30";
                              else bg = "bg-rose-500/35";
                            }
                          }
                          const displayVal = !cell || cell.total === 0 
                            ? "—" 
                            : heatmapMode === "Win Rate %" 
                            ? `${wr}%` 
                            : heatmapMode === "Net PnL $" 
                            ? money(cell.pnl) 
                            : `${cell.total}`;
                          return (
                            <td key={block} className="p-1">
                              <div className={cn(
                                "rounded-lg py-2 px-1 font-semibold transition-all text-[10.5px]",
                                bg,
                                cell && cell.total > 0 ? "text-foreground" : "text-muted-foreground"
                              )}>
                                {displayVal}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Legend */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border text-[10px] text-muted-foreground">
                <span>Lower Win Rate</span>
                <div className="flex gap-0.5">
                  <div className="w-6 h-2 rounded-sm bg-rose-500/50"></div>
                  <div className="w-6 h-2 rounded-sm bg-amber-500/40"></div>
                  <div className="w-6 h-2 rounded-sm bg-emerald-600/30"></div>
                  <div className="w-6 h-2 rounded-sm bg-emerald-500/50"></div>
                  <div className="w-6 h-2 rounded-sm bg-emerald-500/70"></div>
                </div>
                <span>Higher Win Rate</span>
              </div>
            </Panel3D>
          </div>

          {/* ═══════ ROW 3: Three Donuts ═══════ */}
          <div className="grid gap-5 lg:grid-cols-3">
            {/* Trades by Direction */}
            <Panel3D title="Trades by Direction" className="neon-glow-blue" info>
              <div className="flex items-center gap-4">
                <div className="relative w-[140px] h-[140px] flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={directionData} dataKey="value" innerRadius={42} outerRadius={62} paddingAngle={3} stroke="none">
                        {directionData.map(d => <Cell key={d.name} fill={d.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-xl font-bold text-foreground">{s.total}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Total</p>
                  </div>
                </div>
                <div className="flex-1 space-y-3 text-sm">
                  {[
                    { name: "Long", count: userTrades.filter(t => t.side === "Buy").length, color: "#10b981" },
                    { name: "Short", count: userTrades.filter(t => t.side === "Sell").length, color: "#ef4444" },
                    { name: "Breakeven", count: 0, color: "#71717a" },
                  ].map(item => (
                    <div key={item.name} className="flex items-center gap-2.5">
                      <div className="size-2.5 rounded-full" style={{ background: item.color }}></div>
                      <span className="text-foreground text-[12px]">{item.name}</span>
                      <span className="ml-auto text-muted-foreground text-[12px] font-medium tabular-nums">
                        {item.count} ({s.total > 0 ? ((item.count / s.total) * 100).toFixed(1) : "0.0"}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel3D>

            {/* Trades by Time of Day */}
            <Panel3D title="Trades by Time of Day" className="neon-glow-amber" info>
              <div className="flex items-center gap-4">
                <div className="relative w-[140px] h-[140px] flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={timeData.filter(d => d.value > 0)} dataKey="value" innerRadius={42} outerRadius={62} paddingAngle={2} stroke="none">
                        {timeData.filter(d => d.value > 0).map(d => <Cell key={d.name} fill={d.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2 text-sm">
                  {timeData.map(item => (
                    <div key={item.name} className="flex items-center gap-2.5">
                      <div className="size-2.5 rounded-full" style={{ background: item.color }}></div>
                      <span className="text-foreground text-[12px]">{item.name}</span>
                      <span className="ml-auto text-muted-foreground text-[12px] font-medium tabular-nums">
                        {item.value} ({s.total > 0 ? ((item.value / s.total) * 100).toFixed(1) : "0.0"}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel3D>

            {/* Risk:Reward Distribution */}
            <Panel3D title="Risk:Reward Distribution" className="neon-glow-green" info>
              <div className="flex items-center gap-4">
                <div className="relative w-[140px] h-[140px] flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={rrData} dataKey="value" innerRadius={42} outerRadius={62} paddingAngle={3} stroke="none">
                        {rrData.map(d => <Cell key={d.name} fill={d.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-xl font-bold text-foreground">{s.total}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Total</p>
                  </div>
                </div>
                <div className="flex-1 space-y-3 text-sm">
                  {[
                    { name: "0-1R", color: "#ef4444" },
                    { name: "1-2R", color: "#f59e0b" },
                    { name: "2-3R", color: "#10b981" },
                    { name: "3R+", color: "#3b82f6" },
                  ].map(item => {
                    const count = rrData.find(d => d.name === item.name)?.value || 0;
                    return (
                      <div key={item.name} className="flex items-center gap-2.5">
                        <div className="size-2.5 rounded-full" style={{ background: item.color }}></div>
                        <span className="text-foreground text-[12px]">{item.name}</span>
                        <span className="ml-auto text-muted-foreground text-[12px] font-medium tabular-nums">
                          {count} ({s.total > 0 ? ((count / s.total) * 100).toFixed(1) : "0.0"}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Panel3D>
          </div>

          {/* ═══════ ROW 4: Streak + Monthly Overview ═══════ */}
          <div className="grid gap-5 lg:grid-cols-[1fr_1.5fr]">
            {/* Streak Analysis — MAIN FIXED BOX */}
            <Panel3D title="Streak Analysis" className="neon-glow-purple flex flex-col justify-between h-full" info>
              <div className="flex flex-col justify-between h-full space-y-3 py-1">
                {/* BOX 1: 3 Metric Boxes */}
                <div className="grid grid-cols-3 gap-2.5 w-full">
                  <div className="rounded-xl border border-border bg-muted/40 p-2.5 text-center flex flex-col justify-center items-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Longest Win Streak</p>
                    <p className="text-xs sm:text-sm font-bold text-emerald-400 mt-1 flex items-center justify-center gap-1">
                      <Flame className="size-3.5 fill-emerald-500/20 text-emerald-400 shrink-0" />
                      <span>{longestStreaks.win} trades</span>
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/40 p-2.5 text-center flex flex-col justify-center items-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Longest Loss Streak</p>
                    <p className="text-xs sm:text-sm font-bold text-rose-400 mt-1 flex items-center justify-center gap-1">
                      <Flame className="size-3.5 fill-rose-500/20 text-rose-400 shrink-0" />
                      <span>{longestStreaks.loss} trades</span>
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/40 p-2.5 text-center flex flex-col justify-center items-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Current Streak</p>
                    <p className={cn("text-xs sm:text-sm font-bold mt-1 flex items-center justify-center gap-1", currentStreak.type === "wins" ? "text-emerald-400" : "text-rose-400")}>
                      <Flame className={cn("size-3.5 shrink-0", currentStreak.type === "wins" ? "fill-emerald-500/20 text-emerald-400" : "fill-rose-500/20 text-rose-400")} />
                      <span>{currentStreak.count} {currentStreak.type}</span>
                    </p>
                  </div>
                </div>

                {/* BOX 2: Clean 11-Result Circular Badges Box (No Title, No Text, Exactly 11 W/L Badges) */}
                <div className="rounded-xl border border-border/70 bg-muted/30 p-2.5 flex items-center justify-center w-full min-h-[52px]">
                  <div className="flex flex-nowrap items-center justify-center gap-1.5 sm:gap-2 w-full overflow-hidden">
                    {recentResults.map((r, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all shadow-sm",
                          r === "Win"
                            ? "bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                            : "bg-rose-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                        )}
                      >
                        {r === "Win" ? "W" : "L"}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Panel3D>

            {/* Monthly Overview */}
            <Panel3D
              title="Monthly Overview"
              className="neon-glow-blue"
              info
              action={
                <div className="relative analytics-dropdown-container z-20">
                  <button 
                    onClick={() => setMonthlyDropdownOpen(!monthlyDropdownOpen)}
                    className="flex items-center gap-1.5 text-[11px] text-foreground bg-muted/40 px-2.5 py-1 rounded-lg border border-border font-semibold hover:bg-muted transition cursor-pointer"
                  >
                    {monthlyYear}
                    <ChevronDown className="size-3 text-muted-foreground" />
                  </button>
                  {monthlyDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-32 bg-surface border border-border rounded-xl shadow-2xl py-1 z-50">
                      {(["2026", "2025", "All Time"] as const).map(opt => (
                        <button
                          key={opt}
                          onClick={() => { setMonthlyYear(opt); setMonthlyDropdownOpen(false); }}
                          className="w-full text-left px-3.5 py-1.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground flex items-center justify-between cursor-pointer"
                        >
                          {opt}
                          {monthlyYear === opt && <CheckCircle2 className="size-3 text-emerald-500" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              }
            >
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="flex-1 h-[210px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyBars} margin={{ left: -10, right: 4, top: 8, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="label" {...axisProps} interval={0} tick={{ fontSize: 10, fill: '#cbd5e1' }} />
                      <YAxis {...axisProps} width={50} tick={{ fontSize: 10, fill: '#cbd5e1' }} tickFormatter={(v: number) => {
                        if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(0)}K`;
                        return `$${v}`;
                      }} />
                      <Tooltip 
                        {...ttStyle} 
                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: 6 }} 
                        formatter={(v: number) => [money(v), "PnL"]} 
                      />
                      <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                        {monthlyBars.map((m, i) => (
                          <Cell 
                            key={i} 
                            fill={m.pnl > 0 ? "#10b981" : m.pnl < 0 ? "#f43f5e" : "rgba(255,255,255,0.08)"} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Side stats */}
                <div className="w-full sm:w-[150px] flex-shrink-0 space-y-4 text-right pt-1 border-t sm:border-t-0 sm:border-l border-border/60 sm:pl-4">
                  <div>
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="size-2 rounded-full bg-emerald-400"></div>
                      <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Total PnL</p>
                    </div>
                    <p className={cn("text-xl font-bold mt-1", totalPnl >= 0 ? "text-emerald-400" : "text-rose-400")}>{money(totalPnl)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Best Month</p>
                    <p className="text-xs text-foreground font-medium mt-0.5">{bestMonth?.label || "—"} {bestMonth?.name ? bestMonth.name.slice(0, 4) : ""}</p>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">{bestMonth ? money(bestMonth.pnl) : "$0"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Worst Month</p>
                    <p className="text-xs text-foreground font-medium mt-0.5">{worstMonth?.label || "—"} {worstMonth?.name ? worstMonth.name.slice(0, 4) : ""}</p>
                    <p className="text-sm font-bold text-rose-400 mt-0.5">{worstMonth ? money(worstMonth.pnl) : "$0"}</p>
                  </div>
                </div>
              </div>
            </Panel3D>
          </div>

        </div>
      )}
    </AppShell>
  );
}
