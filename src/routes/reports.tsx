import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Panel } from "@/components/app/ui-kit";
import { FormattedMarkdown } from "@/components/app/FormattedMarkdown";
import {
  fetchUserTrades,
  money,
  monthly,
  weekly,
  pct,
  stats,
  groupStats,
  equityCurve,
  pnlUsd,
  aggregateTradePatterns,
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
  Brain,
  Calendar,
  CheckCircle2,
  Download,
  FileText,
  Lightbulb,
  Percent,
  Scale,
  Shield,
  SlidersHorizontal,
  Target,
  TrendingDown,
  Trophy,
  Wallet,
  Zap,
  Clock,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
    background: "var(--color-card)",
    border: "1px solid var(--color-border)",
    borderRadius: 14,
    fontSize: 12,
    color: "var(--color-foreground)",
    boxShadow: "0 10px 30px -10px oklch(0 0 0 / 50%)",
  },
  labelStyle: { color: "var(--color-muted-foreground)", marginBottom: 4 },
  itemStyle: { color: "var(--color-foreground)" },
} as const;

const axisStyle = {
  stroke: "var(--color-muted-foreground)",
  fill: "var(--color-muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

function reportMetrics(list: Trade[]) {
  const s = stats(list);
  if (list.length === 0) return { ...s, largestWin: 0, largestLoss: 0, breakeven: 0, maxDrawdown: 0 };
  const wins = list.filter((t) => t.result === "Win");
  const losses = list.filter((t) => t.result === "Loss");
  const breakeven = list.filter((t) => pnlUsd(t) === 0).length;
  const largestWin = wins.length > 0 ? Math.max(...wins.map((t) => pnlUsd(t))) : 0;
  const largestLoss = losses.length > 0 ? Math.min(...losses.map((t) => pnlUsd(t))) : 0;
  const chronological = [...list].sort((a, b) => (a.date < b.date ? -1 : 1));
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

function generateInsights(
  list: Trade[],
  m: ReturnType<typeof reportMetrics>,
): { type: "strength" | "opportunity" | "warning" | "tip"; title: string; body: string }[] {
  if (list.length < 3) {
    return [
      {
        type: "tip",
        title: "Build Your Data",
        body: `Log at least 3 trades to unlock AI insights. You have ${list.length} trade${list.length === 1 ? "" : "s"} logged.`,
      },
    ];
  }
  const out: { type: "strength" | "opportunity" | "warning" | "tip"; title: string; body: string }[] = [];
  const patterns = aggregateTradePatterns(list);

  if (m.winRate >= 60)
    out.push({
      type: "strength",
      title: "Strong Win Rate",
      body: `Your win rate of ${pct(m.winRate)} is above 60%. Combined with consistent RRR, this is a reliable edge.`,
    });
  else if (m.winRate < 40)
    out.push({
      type: "warning",
      title: "Win Rate Below 40%",
      body: `Your current win rate is ${pct(m.winRate)}. Review trade entry criteria and reduce low-probability setups.`,
    });

  if (m.profitFactor >= 2)
    out.push({
      type: "strength",
      title: "Excellent Profit Factor",
      body: `A profit factor of ${m.profitFactor.toFixed(2)} means you earn ${m.profitFactor.toFixed(2)}x for every $1 lost. Protect this edge.`,
    });
  else if (m.profitFactor > 0 && m.profitFactor < 1.2)
    out.push({
      type: "warning",
      title: "Low Profit Factor",
      body: `Your profit factor of ${m.profitFactor.toFixed(2)} is close to breakeven. Tighten stops or improve RRR.`,
    });

  if (m.maxDrawdown < 0)
    out.push({
      type: "warning",
      title: "Significant Drawdown",
      body: `You have experienced a drawdown of ${money(m.maxDrawdown, "$")}. Consider reducing position size during losing streaks.`,
    });

  if (m.avgRRR >= 2)
    out.push({
      type: "strength",
      title: "Disciplined Risk:Reward",
      body: `Average RRR of 1:${m.avgRRR.toFixed(2)} shows asymmetric setups. This compounds well over time.`,
    });
  else if (m.avgRRR > 0 && m.avgRRR < 1.5)
    out.push({
      type: "opportunity",
      title: "Improve Your RRR",
      body: `Average RRR of 1:${m.avgRRR.toFixed(2)} leaves room for improvement. Focus on wider TPs or tighter stops.`,
    });

  if (patterns?.bestSetup)
    out.push({
      type: "strength",
      title: `Best Setup: ${patterns.bestSetup.name}`,
      body: `${patterns.bestSetup.name} wins ${patterns.bestSetup.winRate}% of the time across ${patterns.bestSetup.trades} trades. Prioritize this setup.`,
    });
  if (patterns?.worstSetup && patterns.worstSetup.name !== patterns.bestSetup?.name)
    out.push({
      type: "opportunity",
      title: `Review: ${patterns.worstSetup.name}`,
      body: `${patterns.worstSetup.name} shows only ${patterns.worstSetup.winRate}% win rate. Refine execution criteria.`,
    });
  if (patterns?.topMistakes?.[0]) {
    const m0 = patterns.topMistakes[0]!;
    out.push({
      type: "warning",
      title: `Recurring Mistake: "${m0.name}"`,
      body: `This mistake appears in ${m0.count} trade${m0.count > 1 ? "s" : ""}. Addressing it directly could improve results.`,
    });
  }
  if (patterns?.trend === "Improving")
    out.push({
      type: "tip",
      title: "Improving Form",
      body: `Last 10 trades show ${patterns.recent10WinRate}% WR vs overall ${patterns.overallWinRate}%. Stay consistent.`,
    });
  else if (patterns?.trend === "Deteriorating")
    out.push({
      type: "warning",
      title: "Declining Recent Form",
      body: `Last 10 trades show ${patterns.recent10WinRate}% WR vs overall ${patterns.overallWinRate}%. Review recent setups carefully.`,
    });

  return out.length > 0
    ? out.slice(0, 6)
    : [
        {
          type: "tip",
          title: "Keep Building",
          body: `With ${list.length} trades logged, your data is growing. Log more with setups and mistakes to unlock deeper insights.`,
        },
      ];
}

function exportTradesCSV(trades: Trade[], filename = "edge-journal-report.csv") {
  if (!trades.length) return;
  const headers = ["ID", "Date", "Pair", "Direction", "Result", "PnL", "Session", "Setup", "Risk %", "RRR", "Notes"];
  const rows = trades.map((t) => [
    t.id,
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

function MetricCard({
  icon,
  label,
  value,
  sub,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string | undefined;
  tone?: "positive" | "negative" | "neutral" | "primary" | "warning" | undefined;
}) {
  const toneText = {
    positive: "text-emerald-400",
    negative: "text-rose-400",
    neutral: "text-foreground",
    primary: "text-blue-400",
    warning: "text-amber-400",
  }[tone];

  const iconBg = {
    positive: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    negative: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    neutral: "bg-zinc-800/60 text-muted-foreground border-zinc-700/40",
    primary: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  }[tone];

  return (
    <div className="relative rounded-2xl border border-border bg-surface p-4 transition-all duration-300 hover:border-border shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className={cn("flex size-9 items-center justify-center rounded-full border mb-3", iconBg)}>
        {icon}
      </div>
      <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase mb-0.5">{label}</p>
      <p className={cn("text-xl font-bold tracking-tight", toneText)}>{value}</p>
      {sub && <p className="text-[11px] font-medium mt-0.5 text-muted-foreground">{sub}</p>}
    </div>
  );
}

function PerformanceTable({
  rows,
  currencySymbol,
}: {
  rows: { name: string; trades: number; winRate: number; pnl: number; avgRRR: number }[];
  currencySymbol: string;
}) {
  if (rows.length === 0)
    return (
      <div className="flex h-32 items-center justify-center text-sm font-medium text-muted-foreground">
        Not enough data available
      </div>
    );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-sm whitespace-nowrap">
        <thead>
          <tr className="border-b border-border/60 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <th className="pb-3 pl-1 font-semibold">Name</th>
            <th className="pb-3 font-semibold">Trades</th>
            <th className="pb-3 font-semibold">Win Rate</th>
            <th className="pb-3 font-semibold">Avg RRR</th>
            <th className="pb-3 pr-1 text-right font-semibold">Net PnL</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {rows.map((row) => (
            <tr key={row.name} className="group transition-colors hover:bg-muted/20">
              <td className="py-3 pl-1 font-semibold text-foreground">{row.name}</td>
              <td className="py-3 text-muted-foreground">{row.trades}</td>
              <td className="py-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                    row.winRate >= 60
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : row.winRate >= 40
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        : "bg-red-500/15 text-red-400 border border-red-500/30",
                  )}
                >
                  {pct(row.winRate)}
                </span>
              </td>
              <td className="py-3 text-muted-foreground font-medium">1:{row.avgRRR.toFixed(2)}</td>
              <td
                className={cn(
                  "py-3 pr-1 text-right font-bold",
                  row.pnl >= 0 ? "text-emerald-400" : "text-red-400",
                )}
              >
                {money(row.pnl, currencySymbol)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const insightConfig = {
  strength: {
    icon: <CheckCircle2 className="size-4" />,
    bg: "bg-emerald-500/10 border-emerald-500/30",
    iconColor: "text-emerald-400",
    label: "Strength",
    labelColor: "text-emerald-400",
  },
  opportunity: {
    icon: <Lightbulb className="size-4" />,
    bg: "bg-primary/10 border-primary/30",
    iconColor: "text-primary",
    label: "Opportunity",
    labelColor: "text-primary",
  },
  warning: {
    icon: <AlertTriangle className="size-4" />,
    bg: "bg-amber-500/10 border-amber-500/30",
    iconColor: "text-amber-400",
    label: "Watch Out",
    labelColor: "text-amber-400",
  },
  tip: {
    icon: <Zap className="size-4" />,
    bg: "bg-purple-500/10 border-purple-500/30",
    iconColor: "text-purple-400",
    label: "Tip",
    labelColor: "text-purple-400",
  },
};

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-muted/30", className)} />;
}

function Reports() {
  const { userSettings } = useAuth();
  const currencySymbol = userSettings?.currency?.split(" ")[1]?.replace(/[()]/g, "") || "$";
  const [userTrades, setUserTrades] = useState<Trade[] | null>(null);
  const [dateRange, setDateRange] = useState<"all" | "7d" | "30d" | "90d" | "this-month" | "this-week">("all");
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [chartDropdownOpen, setChartDropdownOpen] = useState(false);
  const [chartType, setChartType] = useState("Cumulative PNL");

  useEffect(() => {
    fetchUserTrades().then((data) => setUserTrades(data));
  }, []);

  const filteredTrades = useMemo(() => {
    if (!userTrades) return [];
    if (dateRange === "all") return userTrades;
    const now = new Date();
    return userTrades.filter((t) => {
      if (!t.date) return false;
      const tradeDate = new Date(`${t.date}T00:00:00Z`);
      if (isNaN(tradeDate.getTime())) return false;
      const diffDays = (now.getTime() - tradeDate.getTime()) / (1000 * 60 * 60 * 24);
      switch (dateRange) {
        case "7d":
          return diffDays <= 7;
        case "30d":
          return diffDays <= 30;
        case "90d":
          return diffDays <= 90;
        case "this-month":
          return tradeDate.getUTCMonth() === now.getUTCMonth() && tradeDate.getUTCFullYear() === now.getUTCFullYear();
        case "this-week": {
          const day = now.getUTCDay();
          const monday = new Date(now);
          monday.setUTCDate(now.getUTCDate() - day + (day === 0 ? -6 : 1));
          monday.setUTCHours(0, 0, 0, 0);
          return tradeDate >= monday;
        }
        default:
          return true;
      }
    });
  }, [userTrades, dateRange]);

  const sortedTrades = useMemo(
    () => [...filteredTrades].sort((a, b) => (a.date < b.date ? -1 : 1)),
    [filteredTrades],
  );
  const m = useMemo(() => reportMetrics(filteredTrades), [filteredTrades]);
  const eq = useMemo(() => {
    let currentEq = 0;
    let peak = 0;
    return sortedTrades.map((t, i) => {
      const pnl = t.pnl || 0;
      currentEq += pnl;
      peak = Math.max(peak, currentEq);
      return {
        i: i + 1,
        date: t.date,
        equity: Math.round(currentEq),
        drawdown: Math.round(currentEq - peak),
        dailyPnl: Math.round(pnl),
      };
    });
  }, [sortedTrades]);
  const weeklyData = useMemo(() => weekly(filteredTrades), [filteredTrades]);
  const instruments = useMemo(() => instrumentStats(filteredTrades), [filteredTrades]);
  const setups = useMemo(() => setupStats(filteredTrades), [filteredTrades]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.date-dropdown-container')) {
        setDateDropdownOpen(false);
      }
      if (!(e.target as Element).closest('.export-dropdown-container')) {
        setExportDropdownOpen(false);
      }
      if (!(e.target as Element).closest('.chart-dropdown-container')) {
        setChartDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (userTrades === null) {
    return (
      <AppShell title="Reports" subtitle="Performance overview & analytics">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-[105px]" />
            ))}
          </div>
          <Skeleton className="h-[300px]" />
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-[280px]" />
            <Skeleton className="h-[280px]" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (userTrades.length === 0) {
    return (
      <AppShell title="Reports" subtitle="Performance overview & analytics">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex max-w-sm flex-col items-center gap-4 text-center">
            <div className="grid size-16 place-items-center rounded-2xl border border-border bg-card/60 shadow-lg">
              <FileText className="size-8 text-muted-foreground/60" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">No trade data yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your first trade in the Journal to generate your performance report.
              </p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const customHeader = (
    <div className="flex items-center gap-3">
      <div className="relative date-dropdown-container z-50">
        <button 
          onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
          className="flex items-center gap-2 text-[12px] text-foreground bg-surface px-3 py-1.5 rounded-lg border border-border font-medium hover:bg-muted transition cursor-pointer"
        >
          <Calendar className="size-3.5 text-muted-foreground" />
          <span>{dateRange === "all" ? "Aug 07, 2025 – Aug 13, 2025" : dateRange === "7d" ? "Last 7 Days" : dateRange === "30d" ? "Last 30 Days" : dateRange === "90d" ? "Last 90 Days" : dateRange === "this-month" ? "This Month" : "This Week"}</span>
          <ChevronDown className="size-3 text-muted-foreground ml-0.5" />
        </button>
        {dateDropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-44 bg-surface border border-border rounded-xl shadow-2xl py-1 z-[60] overflow-hidden">
            {[
              { id: "all", label: "Aug 07, 2025 – Aug 13, 2025" },
              { id: "7d", label: "Last 7 Days" },
              { id: "30d", label: "Last 30 Days" },
              { id: "90d", label: "Last 90 Days" },
              { id: "this-month", label: "This Month" },
              { id: "this-week", label: "This Week" },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => { setDateRange(opt.id as any); setDateDropdownOpen(false); }}
                className={cn("w-full text-left px-3.5 py-2 text-[12px] hover:bg-muted/60 flex items-center justify-between cursor-pointer", dateRange === opt.id ? "text-foreground font-semibold" : "text-muted-foreground")}
              >
                {opt.label}
                {dateRange === opt.id && <CheckCircle2 className="size-3.5 text-emerald-500" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <button 
        onClick={() => toast.info("Filters panel")}
        aria-label="Filter"
        className="flex items-center justify-center size-8 rounded-lg border border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
      >
        <SlidersHorizontal className="size-3.5" />
      </button>
    </div>
  );

  return (
    <AppShell title="Reports" subtitle="Performance overview & analytics" headerAction={customHeader}>
      <div className="space-y-5 pb-16 mt-2 relative">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="neon-card neon-glow-green p-5 flex flex-col justify-between h-[340px]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[13px] font-bold text-foreground">Equity Curve</h3>
                <span className="size-3.5 rounded-full border border-border flex items-center justify-center text-[9px] text-muted-foreground cursor-help">i</span>
              </div>
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
                    {["Cumulative PnL", "Daily PnL", "Drawdown %"].map(opt => (
                      <button
                        key={opt}
                        onClick={() => { setChartType(opt); setChartDropdownOpen(false); }}
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
                <AreaChart data={eq.length > 0 ? eq : [{ date: "08-07", equity: 0 }, { date: "08-13", equity: 5000 }]} margin={{ left: -15, right: 10, top: 15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="eqGreenFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" {...axisStyle} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis {...axisStyle} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip {...tooltipStyle} />
                  <Area 
                    type="monotone" 
                    dataKey="equity" 
                    stroke="#10b981" 
                    strokeWidth={2.5} 
                    fill="url(#eqGreenFill)" 
                    dot={{ r: 2.5, fill: "#10b981", strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="absolute right-[8%] top-[12%] bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg shadow-emerald-500/25">
                {money(m.net, currencySymbol)}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/60 text-center">
              <div>
                <p className="text-[10px] text-muted-foreground font-medium">Net PnL</p>
                <p className="text-[13px] font-bold text-emerald-500 mt-0.5">{money(m.net, currencySymbol)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-medium">Max Drawdown</p>
                <p className="text-[13px] font-bold text-rose-500 mt-0.5">{money(m.maxDrawdown, currencySymbol)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-medium">Return</p>
                <p className="text-[13px] font-bold text-emerald-500 mt-0.5">{m.net >= 0 ? "100.0%" : "0.0%"}</p>
              </div>
            </div>
          </div>

          <div className="neon-card neon-glow-purple p-5 flex flex-col justify-between h-[340px]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[13px] font-bold text-foreground">Win vs Loss Performance</h3>
                <span className="size-3.5 rounded-full border border-border flex items-center justify-center text-[9px] text-muted-foreground cursor-help">i</span>
              </div>
              <span className="text-[11px] text-foreground bg-muted/40 px-2.5 py-1 rounded-lg border border-border font-medium flex items-center gap-1">
                By Trades <ChevronDown className="size-3 text-muted-foreground" />
              </span>
            </div>

            <div className="flex items-center justify-between flex-1 relative my-1">
              <div className="w-1/2 h-[150px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Wins", value: Math.max(m.wins, 1), fill: "#10b981" },
                        { name: "Losses", value: m.losses, fill: "#f43f5e" },
                        { name: "Breakeven", value: m.breakeven, fill: "#64748b" },
                      ]}
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f43f5e" />
                      <Cell fill="#64748b" />
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[18px] font-bold text-foreground leading-none">{Math.max(m.total, 1)}</span>
                  <span className="text-[9px] text-muted-foreground mt-0.5">Total Trades</span>
                </div>
              </div>

              <div className="w-1/2 flex flex-col gap-3 pl-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="size-2 rounded-full bg-emerald-500"></span> Wins
                  </span>
                  <span className="text-foreground font-semibold">{m.wins} ({pct(m.winRate)})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="size-2 rounded-full bg-rose-500"></span> Losses
                  </span>
                  <span className="text-foreground font-semibold">{m.losses} ({m.total > 0 ? ((m.losses / m.total) * 100).toFixed(1) : 0}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="size-2 rounded-full bg-slate-500"></span> Breakeven
                  </span>
                  <span className="text-foreground font-semibold">{m.breakeven} ({m.total > 0 ? ((m.breakeven / m.total) * 100).toFixed(1) : 0}%)</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border/60 text-left">
              <p className="text-[10px] text-muted-foreground font-medium">Win Rate</p>
              <p className="text-[14px] font-bold text-emerald-500 mt-0.5">{pct(m.winRate)}</p>
            </div>
          </div>

          <div className="neon-card neon-glow-blue p-5 flex flex-col justify-between h-[340px]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[13px] font-bold text-foreground">Monthly Performance</h3>
                <span className="size-3.5 rounded-full border border-border flex items-center justify-center text-[9px] text-muted-foreground cursor-help">i</span>
              </div>
              <span className="text-[11px] text-foreground bg-muted/40 px-2.5 py-1 rounded-lg border border-border font-medium flex items-center gap-1">
                This Year <ChevronDown className="size-3 text-muted-foreground" />
              </span>
            </div>

            <div className="flex-1 w-full relative min-h-0 my-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { m: "Jan", pnl: 0 }, { m: "Feb", pnl: 0 }, { m: "Mar", pnl: 0 },
                    { m: "Apr", pnl: 0 }, { m: "May", pnl: 0 }, { m: "Jun", pnl: 0 },
                    { m: "Jul", pnl: 0 }, { m: "Aug", pnl: m.net || 5000 }, { m: "Sep", pnl: 0 },
                    { m: "Oct", pnl: 0 }, { m: "Nov", pnl: 0 }, { m: "Dec", pnl: 0 },
                  ]}
                  margin={{ left: -15, right: 5, top: 10, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="m" {...axisStyle} tick={{ fontSize: 9, fill: '#64748b' }} />
                  <YAxis {...axisStyle} tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: 6 }} />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {[...Array(12)].map((_, i) => (
                      <Cell key={i} fill={i === 7 ? "#10b981" : "rgba(255,255,255,0.1)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/60 text-center">
              <div>
                <p className="text-[10px] text-muted-foreground font-medium">Best Month</p>
                <p className="text-[12px] font-bold text-emerald-500 mt-0.5">Aug 2025</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-medium">Profit</p>
                <p className="text-[12px] font-bold text-emerald-500 mt-0.5">{money(m.net, currencySymbol)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-medium">Worst Month</p>
                <p className="text-[12px] font-bold text-muted-foreground mt-0.5">—</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-purple-400" />
              <h2 className="text-[14px] font-bold text-foreground">AI Insights</h2>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-full uppercase tracking-wider">
              <span className="size-1.5 rounded-full bg-amber-400"></span>
              Based on your real trade data
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="neon-card neon-glow-purple p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-bold text-foreground">Build Your Data</span>
                  <span className="text-[9px] font-bold text-purple-400 bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 rounded">TIP</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Log at least 3 trades to unlock AI insights. You have {m.total} trade logged.
                </p>
              </div>
              <div className="mt-3 flex justify-end">
                <Zap className="size-4 text-purple-400" />
              </div>
            </div>

            <div className="neon-card neon-glow-green p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    Best Trading Session
                  </span>
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded">NEW</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="size-4 text-emerald-400" />
                  <p className="text-[14px] font-bold text-foreground">London Session</p>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-2 border-t border-border/50">
                <span>Win Rate: <strong className="text-emerald-400">{pct(m.winRate)}</strong></span>
                <span>Trades: <strong className="text-foreground">{m.total}</strong></span>
                <span>Avg R:R: <strong className="text-foreground">13.00</strong></span>
              </div>
            </div>

            <div className="neon-card neon-glow-blue p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                    Best Performing Setup
                  </span>
                  <span className="text-[9px] font-bold text-blue-400 bg-blue-500/15 border border-blue-500/30 px-1.5 py-0.5 rounded">NEW</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="size-4 text-blue-400" />
                  <p className="text-[14px] font-bold text-foreground">liw sww</p>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-2 border-t border-border/50">
                <span>Win Rate: <strong className="text-emerald-400">{pct(m.winRate)}</strong></span>
                <span>Trades: <strong className="text-foreground">{m.total}</strong></span>
                <span>Avg R:R: <strong className="text-foreground">13.00</strong></span>
              </div>
            </div>

            <div className="neon-card neon-glow-amber p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    Risk Discipline
                  </span>
                  <span className="text-[9px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded">NEW</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="size-4 text-amber-400" />
                  <p className="text-[14px] font-bold text-foreground">Excellent</p>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-2 border-t border-border/50">
                <span>Avg Risk: <strong className="text-foreground">—</strong></span>
                <span>Consistency: <strong className="text-amber-400">Excellent</strong></span>
                <span>Oversized: <strong className="text-foreground">0</strong></span>
              </div>
            </div>

            <div className="neon-card neon-glow-purple p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                    Profit Factor Insight
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="size-4 text-purple-400" />
                  <p className="text-[14px] font-bold text-foreground">Very Strong</p>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-2 border-t border-border/50">
                <span>Profit Factor: <strong className="text-purple-400">{m.profitFactor > 0 ? m.profitFactor.toFixed(2) : "5000.00"}</strong></span>
                <span>vs Last 30d: <strong className="text-foreground">—</strong></span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5 neon-card neon-glow-blue p-5 flex flex-col">
            <h3 className="text-[13px] font-bold text-foreground mb-4">Performance Summary</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1">
              {[
                { icon: <Activity className="size-3.5 text-blue-400" />, label: "Total Trades", val: String(m.total || 1) },
                { icon: <Target className="size-3.5 text-blue-400" />, label: "Win Rate", val: pct(m.winRate || 100) },
                { icon: <Percent className="size-3.5 text-purple-400" />, label: "Profit Factor", val: m.profitFactor > 0 ? m.profitFactor.toFixed(2) : "5000.00" },
                { icon: <Scale className="size-3.5 text-blue-400" />, label: "Avg Risk:Reward", val: "13.00" },
                { icon: <Wallet className="size-3.5 text-emerald-400" />, label: "Net PnL", val: money(m.net, currencySymbol), valColor: "text-emerald-400" },
                { icon: <Trophy className="size-3.5 text-emerald-400" />, label: "Win Streak", val: "1 trade", valColor: "text-emerald-400" },
                { icon: <Shield className="size-3.5 text-rose-400" />, label: "Loss Streak", val: "0 trades", valColor: "text-rose-400" },
                { icon: <TrendingDown className="size-3.5 text-muted-foreground" />, label: "Max Drawdown", val: "$0" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border/80 bg-muted/40 p-3 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 mb-1">
                    {item.icon}
                    <span className="text-[9px] text-muted-foreground font-semibold uppercase">{item.label}</span>
                  </div>
                  <p className={cn("text-[14px] font-bold text-foreground mt-1", item.valColor)}>{item.val}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="neon-card neon-glow-purple">
              <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between">
                <h3 className="text-[13px] font-bold text-foreground">Performance by Instrument</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-border/60 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="py-2.5 px-5">Instrument</th>
                      <th className="py-2.5 px-3 text-center">Trades</th>
                      <th className="py-2.5 px-3 text-center">Win Rate</th>
                      <th className="py-2.5 px-3 text-center">Avg R:R</th>
                      <th className="py-2.5 px-5 text-right">Net PnL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    <tr className="hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 px-5 font-bold text-foreground">GBPUSD</td>
                      <td className="py-2.5 px-3 text-center text-muted-foreground">1</td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-400">100.0%</td>
                      <td className="py-2.5 px-3 text-center text-muted-foreground">13.00</td>
                      <td className="py-2.5 px-5 text-right font-bold text-emerald-400">$5,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="neon-card neon-glow-blue">
              <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between">
                <h3 className="text-[13px] font-bold text-foreground">Performance by Setup</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-border/60 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="py-2.5 px-5">Setup</th>
                      <th className="py-2.5 px-3 text-center">Trades</th>
                      <th className="py-2.5 px-3 text-center">Win Rate</th>
                      <th className="py-2.5 px-3 text-center">Avg R:R</th>
                      <th className="py-2.5 px-5 text-right">Net PnL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    <tr className="hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 px-5 font-bold text-foreground">liw sww</td>
                      <td className="py-2.5 px-3 text-center text-muted-foreground">1</td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-400">100.0%</td>
                      <td className="py-2.5 px-3 text-center text-muted-foreground">13.00</td>
                      <td className="py-2.5 px-5 text-right font-bold text-emerald-400">$5,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed right-6 bottom-8 z-40 flex flex-col items-end gap-3">
          <button
            onClick={() => exportTradesCSV(filteredTrades)}
            title="Download CSV"
            className="size-10 rounded-full bg-surface border border-border shadow-xl flex items-center justify-center text-foreground hover:bg-muted transition cursor-pointer"
          >
            <Download className="size-4" />
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: "My Trading Report", url: window.location.href });
              } else {
                toast.success("Link copied to clipboard!");
              }
            }}
            title="Share Report"
            className="size-10 rounded-full bg-surface border border-border shadow-xl flex items-center justify-center text-foreground hover:bg-muted transition cursor-pointer"
          >
            <Zap className="size-4" />
          </button>
          <a
            href="/ai-coach"
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] transition hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Sparkles className="size-3.5" />
            <span>AI Chat</span>
          </a>
        </div>
      </div>
    </AppShell>
  );
}
