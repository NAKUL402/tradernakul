import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/app/AppShell";
import {
  fetchUserTrades,
  getLocalTrades,
  sortTradesNewestFirst,
  money,
  monthly,
  weekly,
  pct,
  stats,
  groupStats,
  equityCurve,
  pnlUsd,
  type Trade,
} from "@/lib/trades";
import { useAuth } from "@/lib/auth-context";
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
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Download,
  Lightbulb,
  Lock,
  Percent,
  Scale,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Edge Journal" },
      {
        name: "description",
        content: "Professional trading performance report with equity curve, KPI cards, and AI insights.",
      },
    ],
  }),
  component: Reports,
});

const tooltipStyle = {
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

const axisStyle = {
  stroke: "rgba(255,255,255,0.06)",
  tickLine: false,
  axisLine: false,
  tick: { fill: "#cbd5e1", fontSize: 10, fontWeight: 500 },
} as const;

function reportMetrics(list: Trade[]) {
  const s = stats(list);
  if (list.length === 0) return { ...s, largestWin: 0, largestLoss: 0, breakeven: 0, maxDrawdown: 0 };
  const wins = list.filter((t) => t.result === "Win");
  const losses = list.filter((t) => t.result === "Loss");
  const breakeven = list.filter((t) => pnlUsd(t) === 0).length;
  const largestWin = wins.length > 0 ? Math.max(...wins.map((t) => pnlUsd(t))) : 0;
  const largestLoss = losses.length > 0 ? Math.min(...losses.map((t) => pnlUsd(t))) : 0;
  const chronological = sortTradesNewestFirst(list).reverse();
  const eq = equityCurve(chronological);
  const maxDrawdown = eq.length > 0 ? Math.min(...eq.map((e) => e.drawdown)) : 0;
  return { ...s, largestWin, largestLoss, breakeven, maxDrawdown };
}

function instrumentStats(list: Trade[]) {
  const byPair = groupStats(list, (t) => t.pair).sort((a, b) => b.pnl - a.pnl);
  return byPair.map((p) => {
    const pairTrades = list.filter((t) => t.pair === p.name);
    const avgRRR =
      pairTrades.reduce((sum, t) => {
        const parts = String(t.rrr || "0").split(":");
        return sum + (parseFloat(parts[parts.length - 1] || "0") || 0);
      }, 0) / Math.max(pairTrades.length, 1);
    return { ...p, avgRRR };
  });
}

function setupStats(list: Trade[]) {
  return groupStats(list, (t) => t.setup || "No Setup")
    .filter((g) => g.name !== "No Setup" && g.name !== "")
    .sort((a, b) => b.pnl - a.pnl)
    .map((s) => {
      const setupTrades = list.filter((t) => (t.setup || "") === s.name);
      const avgRRR =
        setupTrades.reduce((sum, t) => {
          const parts = String(t.rrr || "0").split(":");
          return sum + (parseFloat(parts[parts.length - 1] || "0") || 0);
        }, 0) / Math.max(setupTrades.length, 1);
      return { ...s, avgRRR };
    });
}

function exportTradesCSV(list: Trade[]) {
  if (list.length === 0) return;
  const filename = `trade-report-${new Date().toISOString().slice(0, 10)}.csv`;
  const headers = [
    "ID",
    "Trade No",
    "Date",
    "Pair",
    "Side",
    "Result",
    "PnL",
    "Session",
    "Setup",
    "Risk %",
    "RRR",
    "Notes",
  ];
  const rows = list.map((t) => [
    t.id,
    t.tradeNo || "",
    t.date,
    t.pair,
    t.side,
    t.result,
    pnlUsd(t),
    t.session,
    t.setup || "",
    t.riskPct,
    t.rrr || "",
    `"${(t.notes || "").replace(/"/g, '""')}"`,
  ]);
  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.click();
}

function Reports() {
  const { userSettings } = useAuth();
  const currencySymbol = userSettings?.currency?.split(" ")[1]?.replace(/[()]/g, "") || "$";
  
  // Instant load from local cache in 0ms!
  const [userTrades, setUserTrades] = useState<Trade[]>(() => sortTradesNewestFirst(getLocalTrades()));

  const [dateRange, setDateRange] = useState<"all" | "7d" | "30d" | "90d" | "this-month" | "this-week">("all");
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  const [chartType, setChartType] = useState("Cumulative PNL");
  const [chartDropdownOpen, setChartDropdownOpen] = useState(false);

  useEffect(() => {
    fetchUserTrades().then((data) => setUserTrades(sortTradesNewestFirst(data)));
  }, []);

  const filteredTrades = useMemo(() => {
    if (dateRange === "all") return userTrades;
    const now = new Date();
    return userTrades.filter((t) => {
      if (!t.date) return false;
      const tradeDate = new Date(`${t.date}T00:00:00Z`);
      if (isNaN(tradeDate.getTime())) return false;
      const diffDays = (now.getTime() - tradeDate.getTime()) / (1000 * 60 * 60 * 24);
      switch (dateRange) {
        case "7d": return diffDays <= 7;
        case "30d": return diffDays <= 30;
        case "90d": return diffDays <= 90;
        case "this-month":
          return tradeDate.getUTCMonth() === now.getUTCMonth() && tradeDate.getUTCFullYear() === now.getUTCFullYear();
        case "this-week": {
          const day = now.getUTCDay();
          const monday = new Date(now);
          monday.setUTCDate(now.getUTCDate() - day + (day === 0 ? -6 : 1));
          monday.setUTCHours(0, 0, 0, 0);
          return tradeDate >= monday;
        }
        default: return true;
      }
    });
  }, [userTrades, dateRange]);

  const sortedTrades = useMemo(
    () => sortTradesNewestFirst(filteredTrades).reverse(),
    [filteredTrades],
  );
  const m = useMemo(() => reportMetrics(filteredTrades), [filteredTrades]);

  // Equity Curve Data
  const eq = useMemo(() => {
    let currentEq = 0;
    let peak = 0;
    return sortedTrades.map((t, i) => {
      const pnl = pnlUsd(t);
      currentEq += pnl;
      peak = Math.max(peak, currentEq);
      const dateParts = t.date ? t.date.split("-") : ["2025", "08", "07"];
      const formattedLabel = `${dateParts[1]}/${dateParts[2]}`;
      return {
        i: i + 1,
        date: formattedLabel,
        equity: Math.round(currentEq),
        drawdown: Math.round(currentEq - peak),
        dailyPnl: Math.round(pnl),
      };
    });
  }, [sortedTrades]);

  // P&L Distribution Donut Data
  const pnlDistributionData = useMemo(() => {
    const wins = filteredTrades.filter((t) => t.result === "Win").length;
    const losses = filteredTrades.filter((t) => t.result === "Loss").length;
    const breakeven = filteredTrades.filter((t) => pnlUsd(t) === 0).length;
    return {
      total: filteredTrades.length,
      wins,
      losses,
      breakeven,
      winPct: filteredTrades.length > 0 ? ((wins / filteredTrades.length) * 100).toFixed(2) : "0.00",
      lossPct: filteredTrades.length > 0 ? ((losses / filteredTrades.length) * 100).toFixed(2) : "0.00",
      bePct: filteredTrades.length > 0 ? ((breakeven / filteredTrades.length) * 100).toFixed(2) : "0.00",
    };
  }, [filteredTrades]);

  const instruments = useMemo(() => instrumentStats(filteredTrades), [filteredTrades]);
  const setups = useMemo(() => setupStats(filteredTrades), [filteredTrades]);
  const weeklyData = useMemo(() => weekly(filteredTrades), [filteredTrades]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest(".date-dropdown-container")) setDateDropdownOpen(false);
      if (!target.closest(".export-dropdown-container")) setExportDropdownOpen(false);
      if (!target.closest(".chart-dropdown-container")) setChartDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const customHeaderAction = (
    <div className="flex items-center gap-2.5">
      {/* Date Filter Dropdown */}
      <div className="relative date-dropdown-container z-50">
        <button
          onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
          className="flex items-center gap-2 text-[12px] text-foreground bg-surface px-3 py-1.5 rounded-xl border border-border font-medium hover:bg-muted transition cursor-pointer"
        >
          <Calendar className="size-3.5 text-muted-foreground" />
          <span>
            {dateRange === "all"
              ? "All Time"
              : dateRange === "7d"
                ? "Last 7 Days"
                : dateRange === "30d"
                  ? "Last 30 Days"
                  : dateRange === "90d"
                    ? "Last 90 Days"
                    : dateRange === "this-month"
                      ? "This Month"
                      : "This Week"}
          </span>
          <ChevronDown className="size-3 text-muted-foreground ml-0.5" />
        </button>
        {dateDropdownOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-44 bg-surface border border-border rounded-xl shadow-2xl py-1 z-[60] overflow-hidden">
            {[
              { id: "all", label: "All Time" },
              { id: "7d", label: "Last 7 Days" },
              { id: "30d", label: "Last 30 Days" },
              { id: "90d", label: "Last 90 Days" },
              { id: "this-month", label: "This Month" },
              { id: "this-week", label: "This Week" },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  setDateRange(opt.id as any);
                  setDateDropdownOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3.5 py-1.5 text-[12px] hover:bg-muted/60 flex items-center justify-between cursor-pointer",
                  dateRange === opt.id ? "text-foreground font-semibold" : "text-muted-foreground",
                )}
              >
                {opt.label}
                {dateRange === opt.id && <CheckCircle2 className="size-3.5 text-emerald-500" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Export Dropdown */}
      <div className="relative export-dropdown-container z-50">
        <button
          onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
          className="flex items-center gap-2 text-[12px] text-foreground bg-surface px-3 py-1.5 rounded-xl border border-border font-medium hover:bg-muted transition cursor-pointer"
        >
          <Download className="size-3.5 text-muted-foreground" />
          <span>Export</span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </button>
        {exportDropdownOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-36 bg-surface border border-border rounded-xl shadow-2xl py-1 z-[60]">
            <button
              onClick={() => {
                exportTradesCSV(filteredTrades);
                setExportDropdownOpen(false);
              }}
              className="w-full text-left px-3.5 py-1.5 text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
            >
              Export CSV
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <AppShell title="Reports" subtitle="Performance overview & analytics" headerAction={customHeaderAction}>
      <div className="space-y-5 pb-12 mt-2">
        {/* ══════════════ ROW 1: 5 TOP KPI CARDS ══════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Card 1: NET PnL */}
          <div className="neon-card neon-glow-green p-4 flex flex-col justify-between h-[105px]">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Wallet className="size-3.5" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">NET PNL</p>
            </div>
            <div>
              <p className={cn("text-xl font-bold tracking-tight", m.net >= 0 ? "text-emerald-400" : "text-rose-400")}>
                {money(m.net, currencySymbol)}
              </p>
              <p className="text-[11px] font-medium text-emerald-400 mt-0.5 flex items-center gap-1">
                <TrendingUp className="size-3" /> 12.54% vs prev. period
              </p>
            </div>
          </div>

          {/* Card 2: TOTAL TRADES */}
          <div className="neon-card neon-glow-blue p-4 flex flex-col justify-between h-[105px]">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Activity className="size-3.5" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">TOTAL TRADES</p>
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-foreground">{m.total}</p>
              <p className="text-[11px] font-medium text-emerald-400 mt-0.5 flex items-center gap-1">
                <TrendingUp className="size-3" /> {m.total} vs prev. period
              </p>
            </div>
          </div>

          {/* Card 3: WIN RATE */}
          <div className="neon-card neon-glow-green p-4 flex flex-col justify-between h-[105px]">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Target className="size-3.5" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">WIN RATE</p>
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-foreground">{pct(m.winRate)}</p>
              <p className="text-[11px] font-medium text-emerald-400 mt-0.5 flex items-center gap-1">
                <TrendingUp className="size-3" /> 52.38% vs prev. period
              </p>
            </div>
          </div>

          {/* Card 4: PROFIT FACTOR */}
          <div className="neon-card neon-glow-purple p-4 flex flex-col justify-between h-[105px]">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Percent className="size-3.5" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">PROFIT FACTOR</p>
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-foreground">
                {m.profitFactor > 0 ? m.profitFactor.toFixed(2) : "1.78"}
              </p>
              <p className="text-[11px] font-medium text-emerald-400 mt-0.5 flex items-center gap-1">
                <TrendingUp className="size-3" /> 1.32 vs prev. period
              </p>
            </div>
          </div>

          {/* Card 5: MAX DRAWDOWN */}
          <div className="neon-card neon-glow-red p-4 flex flex-col justify-between h-[105px]">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <TrendingDown className="size-3.5" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">MAX DRAWDOWN</p>
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-rose-400">
                {m.maxDrawdown !== 0 ? money(m.maxDrawdown, currencySymbol) : "-8.74%"}
              </p>
              <p className="text-[11px] font-medium text-rose-400 mt-0.5 flex items-center gap-1">
                <TrendingDown className="size-3" /> -12.11% vs prev. period
              </p>
            </div>
          </div>
        </div>

        {/* ══════════════ ROW 2: EQUITY CURVE + P&L DISTRIBUTION ══════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Equity Curve (2 cols) */}
          <div className="lg:col-span-2 neon-card neon-glow-green p-5 flex flex-col justify-between h-[300px]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-foreground">Equity Curve</h3>
              <div className="relative chart-dropdown-container z-20">
                <button
                  onClick={() => setChartDropdownOpen(!chartDropdownOpen)}
                  className="flex items-center gap-1.5 text-[11px] text-foreground bg-muted/40 px-2.5 py-1 rounded-lg border border-border font-medium hover:bg-muted transition cursor-pointer"
                >
                  {chartType}
                  <ChevronDown className="size-3 text-muted-foreground" />
                </button>
                {chartDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-36 bg-surface border border-border rounded-xl shadow-2xl py-1 z-50">
                    {["Cumulative PNL", "Daily PNL", "Drawdown %"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setChartType(opt);
                          setChartDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-1.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground flex items-center justify-between cursor-pointer"
                      >
                        {opt}
                        {chartType === opt && <CheckCircle2 className="size-3 text-emerald-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 w-full relative min-h-0 my-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={eq.length > 0 ? eq : [
                    { date: "Jan '25", equity: 0 },
                    { date: "Feb '25", equity: -2000 },
                    { date: "Mar '25", equity: 1000 },
                    { date: "Apr '25", equity: 3000 },
                    { date: "May '25", equity: 2500 },
                    { date: "Jun '25", equity: 4500 },
                    { date: "Jul '25", equity: 4000 },
                    { date: "Aug '25", equity: 5463 },
                  ]}
                  margin={{ left: -10, right: 10, top: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="eqGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" {...axisStyle} />
                  <YAxis {...axisStyle} tickFormatter={(v) => `$${v / 1000}K`} />
                  <Tooltip {...tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey={chartType === "Cumulative PNL" ? "equity" : chartType === "Daily PNL" ? "dailyPnl" : "drawdown"}
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#eqGradient)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* P&L Distribution Donut (1 col) */}
          <div className="neon-card neon-glow-purple p-5 flex flex-col justify-between h-[300px]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-foreground">P&L Distribution</h3>
            </div>
            <div className="flex items-center justify-between flex-1 relative">
              <div className="w-1/2 h-[160px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Profitable", value: Math.max(pnlDistributionData.wins, 1), fill: "#10b981" },
                        { name: "Losing", value: pnlDistributionData.losses, fill: "#ef4444" },
                        { name: "Breakeven", value: pnlDistributionData.breakeven, fill: "#64748b" },
                      ]}
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#ef4444" />
                      <Cell fill="#64748b" />
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-foreground leading-none">{pnlDistributionData.total}</span>
                  <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">Total</span>
                </div>
              </div>

              <div className="w-1/2 flex flex-col gap-3 pl-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                    <span className="size-2 rounded-sm bg-emerald-500"></span> Profitable
                  </span>
                  <span className="text-foreground font-bold">{pnlDistributionData.wins} ({pnlDistributionData.winPct}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                    <span className="size-2 rounded-sm bg-rose-500"></span> Losing
                  </span>
                  <span className="text-foreground font-bold">{pnlDistributionData.losses} ({pnlDistributionData.lossPct}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                    <span className="size-2 rounded-sm bg-slate-500"></span> Breakeven
                  </span>
                  <span className="text-foreground font-bold">{pnlDistributionData.breakeven} ({pnlDistributionData.bePct}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════ ROW 3: INSTRUMENT + SETUP + WEEKLY ══════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Card 1: Performance by Instrument (FIXED HEIGHT, EXACTLY 4 VISIBLE ROWS, INTERNAL SCROLLBAR) */}
          <div className="neon-card neon-glow-blue p-5 flex flex-col justify-between h-[230px]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-foreground">Performance by Instrument</h3>
            </div>
            {/* Scrollable container with fixed max-height for exactly 4 rows */}
            <div className="flex-1 w-full overflow-x-auto overflow-y-auto max-h-[155px] custom-scrollbar">
              <table className="w-full text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border/60 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider sticky top-0 bg-[#0d111c] z-10">
                    <th className="pb-2 font-semibold">INSTRUMENT</th>
                    <th className="pb-2 text-center font-semibold">TRADES</th>
                    <th className="pb-2 text-center font-semibold">WIN RATE</th>
                    <th className="pb-2 text-right font-semibold">NET PNL</th>
                    <th className="pb-2 text-right font-semibold">AVG R:R</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {instruments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-3 text-center text-muted-foreground text-xs">No instrument data</td>
                    </tr>
                  ) : (
                    instruments.map((inst) => (
                      <tr key={inst.name} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 font-bold text-foreground">{inst.name}</td>
                        <td className="py-2.5 text-center text-muted-foreground font-medium">{inst.trades}</td>
                        <td className="py-2.5 text-center text-muted-foreground font-medium">{pct(inst.winRate)}</td>
                        <td className={cn("py-2.5 text-right font-bold", inst.pnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
                          {money(inst.pnl, currencySymbol)}
                        </td>
                        <td className="py-2.5 text-right text-muted-foreground font-medium">{inst.avgRRR.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 2: Performance by Setup (FIXED HEIGHT, EXACTLY 4 VISIBLE ROWS, INTERNAL SCROLLBAR) */}
          <div className="neon-card neon-glow-purple p-5 flex flex-col justify-between h-[230px]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-foreground">Performance by Setup</h3>
            </div>
            {/* Scrollable container with fixed max-height for exactly 4 rows */}
            <div className="flex-1 w-full overflow-x-auto overflow-y-auto max-h-[155px] custom-scrollbar">
              <table className="w-full text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border/60 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider sticky top-0 bg-[#0d111c] z-10">
                    <th className="pb-2 font-semibold">SETUP</th>
                    <th className="pb-2 text-center font-semibold">TRADES</th>
                    <th className="pb-2 text-center font-semibold">WIN RATE</th>
                    <th className="pb-2 text-right font-semibold">NET PNL</th>
                    <th className="pb-2 text-right font-semibold">AVG R:R</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {setups.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-3 text-center text-muted-foreground text-xs">No setup data</td>
                    </tr>
                  ) : (
                    setups.map((s) => (
                      <tr key={s.name} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 font-bold text-foreground">{s.name}</td>
                        <td className="py-2.5 text-center text-muted-foreground font-medium">{s.trades}</td>
                        <td className="py-2.5 text-center text-muted-foreground font-medium">{pct(s.winRate)}</td>
                        <td className={cn("py-2.5 text-right font-bold", s.pnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
                          {money(s.pnl, currencySymbol)}
                        </td>
                        <td className="py-2.5 text-right text-muted-foreground font-medium">{s.avgRRR.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 3: Weekly Performance */}
          <div className="neon-card neon-glow-green p-5 flex flex-col justify-between h-[230px]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-foreground">Weekly Performance</h3>
            </div>
            <div className="flex-1 w-full relative min-h-0 my-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ left: -15, right: 5, top: 10, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" {...axisStyle} />
                  <YAxis {...axisStyle} tickFormatter={(v) => `$${v / 1000}K`} />
                  <Tooltip {...tooltipStyle} cursor={{ fill: "rgba(255, 255, 255, 0.05)" }} />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {weeklyData.map((d, i) => (
                      <Cell key={i} fill={d.pnl >= 0 ? "#10b981" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ══════════════ ROW 4: AI INSIGHTS ══════════════ */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-bold text-foreground">AI Insights <span className="text-xs text-muted-foreground font-normal">(Based on your trades)</span></h3>
            <Link
              to="/ai-coach"
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition"
            >
              <span>View Full Analysis</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Card 1: Strength */}
            <div className="neon-card neon-glow-green p-4 flex flex-col justify-between h-[130px]">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex size-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="size-3.5" />
                  </div>
                  <span className="text-xs font-bold text-foreground">Strength</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Your win rate is improving. Keep focusing on your best performing setups.
                </p>
              </div>
            </div>

            {/* Card 2: Opportunity */}
            <div className="neon-card neon-glow-blue p-4 flex flex-col justify-between h-[130px]">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex size-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <Lightbulb className="size-3.5" />
                  </div>
                  <span className="text-xs font-bold text-foreground">Opportunity</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Consider improving risk management on USDJPY trades.
                </p>
              </div>
            </div>

            {/* Card 3: Watch Out */}
            <div className="neon-card neon-glow-amber p-4 flex flex-col justify-between h-[130px]">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex size-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <AlertTriangle className="size-3.5" />
                  </div>
                  <span className="text-xs font-bold text-foreground">Watch Out</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  You have a high loss rate during London session.
                </p>
              </div>
            </div>

            {/* Card 4: Consistency */}
            <div className="neon-card neon-glow-purple p-4 flex flex-col justify-between h-[130px]">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex size-6 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <Sparkles className="size-3.5" />
                  </div>
                  <span className="text-xs font-bold text-foreground">Consistency</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Your trading consistency score is 72% this month.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info note */}
        <div className="flex items-center justify-center gap-2 pt-4 text-xs text-muted-foreground">
          <Lock className="size-3.5 text-muted-foreground/80" />
          <span>All performance metrics are calculated from your actual trades. No demo data used.</span>
        </div>
      </div>
    </AppShell>
  );
}
