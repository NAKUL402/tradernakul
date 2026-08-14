// Dashboard — Exact Reference Match Replica
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/app/AppShell";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Brain,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Filter,
  HelpCircle,
  Info,
  Lock,
  Percent,
  Plus,
  Scale,
  Shield,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Wallet,
  Zap,
} from "lucide-react";
import {
  equityCurve,
  fetchUserTrades,
  money,
  compactMoney,
  formatProfitFactor,
  pct,
  pnlUsd,
  stats,
  aggregateTradePatterns,
  sortTradesNewestFirst,
  type Trade,
} from "@/lib/trades";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Edge Journal" },
      {
        name: "description",
        content:
          "Track, analyze and improve your trading with AI-powered analytics, equity curves and performance insights.",
      },
      { property: "og:title", content: "Dashboard — Edge Journal" },
      {
        property: "og:description",
        content:
          "Track, analyze and improve your trading with AI-powered analytics, equity curves and performance insights.",
      },
    ],
  }),
  component: Dashboard,
});

/* ─── Recharts Tooltip Style ─── */
const tooltipStyle = {
  contentStyle: {
    background: "#0d111c",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: 12,
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
  tick: { fill: "#94a3b8", fontSize: 11, fontWeight: 500 },
} as const;

function Dashboard() {
  const navigate = useNavigate();
  const [userTrades, setUserTrades] = useState<Trade[]>([]);
  const [timeframe, setTimeframe] = useState<"1D" | "1W" | "1M" | "3M" | "1Y" | "ALL">("1W");

  useEffect(() => {
    fetchUserTrades().then((data) => setUserTrades(data));
  }, []);

  const s = useMemo(() => stats(userTrades), [userTrades]);

  // 7-day trend calculation
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

  const patternSummary = useMemo(() => aggregateTradePatterns(userTrades), [userTrades]);

  function trendPct(current: number, previous: number): string {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const diff = ((current - previous) / Math.abs(previous)) * 100;
    return `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`;
  }

  // 1. Top 6 Metric Cards
  const topMetrics = [
    {
      icon: <Activity className="size-4 text-purple-400" />,
      iconBg: "bg-purple-500/10 border-purple-500/20",
      label: "Total Trades",
      value: String(s.total),
      trend: `vs prev 7 days = ${trendPct(prev7.rs.total, prev7.ps.total)}`,
      glow: "neon-glow-purple",
    },
    {
      icon: <Target className="size-4 text-blue-400" />,
      iconBg: "bg-blue-500/10 border-blue-500/20",
      label: "Win Rate",
      value: pct(s.winRate),
      trend: `vs prev 7 days = ${trendPct(prev7.rs.winRate, prev7.ps.winRate)}`,
      glow: "neon-glow-blue",
    },
    {
      icon: <Percent className="size-4 text-blue-400" />,
      iconBg: "bg-blue-500/10 border-blue-500/20",
      label: "Profit Factor",
      value: formatProfitFactor(s.profitFactor),
      trend: `vs prev 7 days = ${trendPct(prev7.rs.profitFactor, prev7.ps.profitFactor)}`,
      glow: "neon-glow-blue",
    },
    {
      icon: <Wallet className="size-4 text-emerald-400" />,
      iconBg: "bg-emerald-500/10 border-emerald-500/20",
      label: "Net PnL",
      value: Math.abs(s.net) >= 1_000_000 ? compactMoney(s.net) : money(s.net),
      fullValue: money(s.net),
      valueColor: s.net >= 0 ? "text-emerald-400" : "text-rose-400",
      trend: `vs prev 7 days = ${trendPct(prev7.rs.net, prev7.ps.net)}`,
      glow: "neon-glow-green",
    },
    {
      icon: <Scale className="size-4 text-purple-400" />,
      iconBg: "bg-purple-500/10 border-purple-500/20",
      label: "Avg Risk:Reward",
      value: `1:${s.avgRRR ? s.avgRRR.toFixed(2) : "0.00"}`,
      trend: `vs prev 7 days = ${trendPct(prev7.rs.avgRRR || 0, prev7.ps.avgRRR || 0)}`,
      glow: "neon-glow-purple",
    },
    {
      icon: <Trophy className="size-4 text-yellow-400" />,
      iconBg: "bg-yellow-500/10 border-yellow-500/20",
      label: "Win Streak",
      value: `${s.winStreak} ${s.winStreak === 1 ? "trade" : "trades"}`,
      valueColor: "text-emerald-400",
      trend: `vs prev 7 days = ${trendPct(s.winStreak, 0)}`,
      glow: "neon-glow-amber",
    },
  ];

  // Performance Overview Chart Data (Filtered by timeframe)
  const chartData = useMemo(() => {
    let filteredTrades = userTrades;
    if (timeframe !== "ALL") {
      const now = new Date();
      const cutoff = new Date();
      switch (timeframe) {
        case "1D": cutoff.setDate(now.getDate() - 1); break;
        case "1W": cutoff.setDate(now.getDate() - 7); break;
        case "1M": cutoff.setMonth(now.getMonth() - 1); break;
        case "3M": cutoff.setMonth(now.getMonth() - 3); break;
        case "1Y": cutoff.setFullYear(now.getFullYear() - 1); break;
      }
      filteredTrades = userTrades.filter(t => new Date(t.date) >= cutoff);
    }

    if (filteredTrades.length === 0) {
      return [
        { date: "No data", pnl: 0, cumulative: 0 },
      ];
    }
    const sorted = [...filteredTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let cum = 0;
    return sorted.map((t) => {
      cum += pnlUsd(t);
      const d = new Date(t.date);
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const label = `${monthNames[d.getUTCMonth()]} ${d.getUTCDate()}`;
      return {
        date: label,
        pnl: pnlUsd(t),
        cumulative: cum,
      };
    });
  }, [userTrades, timeframe]);

  // Daily stats for performance overview card bottom
  const bestTrade = useMemo(() => {
    if (userTrades.length === 0) return null;
    return userTrades.reduce((max, t) => (pnlUsd(t) > (max ? pnlUsd(max) : -Infinity) ? t : max), userTrades[0]);
  }, [userTrades]);

  const worstTrade = useMemo(() => {
    if (userTrades.length === 0) return null;
    const losses = userTrades.filter(t => pnlUsd(t) < 0);
    if (losses.length === 0) return null;
    return losses.reduce((min, t) => (pnlUsd(t) < (min ? pnlUsd(min) : Infinity) ? t : min), losses[0]);
  }, [userTrades]);

  const avgDailyPnl = useMemo(() => {
    if (userTrades.length === 0) return 0;
    return Math.round(s.net / Math.max(1, chartData.length));
  }, [s.net, userTrades, chartData]);

  // Donut 1: Win vs Loss
  const winLossDonut = useMemo(() => {
    return [
      { name: "Wins", value: s.wins, color: "#10b981" },
      { name: "Losses", value: s.losses, color: "#f43f5e" },
      { name: "Breakeven", value: 0, color: "#71717a" },
    ].filter(d => s.total > 0 ? d.value >= 0 : d.value > 0);
  }, [s]);

  // Donut 2: Trades by Direction
  const longCount = useMemo(() => userTrades.filter(t => t.side === "Buy").length, [userTrades]);
  const shortCount = useMemo(() => userTrades.filter(t => t.side === "Sell").length, [userTrades]);
  const longPct = s.total > 0 ? (longCount / s.total) * 100 : 0;
  const shortPct = s.total > 0 ? (shortCount / s.total) * 100 : 0;

  const directionDonut = useMemo(() => {
    return [
      { name: "Long", value: longCount || (s.total === 0 ? 1 : 0), color: "#10b981" },
      { name: "Short", value: shortCount, color: "#f43f5e" },
    ];
  }, [longCount, shortCount, s.total]);

  const timeOfDayData = useMemo(() => {
    const bins = [
      { name: "12AM", count: 0 },
      { name: "4AM", count: 0 },
      { name: "8AM", count: 0 },
      { name: "12PM", count: 0 },
      { name: "4PM", count: 0 },
      { name: "8PM", count: 0 },
    ];
    if (s.total === 0) return bins;

    userTrades.forEach(t => {
      if (!t.entryTime) return;
      const hour = parseInt(t.entryTime.split(":")[0] || "0", 10);
      if (hour >= 0 && hour < 4) bins[0].count++;
      else if (hour >= 4 && hour < 8) bins[1].count++;
      else if (hour >= 8 && hour < 12) bins[2].count++;
      else if (hour >= 12 && hour < 16) bins[3].count++;
      else if (hour >= 16 && hour < 20) bins[4].count++;
      else bins[5].count++;
    });
    return bins;
  }, [userTrades, s.total]);

  // Recent Trade item (last trade - newest first)
  const lastTrade = useMemo(() => {
    const sorted = sortTradesNewestFirst(userTrades);
    return sorted.length > 0 ? sorted[0] : null;
  }, [userTrades]);

  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [dateRangeLabel, setDateRangeLabel] = useState("Aug 07, 2025 – Aug 13, 2025");

  const customHeader = (
    <div className="flex items-center gap-2.5">
      <div className="relative">
        <button 
          type="button"
          onClick={() => setDateRangeOpen(!dateRangeOpen)}
          className="flex items-center gap-2 text-[12px] text-foreground bg-surface px-3 py-1.5 rounded-xl border border-border font-medium hover:bg-muted transition cursor-pointer"
        >
          <span className="text-muted-foreground">📅</span>
          <span>{dateRangeLabel}</span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </button>
        {dateRangeOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-2xl py-1 z-[60] overflow-hidden">
            {[
              "Aug 07, 2025 – Aug 13, 2025",
              "Last 7 Days",
              "Last 30 Days",
              "Last 90 Days",
              "This Month",
              "This Week",
              "All Time"
            ].map(lbl => (
              <button
                key={lbl}
                onClick={() => { setDateRangeLabel(lbl); setDateRangeOpen(false); }}
                className="w-full text-left px-3.5 py-2 text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground flex items-center justify-between cursor-pointer"
              >
                {lbl}
              </button>
            ))}
          </div>
        )}
      </div>

      <button 
        type="button"
        onClick={() => navigate({ to: "/journal" })}
        title="Open Journal Filters"
        aria-label="Filter"
        className="flex items-center justify-center size-8 rounded-xl border border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
      >
        <Filter className="size-3.5" />
      </button>
    </div>
  );

  return (
    <AppShell 
      title="Welcome back," 
      subtitle="Track your edge. Build your freedom."
      headerAction={customHeader}
    >
      <div className="space-y-4 pb-12 w-full">

        {/* ═══════ ROW 1: 6 Top Metric Cards ═══════ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {topMetrics.map((card) => (
            <div
              key={card.label}
              className={cn(
                "neon-card p-3.5 sm:p-4 flex flex-col justify-between min-w-0 overflow-hidden transition-all duration-200",
                card.glow
              )}
            >
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn("flex size-7 items-center justify-center rounded-lg border", card.iconBg)}>
                    {card.icon}
                  </div>
                  <p className="text-[11px] font-bold text-muted-foreground truncate">{card.label}</p>
                </div>
                <p 
                  title={card.fullValue || card.value}
                  className={cn(
                    "font-display text-xl sm:text-2xl font-bold tabular-nums truncate max-w-full",
                    card.valueColor || "text-foreground"
                  )}
                >
                  {card.value}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-3 font-medium truncate">{card.trend}</p>
            </div>
          ))}
        </div>

        {/* ═══════ MAIN 2-COLUMN GRID (Left ~65%, Right ~35%) ═══════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full items-start">
          
          {/* ────────────────── LEFT COLUMN (Chart + 2 Donuts + AI Insights) ────────────────── */}
          <div className="lg:col-span-8 space-y-4 w-full">
            
            {/* 1. Performance Overview Chart Card */}
            <div className="neon-card neon-glow-green p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-bold text-foreground">Performance Overview</h2>
                  <Info className="size-3.5 text-muted-foreground cursor-pointer" />
                </div>
                {/* Time range buttons */}
                <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/40 text-[11px]">
                  {(["1D", "1W", "1M", "3M", "1Y", "ALL"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTimeframe(t)}
                      className={cn(
                        "px-2.5 py-1 rounded-md font-bold transition cursor-pointer",
                        timeframe === t
                          ? "bg-card text-foreground shadow-sm border border-border/60"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart */}
              <div className="h-[220px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ left: -15, right: 15, top: 20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dashboardGreenGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" {...axisProps} />
                    <YAxis {...axisProps} tickFormatter={(v) => `$${v >= 1000 ? `${v/1000}K` : v}`} />
                    <Tooltip {...tooltipStyle} formatter={(val: any) => [money(Number(val)), "Cumulative PnL"]} />
                    <Area
                      type="monotone"
                      dataKey="cumulative"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fill="url(#dashboardGreenGrad)"
                      dot={{ r: 3.5, fill: "#10b981", strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: "#10b981", stroke: "#ffffff", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Bottom 4 KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 mt-2 border-t border-border/50 text-center sm:text-left">
                <div>
                  <p className="text-[10.5px] text-muted-foreground font-medium">Best Day</p>
                  <p className="text-xs font-bold text-emerald-400 mt-0.5 truncate">
                    {bestTrade ? `${bestTrade.date.slice(5)} ${money(pnlUsd(bestTrade))}` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[10.5px] text-muted-foreground font-medium">Worst Day</p>
                  <p className={cn("text-xs font-bold mt-0.5 truncate", worstTrade ? "text-rose-400" : "text-muted-foreground")}>
                    {worstTrade ? `${worstTrade.date.slice(5)} ${money(pnlUsd(worstTrade))}` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[10.5px] text-muted-foreground font-medium">Avg Daily PnL</p>
                  <p className={cn("text-xs font-bold mt-0.5 truncate", avgDailyPnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
                    {money(avgDailyPnl)}
                  </p>
                </div>
                <div>
                  <p className="text-[10.5px] text-muted-foreground font-medium">Total PnL</p>
                  <p className={cn("text-xs font-bold mt-0.5 truncate", s.net >= 0 ? "text-emerald-400" : "text-rose-400")}>
                    {money(s.net)}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Donut Charts Row (Win vs Loss + Trades by Direction) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Card 1: Win vs Loss */}
              <div className="neon-card neon-glow-green p-4 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 mb-2">
                  <h3 className="text-xs font-bold text-foreground">Win vs Loss</h3>
                  <Info className="size-3 text-muted-foreground cursor-pointer" />
                </div>
                <div className="flex items-center justify-between gap-4 my-2">
                  {/* Circular donut */}
                  <div className="relative size-28 shrink-0 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={winLossDonut}
                          dataKey="value"
                          innerRadius={36}
                          outerRadius={50}
                          paddingAngle={3}
                          stroke="none"
                        >
                          {winLossDonut.map((d, i) => (
                            <Cell key={i} fill={d.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-sm font-bold text-foreground">{s.total}</span>
                      <span className="text-[9px] text-muted-foreground font-medium">Total</span>
                    </div>
                  </div>
                  {/* Legend list */}
                  <div className="space-y-2 flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="size-2 rounded-full bg-emerald-500"></span> Wins
                      </span>
                      <span className="font-bold text-foreground">{s.wins} ({pct(s.winRate)})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="size-2 rounded-full bg-rose-500"></span> Losses
                      </span>
                      <span className="font-bold text-foreground">{s.losses} ({pct(s.total > 0 ? (s.losses / s.total) * 100 : 0)})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="size-2 rounded-full bg-zinc-500"></span> Breakeven
                      </span>
                      <span className="font-bold text-foreground">0 (0.0%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Trades by Direction */}
              <div className="neon-card neon-glow-green p-4 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 mb-2">
                  <h3 className="text-xs font-bold text-foreground">Trades by Direction</h3>
                  <Info className="size-3 text-muted-foreground cursor-pointer" />
                </div>
                <div className="flex items-center justify-between gap-4 my-2">
                  {/* Circular donut */}
                  <div className="relative size-28 shrink-0 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={directionDonut}
                          dataKey="value"
                          innerRadius={36}
                          outerRadius={50}
                          paddingAngle={3}
                          stroke="none"
                        >
                          {directionDonut.map((d, i) => (
                            <Cell key={i} fill={d.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-sm font-bold text-foreground">{s.total}</span>
                      <span className="text-[9px] text-muted-foreground font-medium">Total</span>
                    </div>
                  </div>
                  {/* Legend list */}
                  <div className="space-y-2 flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="size-2 rounded-full bg-emerald-500"></span> Long
                      </span>
                      <span className="font-bold text-foreground">{longCount} ({pct(longPct)})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="size-2 rounded-full bg-rose-500"></span> Short
                      </span>
                      <span className="font-bold text-foreground">{shortCount} ({pct(shortPct)})</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* 3. AI Insights (4 Cards in a row) */}
            <div className="neon-card neon-glow-purple p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <h3 className="text-xs font-bold text-foreground">AI Insights</h3>
                <Info className="size-3 text-muted-foreground cursor-pointer" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                
                {/* Insight Card 1 - TIP */}
                <Link to="/ai-coach" search={{ chat: false }} className="bg-card/70 border border-border/70 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/40 transition group cursor-pointer h-full">
                  <div className="flex items-center gap-1.5 mb-2 text-purple-400">
                    <Sparkles className="size-3.5 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">TIP</span>
                  </div>
                  <div className="mt-auto pt-1">
                    <p className="text-xs font-bold text-foreground leading-tight">Build Your Data</p>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                      {s.total < 3
                        ? `Log at least 3 trades to unlock AI insights. You have ${s.total} trade logged.`
                        : `AI analyzed ${s.total} trades. Maintain your edge and risk limits.`}
                    </p>
                  </div>
                </Link>

                {/* Insight Card 2 - STRENGTH */}
                <Link to="/analytics" className="bg-card/40 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/40 transition group cursor-pointer h-full">
                  <div className="flex items-center gap-1.5 mb-2 text-emerald-400">
                    <Target className="size-3.5 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">STRENGTH</span>
                  </div>
                  <div className="mt-auto pt-1">
                    <p className="text-xs font-bold text-foreground leading-tight">{s.winRate >= 50 ? "Great Start!" : "Consistent Logger"}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                      {s.winRate >= 50
                        ? "You're off to a great start. Keep tracking and stay consistent."
                        : "Tracking your trades is the first step to building a winning edge."}
                    </p>
                  </div>
                </Link>

                {/* Insight Card 3 - FOCUS AREA */}
                <Link to="/analytics" className="bg-card/40 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/40 transition group cursor-pointer h-full">
                  <div className="flex items-center gap-1.5 mb-2 text-amber-500">
                    <Shield className="size-3.5 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">FOCUS AREA</span>
                  </div>
                  <div className="mt-auto pt-1">
                    <p className="text-xs font-bold text-foreground leading-tight">Risk Management</p>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                      {s.avgRRR >= 2
                        ? "Your average R:R is excellent. Ensure you don't over-leverage."
                        : "Consider refining your risk management strategy to target higher R:R."}
                    </p>
                  </div>
                </Link>

                {/* Insight Card 4 - OPPORTUNITY */}
                <Link to="/journal" className="bg-card/40 border border-border/40 rounded-xl p-3 flex flex-col justify-between hover:bg-muted/40 transition group cursor-pointer h-full">
                  <div className="flex items-center gap-1.5 mb-2 text-blue-400">
                    <Clock className="size-3.5 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">OPPORTUNITY</span>
                  </div>
                  <div className="mt-auto pt-1">
                    <p className="text-xs font-bold text-foreground leading-tight">Scale Your Edge</p>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                      {patternSummary?.bestSetup?.name
                        ? `Look for high-probability ${patternSummary.bestSetup.name} setups to grow.`
                        : "Look for high-probability setups to grow your account."}
                    </p>
                  </div>
                </Link>

              </div>
            </div>

          </div>

          {/* ────────────────── RIGHT COLUMN (Recent Trade, Breakdown, Time of Day, Quick Actions) ────────────────── */}
          <div className="lg:col-span-4 space-y-4 w-full">
            
            {/* 1. Recent Trades Card */}
            <div className="neon-card neon-glow-blue p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-foreground">Recent Trades</h3>
                <Link to="/journal" className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition">
                  View all
                </Link>
              </div>

              {lastTrade ? (
                <div className="bg-card/80 border border-border/70 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">W/C {lastTrade.date.slice(5)}</span>
                    <span className="text-[11px] text-muted-foreground">{lastTrade.date}</span>
                  </div>
                  <div>
                    <p className={cn("text-xs font-bold", pnlUsd(lastTrade) >= 0 ? "text-emerald-400" : "text-rose-400")}>
                      {lastTrade.result} • {money(pnlUsd(lastTrade))}
                    </p>
                  </div>
                  <div className="grid grid-cols-5 gap-1 pt-2 border-t border-border/40 text-[10.5px] text-center sm:text-left">
                    <div>
                      <p className="text-muted-foreground text-[9.5px]">Pair</p>
                      <p className="font-bold text-foreground truncate">{lastTrade.pair}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[9.5px]">Lots</p>
                      <p className="font-bold text-foreground">{lastTrade.lotSize || "1"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[9.5px]">Entry</p>
                      <p className="font-bold text-foreground truncate">{lastTrade.entryPrice || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[9.5px]">Exit</p>
                      <p className="font-bold text-foreground truncate">{lastTrade.exitPrice || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[9.5px]">R:R</p>
                      <p className="font-bold text-foreground truncate">{lastTrade.rrr || "1:2"}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  <p>No trades logged yet.</p>
                  <Link to="/journal" search={{ openModal: true }} className="inline-block mt-2 text-primary font-bold hover:underline">
                    Log your first trade
                  </Link>
                </div>
              )}
            </div>

            {/* 2. Performance Breakdown Card */}
            <div className="neon-card neon-glow-green p-4 space-y-2.5">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold text-foreground">Performance Breakdown</h3>
                <Info className="size-3 text-muted-foreground cursor-pointer" />
              </div>
              <div className="space-y-2 pt-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="text-emerald-400 font-bold">%</span> Winning Trades
                  </span>
                  <span className="font-bold text-emerald-400">{s.wins} ({pct(s.winRate)})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="text-rose-400 font-bold">%</span> Losing Trades
                  </span>
                  <span className="font-bold text-rose-400">{s.losses} ({pct(s.total > 0 ? (s.losses / s.total) * 100 : 0)})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="text-zinc-400 font-bold">○</span> Breakeven Trades
                  </span>
                  <span className="font-bold text-muted-foreground">0 (0.0%)</span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-border/40">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Activity className="size-3.5 text-blue-400" /> Total Trades
                  </span>
                  <span className="font-bold text-foreground">{s.total}</span>
                </div>
              </div>
            </div>

            {/* 3. Trades by Time of Day Card */}
            <div className="neon-card neon-glow-blue p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <h3 className="text-xs font-bold text-foreground">Trades by Time of Day</h3>
                <Info className="size-3 text-muted-foreground cursor-pointer" />
              </div>
              <div className="h-[120px] w-full mt-2">
                {s.total > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timeOfDayData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: "#71717a", fontSize: 9, fontWeight: 500 }} 
                        dy={8}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: "#71717a", fontSize: 9, fontWeight: 500 }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.03)" }}
                        contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "8px", fontSize: "11px" }}
                        formatter={(val: any) => [`${val} trades`, "Count"]}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="#10b981" 
                        radius={[2, 2, 0, 0]}
                        maxBarSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    <Clock className="size-4 opacity-50 mr-2" />
                    Not enough data yet
                  </div>
                )}
              </div>
            </div>

            {/* 4. Quick Actions Card (2x2 Grid with Analytics Added!) */}
            <div className="neon-card neon-glow-purple p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-foreground">Quick Actions</h3>
                <Zap className="size-3.5 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                
                {/* Action 1: New Trade */}
                <Link
                  to="/journal"
                  search={{ openModal: true }}
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new CustomEvent("open_log_trade_modal"));
                    }
                  }}
                  className="neon-card p-2.5 flex items-center gap-2 text-left transition-all hover:bg-muted/40 cursor-pointer group neon-glow-blue min-w-0 overflow-hidden"
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform">
                    <Plus className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-foreground leading-tight truncate">New Trade</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5 truncate">Log a new trade</p>
                  </div>
                </Link>

                {/* Action 2: View Reports */}
                <Link
                  to="/reports"
                  className="neon-card p-2.5 flex items-center gap-2 text-left transition-all hover:bg-muted/40 cursor-pointer group neon-glow-purple min-w-0 overflow-hidden"
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-400 group-hover:scale-105 transition-transform">
                    <FileText className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-foreground leading-tight truncate">View Reports</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5 truncate">Detailed performance</p>
                  </div>
                </Link>

                {/* Action 3: AI Coach */}
                <Link
                  to="/ai-coach"
                  search={{ chat: false }}
                  className="neon-card p-2.5 flex items-center gap-2 text-left transition-all hover:bg-muted/40 cursor-pointer group neon-glow-green min-w-0 overflow-hidden"
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
                    <Brain className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-foreground leading-tight truncate">AI Coach</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5 truncate">Get AI insights</p>
                  </div>
                </Link>

                {/* Action 4 (CHANGE #2): Analytics */}
                <Link
                  to="/analytics"
                  className="neon-card p-2.5 flex items-center gap-2 text-left transition-all hover:bg-muted/40 cursor-pointer group neon-glow-blue min-w-0 overflow-hidden"
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform">
                    <BarChart3 className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-foreground leading-tight truncate">Analytics</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5 truncate">Deep performance edge</p>
                  </div>
                </Link>

              </div>
            </div>

          </div>

        </div>

      </div>
    </AppShell>
  );
}
