import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Panel } from "@/components/app/ui-kit";
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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
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
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports - Edge Journal" },
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
    background: "oklch(0.17 0.02 270 / 95%)",
    border: "1px solid oklch(0.28 0.04 270)",
    borderRadius: 12,
    fontSize: 12,
    color: "oklch(0.95 0.005 270)",
  },
  labelStyle: { color: "oklch(0.72 0.02 270)", marginBottom: 4 },
  itemStyle: { color: "oklch(0.95 0.005 270)" },
} as const;

const axisStyle = {
  stroke: "oklch(0.72 0.02 270)",
  fill: "oklch(0.72 0.02 270)",
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
    const avgRRR = pairTrades.reduce((sum, t) => {
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
      const avgRRR = setupTrades.reduce((sum, t) => {
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
    return [{ type: "tip", title: "Build Your Data", body: `Log at least 3 trades to unlock AI insights. You have ${list.length} trade${list.length === 1 ? "" : "s"} logged.` }];
  }
  const out: { type: "strength" | "opportunity" | "warning" | "tip"; title: string; body: string }[] = [];
  const patterns = aggregateTradePatterns(list);

  if (m.winRate >= 60) out.push({ type: "strength", title: "Strong Win Rate", body: `Your win rate of ${pct(m.winRate)} is above 60%. Combined with consistent RRR, this is a reliable edge.` });
  else if (m.winRate < 40) out.push({ type: "warning", title: "Win Rate Below 40%", body: `Your current win rate is ${pct(m.winRate)}. Review trade entry criteria and reduce low-probability setups.` });

  if (m.profitFactor >= 2) out.push({ type: "strength", title: "Excellent Profit Factor", body: `A profit factor of ${m.profitFactor.toFixed(2)} means you earn ${m.profitFactor.toFixed(2)}x for every $1 lost. Protect this edge.` });
  else if (m.profitFactor > 0 && m.profitFactor < 1.2) out.push({ type: "warning", title: "Low Profit Factor", body: `Your profit factor of ${m.profitFactor.toFixed(2)} is close to breakeven. Tighten stops or improve RRR.` });

  if (m.maxDrawdown < 0) out.push({ type: "warning", title: "Significant Drawdown", body: `You have experienced a drawdown of ${money(m.maxDrawdown, "$")}. Consider reducing position size during losing streaks.` });

  if (m.avgRRR >= 2) out.push({ type: "strength", title: "Disciplined Risk:Reward", body: `Average RRR of 1:${m.avgRRR.toFixed(2)} shows asymmetric setups. This compounds well over time.` });
  else if (m.avgRRR > 0 && m.avgRRR < 1.5) out.push({ type: "opportunity", title: "Improve Your RRR", body: `Average RRR of 1:${m.avgRRR.toFixed(2)} leaves room for improvement. Focus on wider TPs or tighter stops.` });

  if (patterns?.bestSetup) out.push({ type: "strength", title: `Best Setup: ${patterns.bestSetup.name}`, body: `${patterns.bestSetup.name} wins ${patterns.bestSetup.winRate}% of the time across ${patterns.bestSetup.trades} trades. Prioritize this setup.` });
  if (patterns?.worstSetup && patterns.worstSetup.name !== patterns.bestSetup?.name) out.push({ type: "opportunity", title: `Review: ${patterns.worstSetup.name}`, body: `${patterns.worstSetup.name} shows only ${patterns.worstSetup.winRate}% win rate. Refine execution criteria.` });
  if (patterns?.topMistakes?.[0]) { const m0 = patterns.topMistakes[0]!; out.push({ type: "warning", title: `Recurring Mistake: "${m0.name}"`, body: `This mistake appears in ${m0.count} trade${m0.count > 1 ? "s" : ""}. Addressing it directly could improve results.` }); }
  if (patterns?.trend === "Improving") out.push({ type: "tip", title: "Improving Form", body: `Last 10 trades show ${patterns.recent10WinRate}% WR vs overall ${patterns.overallWinRate}%. Stay consistent.` });
  else if (patterns?.trend === "Deteriorating") out.push({ type: "warning", title: "Declining Recent Form", body: `Last 10 trades show ${patterns.recent10WinRate}% WR vs overall ${patterns.overallWinRate}%. Review recent setups carefully.` });

  return out.length > 0 ? out.slice(0, 6) : [{ type: "tip", title: "Keep Building", body: `With ${list.length} trades logged, your data is growing. Log more with setups and mistakes to unlock deeper insights.` }];
}

function KpiCard({ icon, label, value, sub, tone = "neutral" }: {
  icon: React.ReactNode; label: string; value: string; sub?: string | undefined;
  tone?: "positive" | "negative" | "neutral" | "primary" | "warning" | undefined;
}) {
  const toneText = { positive: "text-emerald-400", negative: "text-red-400", neutral: "text-foreground", primary: "text-primary", warning: "text-amber-400" }[tone];
  const iconBg = { positive: "bg-emerald-500/15 text-emerald-400", negative: "bg-red-500/15 text-red-400", neutral: "bg-muted/60 text-muted-foreground", primary: "bg-primary/15 text-primary", warning: "bg-amber-500/15 text-amber-400" }[tone];
  return (
    <div className="glass-card-3d elevated-surface group relative animate-rise overflow-hidden rounded-2xl p-4 transition-all duration-300">
      <div className="pointer-events-none absolute -right-8 -top-8 size-20 rounded-full bg-primary/0 blur-2xl transition-all duration-700 group-hover:bg-primary/10" />
      <div className="relative z-10 flex items-center gap-3">
        <div className={cn("grid size-9 shrink-0 place-items-center rounded-xl", iconBg)}>{icon}</div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      </div>
      <p className={cn("relative z-10 mt-3 font-display text-2xl font-semibold", toneText)}>{value}</p>
      {sub && <p className="relative z-10 mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function PerformanceTable({ rows, currencySymbol }: {
  rows: { name: string; trades: number; winRate: number; pnl: number; avgRRR: number }[];
  currencySymbol: string;
}) {
  if (rows.length === 0) return <div className="flex h-28 items-center justify-center text-sm text-muted-foreground">Not enough data</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[400px] text-sm">
        <thead>
          <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <th className="pb-2.5 font-medium">Name</th>
            <th className="pb-2.5 font-medium">Trades</th>
            <th className="pb-2.5 font-medium">Win Rate</th>
            <th className="pb-2.5 font-medium">Avg RRR</th>
            <th className="pb-2.5 text-right font-medium">Net PnL</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-border/40 transition hover:bg-muted/10">
              <td className="py-2.5 font-semibold text-foreground">{row.name}</td>
              <td className="py-2.5 text-muted-foreground">{row.trades}</td>
              <td className="py-2.5">
                <span className={cn("inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  row.winRate >= 60 ? "bg-emerald-500/15 text-emerald-400" :
                  row.winRate >= 40 ? "bg-amber-500/15 text-amber-400" :
                  "bg-red-500/15 text-red-400")}>
                  {pct(row.winRate)}
                </span>
              </td>
              <td className="py-2.5 text-muted-foreground">1:{row.avgRRR.toFixed(2)}</td>
              <td className={cn("py-2.5 text-right font-semibold", row.pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
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
  strength: { icon: <CheckCircle2 className="size-4" />, bg: "bg-emerald-500/10 border-emerald-500/25", iconColor: "text-emerald-400", label: "Strength", labelColor: "text-emerald-400" },
  opportunity: { icon: <Lightbulb className="size-4" />, bg: "bg-primary/10 border-primary/25", iconColor: "text-primary", label: "Opportunity", labelColor: "text-primary" },
  warning: { icon: <AlertTriangle className="size-4" />, bg: "bg-amber-500/10 border-amber-500/25", iconColor: "text-amber-400", label: "Watch Out", labelColor: "text-amber-400" },
  tip: { icon: <Zap className="size-4" />, bg: "bg-purple-500/10 border-purple-500/25", iconColor: "text-purple-400", label: "Tip", labelColor: "text-purple-400" },
};

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-muted/30", className)} />;
}

function Reports() {
  const { userSettings } = useAuth();
  const currencySymbol = userSettings?.currency?.split(" ")[1]?.replace(/[()]/g, "") || "$";
  const [userTrades, setUserTrades] = useState<Trade[] | null>(null);
  const [dateRange, setDateRange] = useState<"all" | "7d" | "30d" | "90d" | "this-month" | "this-week">("all");

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
        case "7d": return diffDays <= 7;
        case "30d": return diffDays <= 30;
        case "90d": return diffDays <= 90;
        case "this-month": return tradeDate.getUTCMonth() === now.getUTCMonth() && tradeDate.getUTCFullYear() === now.getUTCFullYear();
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

  const sortedTrades = useMemo(() => [...filteredTrades].sort((a, b) => (a.date < b.date ? -1 : 1)), [filteredTrades]);
  const m = useMemo(() => reportMetrics(filteredTrades), [filteredTrades]);
  const eq = useMemo(() => equityCurve(sortedTrades), [sortedTrades]);
  const months = useMemo(() => monthly(filteredTrades), [filteredTrades]);
  const weeklyData = useMemo(() => weekly(filteredTrades), [filteredTrades]);
  const instruments = useMemo(() => instrumentStats(filteredTrades), [filteredTrades]);
  const setups = useMemo(() => setupStats(filteredTrades), [filteredTrades]);
  const insights = useMemo(() => generateInsights(filteredTrades, m), [filteredTrades, m]);

  if (userTrades === null) {
    return (
      <AppShell title="Reports" subtitle="Performance overview & analytics">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-[100px]" />)}</div>
          <Skeleton className="h-[280px]" />
          <div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-[280px]" /><Skeleton className="h-[280px]" /></div>
        </div>
      </AppShell>
    );
  }

  if (userTrades.length === 0) {
    return (
      <AppShell title="Reports" subtitle="Performance overview & analytics">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex max-w-sm flex-col items-center gap-4 text-center">
            <div className="grid size-16 place-items-center rounded-2xl border border-border bg-card/60 shadow-lg"><FileText className="size-8 text-muted-foreground/60" /></div>
            <div><h3 className="font-display text-lg font-semibold">No trade data yet</h3><p className="mt-1 text-sm text-muted-foreground">Add your first trade in the Journal to generate your performance report.</p></div>
          </div>
        </div>
      </AppShell>
    );
  }

  const hasFilteredData = filteredTrades.length > 0;

  return (
    <AppShell title="Reports" subtitle="Performance overview & analytics">
      {/* Date filter bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/60 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-primary" />
          <div>
            <p className="text-xs font-semibold">Filter Report</p>
            <p className="text-[10px] text-muted-foreground">{hasFilteredData ? `${filteredTrades.length} trades in range` : "No trades in range"}</p>
          </div>
        </div>
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
          className="cursor-pointer rounded-xl border border-border bg-card px-3 py-1.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary/50">
          <option value="all">All Time</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="this-month">This Month</option>
          <option value="this-week">This Week</option>
        </select>
      </div>

      {!hasFilteredData ? (
        <div className="flex h-[40vh] items-center justify-center text-center">
          <div className="flex flex-col items-center gap-3">
            <Activity className="size-10 text-muted-foreground/40" />
            <p className="font-display text-base font-semibold">No trades in selected period</p>
            <p className="text-sm text-muted-foreground">Try selecting a wider date range or add trades in the Journal.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* KPI Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <KpiCard icon={<Wallet className="size-4" />} label="Net PnL" value={money(m.net, currencySymbol)} sub={`${m.wins}W / ${m.losses}L`} tone={m.net >= 0 ? "positive" : "negative"} />
            <KpiCard icon={<Activity className="size-4" />} label="Total Trades" value={String(m.total)} sub={m.breakeven > 0 ? `${m.breakeven} breakeven` : undefined} tone="neutral" />
            <KpiCard icon={<Target className="size-4" />} label="Win Rate" value={pct(m.winRate)} sub={`${pct(100 - m.winRate)} loss rate`} tone={m.winRate >= 55 ? "positive" : m.winRate >= 40 ? "warning" : "negative"} />
            <KpiCard icon={<Scale className="size-4" />} label="Profit Factor" value={m.profitFactor > 0 ? m.profitFactor.toFixed(2) : "-"} sub={`Avg RRR 1:${m.avgRRR.toFixed(2)}`} tone={m.profitFactor >= 1.5 ? "positive" : m.profitFactor >= 1 ? "warning" : "negative"} />
            <KpiCard icon={<TrendingDown className="size-4" />} label="Max Drawdown" value={money(m.maxDrawdown, currencySymbol)} sub="peak to valley" tone={m.maxDrawdown === 0 ? "positive" : "negative"} />
          </div>

          {/* Equity Curve */}
          <Panel title="Cumulative P&L">
            <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="inline-block size-2 rounded-full bg-primary" />Cumulative PnL</span>
              <span>Start: {money(0, currencySymbol)} — Current: <span className={cn("font-semibold", m.net >= 0 ? "text-emerald-400" : "text-red-400")}>{money(m.net, currencySymbol)}</span></span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={eq} margin={{ left: -10, right: 4, top: 6 }}>
                <defs>
                  <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="oklch(0.28 0.04 270)" />
                <XAxis dataKey="date" {...axisStyle} tickFormatter={(v: string) => v ? new Date(`${v}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""} interval={Math.max(0, Math.floor(eq.length / 6) - 1)} />
                <YAxis {...axisStyle} width={58} tickFormatter={(v: number) => Math.abs(v) >= 1000 ? `${v < 0 ? '-' : ''}${currencySymbol}${Math.abs(v) / 1000}k` : `${v < 0 ? '-' : ''}${currencySymbol}${Math.abs(v)}`} />
                <Tooltip {...tooltipStyle} formatter={(val: number) => [money(val, currencySymbol), "Cumulative P&L"]} labelFormatter={(l: string) => l ? new Date(`${l}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : ""} />
                <Area type="monotone" dataKey="equity" stroke="var(--color-primary)" strokeWidth={2.4} fill="url(#eqGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          {/* P&L Distribution + Summary */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="P&L Distribution">
              <div className="space-y-3">
                {[
                  { label: "Profitable", count: m.wins, pct: m.total > 0 ? (m.wins / m.total) * 100 : 0, bar: "bg-emerald-500", text: "text-emerald-400" },
                  { label: "Losing", count: m.losses, pct: m.total > 0 ? (m.losses / m.total) * 100 : 0, bar: "bg-red-500", text: "text-red-400" },
                  { label: "Breakeven", count: m.breakeven, pct: m.total > 0 ? (m.breakeven / m.total) * 100 : 0, bar: "bg-muted-foreground", text: "text-muted-foreground" },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className={cn("font-semibold", row.text)}>{row.count} ({pct(row.pct)})</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
                      <div className={cn("h-full rounded-full transition-all duration-700", row.bar)} style={{ width: `${row.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border/50 pt-4">
                {[
                  { label: "Largest Win", value: money(m.largestWin, currencySymbol), color: "text-emerald-400" },
                  { label: "Largest Loss", value: money(m.largestLoss, currencySymbol), color: "text-red-400" },
                  { label: "Avg Win", value: money(Math.round(m.avgWin), currencySymbol), color: "text-emerald-400" },
                  { label: "Avg Loss", value: money(-Math.round(m.avgLoss), currencySymbol), color: "text-red-400" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-muted/30 p-3 text-center">
                    <p className="text-[10px] text-muted-foreground">{item.label}</p>
                    <p className={cn("mt-0.5 font-display text-base font-semibold", item.color)}>{item.value}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Performance Summary" className="lg:col-span-2">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Total Trades", value: String(m.total), icon: <Activity className="size-3.5" /> },
                  { label: "Win Rate", value: pct(m.winRate), icon: <Target className="size-3.5" /> },
                  { label: "Profit Factor", value: m.profitFactor > 0 ? m.profitFactor.toFixed(2) : "N/A", icon: <Percent className="size-3.5" /> },
                  { label: "Avg Risk:Reward", value: `1:${m.avgRRR.toFixed(2)}`, icon: <Scale className="size-3.5" /> },
                  { label: "Net PnL", value: money(m.net, currencySymbol), icon: <Wallet className="size-3.5" />, valueColor: m.net >= 0 ? "text-emerald-400" : "text-red-400" },
                  { label: "Win Streak", value: `${m.winStreak} trades`, icon: <Trophy className="size-3.5" />, valueColor: "text-emerald-400" },
                  { label: "Loss Streak", value: `${m.lossStreak} trades`, icon: <Shield className="size-3.5" />, valueColor: "text-red-400" },
                  { label: "Max Drawdown", value: money(m.maxDrawdown, currencySymbol), icon: <TrendingDown className="size-3.5" />, valueColor: m.maxDrawdown === 0 ? undefined : "text-amber-400" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-3.5 py-2.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">{row.icon}{row.label}</div>
                    <span className={cn("font-display text-sm font-semibold", row.valueColor ?? "text-foreground")}>{row.value}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* Instrument & Setup performance */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Performance by Instrument"><PerformanceTable rows={instruments} currencySymbol={currencySymbol} /></Panel>
            <Panel title="Performance by Setup"><PerformanceTable rows={setups} currencySymbol={currencySymbol} /></Panel>
          </div>

          {/* Weekly + Monthly charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Weekly Performance">
              {weeklyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={weeklyData} margin={{ left: -18, right: 4, top: 6 }}>
                    <CartesianGrid vertical={false} stroke="oklch(0.28 0.04 270)" />
                    <XAxis dataKey="label" {...axisStyle} interval={0} />
                    <YAxis {...axisStyle} width={52} />
                    <Tooltip {...tooltipStyle} formatter={(val: number, _: string, props: any) => [money(val, currencySymbol), `${props.payload.trades} trades - ${pct(props.payload.winRate)} WR`]} />
                    <Bar dataKey="pnl" radius={[8, 8, 4, 4]}>
                      {weeklyData.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? "oklch(0.65 0.15 155)" : "oklch(0.58 0.18 22)"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">Not enough data for selected period</div>}
            </Panel>

            <Panel title="Monthly Performance">
              {months.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={months} margin={{ left: -18, right: 4, top: 6 }}>
                      <CartesianGrid vertical={false} stroke="oklch(0.28 0.04 270)" />
                      <XAxis dataKey="label" {...axisStyle} interval={0} />
                      <YAxis {...axisStyle} width={52} />
                      <Tooltip {...tooltipStyle} formatter={(val: number) => [money(val, currencySymbol), "PnL"]} />
                      <Bar dataKey="pnl" radius={[8, 8, 4, 4]}>
                        {months.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? "oklch(0.65 0.15 155)" : "oklch(0.58 0.18 22)"} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-3 space-y-1">
                    {months.slice(-3).map((mo) => (
                      <div key={mo.name} className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-1.5 text-xs">
                        <span className="font-medium text-foreground">{mo.label}</span>
                        <span className="text-muted-foreground">{mo.trades} trades - {pct(mo.winRate)}</span>
                        <span className={mo.pnl >= 0 ? "font-semibold text-emerald-400" : "font-semibold text-red-400"}>{money(mo.pnl, currencySymbol)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">Not enough data for selected period</div>}
            </Panel>
          </div>

          {/* AI Insights */}
          <Panel title="AI Insights" action={
            <div className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
              <Brain className="size-3" />Based on your real data
            </div>
          }>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {insights.map((insight, i) => {
                const cfg = insightConfig[insight.type];
                return (
                  <div key={i} className={cn("rounded-2xl border p-4 transition hover:scale-[1.01]", cfg.bg)}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className={cfg.iconColor}>{cfg.icon}</span>
                      <span className={cn("text-[11px] font-semibold uppercase tracking-wider", cfg.labelColor)}>{cfg.label}</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{insight.title}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{insight.body}</p>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* Footer */}
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            All performance metrics are calculated from your actual trades - {filteredTrades.length} trade{filteredTrades.length !== 1 ? "s" : ""} analysed
          </p>
        </div>
      )}
    </AppShell>
  );
}
