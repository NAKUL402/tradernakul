import os

target_file = r'src\routes\analytics.tsx'
with open(target_file, 'r', encoding='utf-8') as f:
    content = f.read()

new_content = """import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Panel } from "@/components/app/ui-kit";
import { BarsChart, DrawdownChart, TrendChart } from "@/components/app/charts";
import {
  Activity,
  AlertTriangle,
  Brain,
  Calendar,
  Percent,
  Scale,
  Shield,
  Target,
  TrendingDown,
  Trophy,
  Wallet,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DOW,
  equityCurve,
  fetchUserTrades,
  groupStats,
  money,
  monthly,
  pct,
  stats,
  type Trade,
} from "@/lib/trades";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Edge Journal" },
      {
        name: "description",
        content:
          "Deep performance analytics: pair, session, setup, day-of-week, time-of-day, drawdown and risk analysis.",
      },
    ],
  }),
  component: Analytics,
});

function AnalyticsPanel({ title, action, children, className }: any) {
  return (
    <div className={cn("group relative rounded-xl border border-zinc-800/80 bg-[#111114] p-5 shadow-[0_8px_30px_-5px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] hover:border-zinc-700/80 overflow-hidden flex flex-col", className)}>
      <div className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent" />
      </div>
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-sm font-bold text-zinc-100 tracking-wide">{title}</h3>
          <div className="flex size-4 items-center justify-center rounded-full border border-zinc-800 text-[9px] text-zinc-500">i</div>
        </div>
        {action && <div className="text-xs">{action}</div>}
      </div>
      <div className="relative z-10 flex-1">{children}</div>
    </div>
  );
}

function MetricCard({ icon, label, value, tone = "primary" }: any) {
  const tones = {
    primary: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    positive: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    negative: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    warning: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  };
  return (
    <div className="group relative overflow-hidden rounded-xl border border-zinc-800/60 bg-[#0c0c0e] p-4 transition-all hover:border-zinc-700 hover:bg-zinc-900/50">
      <div className="flex items-center gap-3">
        <div className={cn("flex size-8 items-center justify-center rounded-lg border", tones[tone as keyof typeof tones])}>
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{label}</span>
          <span className="font-display text-lg font-bold text-zinc-100">{value}</span>
        </div>
      </div>
    </div>
  );
}

function Table({
  rows,
}: {
  rows: { name: string; trades: number; winRate: number; pnl: number }[];
}) {
  return (
    <div className="overflow-x-auto text-xs sm:text-sm custom-scrollbar max-h-[300px]">
      <table className="w-full min-w-[320px] text-foreground">
        <thead className="sticky top-0 bg-[#111114] z-10">
          <tr className="border-b border-zinc-800/60 text-left text-[10px] uppercase tracking-wider text-slate-400">
            <th className="pb-2 pt-1 font-medium pl-2">Name</th>
            <th className="pb-2 pt-1 font-medium text-center">Trades</th>
            <th className="pb-2 pt-1 font-medium text-center">Win Rate</th>
            <th className="pb-2 pt-1 font-medium text-right pr-2">PnL</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/40">
          {rows.map((row) => (
            <tr key={row.name} className="transition-colors hover:bg-zinc-800/20 group">
              <td className="py-2.5 pl-2 font-medium text-zinc-300">{row.name}</td>
              <td className="py-2.5 text-center text-slate-400">{row.trades}</td>
              <td className="py-2.5 text-center font-medium text-emerald-500">{pct(row.winRate)}</td>
              <td className={`py-2.5 text-right font-semibold pr-2 ${row.pnl >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                {money(row.pnl)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Analytics() {
  const [userTrades, setUserTrades] = useState<Trade[]>([]);

  useEffect(() => {
    fetchUserTrades().then((data) => setUserTrades(data));
  }, []);

  const s = stats(userTrades);
  const eq = equityCurve(userTrades);
  const byPair = groupStats(userTrades, (t) => t.pair).sort((a, b) => b.pnl - a.pnl);
  const bySession = groupStats(userTrades, (t) => t.session).sort((a, b) => b.pnl - a.pnl);
  const bySetup = groupStats(userTrades, (t) => t.setup).sort((a, b) => b.pnl - a.pnl);
  const byDow = groupStats(
    userTrades,
    (t) => DOW[new Date(`${t.date}T00:00:00Z`).getUTCDay()]!,
  ).map((g) => ({ ...g, label: g.name }));
  const byHour = groupStats(userTrades, (t) => `${t.entryTime.slice(0, 2)}:00`)
    .sort((a, b) => (a.name < b.name ? -1 : 1))
    .map((g) => ({ ...g, label: g.name }));
  const months = monthly(userTrades);
  const risk = groupStats(userTrades, (t) => `${t.riskPct}%`)
    .sort((a, b) => parseFloat(a.name) - parseFloat(b.name))
    .map((g) => ({ ...g, label: g.name, count: g.trades }));
  const maxDd = Math.min(...eq.map((e) => e.drawdown));

  const hasFilteredData = userTrades.length > 0;

  return (
    <AppShell title="Analytics" subtitle="Advanced performance breakdown">
      {!hasFilteredData ? (
        <div className="flex h-[45vh] items-center justify-center text-center">
          <div className="flex flex-col items-center gap-4">
            <Activity className="size-12 text-zinc-700" />
            <p className="font-display text-lg font-bold text-zinc-200">No trades to analyze</p>
            <p className="max-w-xs text-xs text-slate-400">
              Add trades in the Journal to generate analytics.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 pb-12">
          
          {/* ── TOP ROW (3 Charts) ── */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* 1. Drawdown Analysis */}
            <AnalyticsPanel title="Drawdown Analysis" className="border-t-emerald-500/40 relative overflow-hidden shadow-[0_8px_30px_-5px_rgba(0,0,0,0.6)]">
              <div className="absolute inset-0 pointer-events-none rounded-xl shadow-[inset_0_0_60px_rgba(16,185,129,0.05)]"></div>
              <div className="h-[200px] z-10 relative">
                <DrawdownChart data={eq} />
              </div>
            </AnalyticsPanel>

            {/* 2. Pair-wise Performance */}
            <AnalyticsPanel title="Pair-wise Performance" className="border-t-rose-500/40 border-b-emerald-500/40 border-r-blue-500/20 border-l-blue-500/20 relative overflow-hidden shadow-[0_8px_30px_-5px_rgba(0,0,0,0.6)]">
              <div className="absolute inset-0 pointer-events-none rounded-xl shadow-[inset_0_0_60px_rgba(16,185,129,0.05),inset_0_0_60px_rgba(244,63,94,0.05)]"></div>
              <div className="h-[200px] z-10 relative flex flex-col justify-end">
                <BarsChart data={byPair.map(p => ({...p, label: p.name}))} />
              </div>
            </AnalyticsPanel>

            {/* 3. Monthly Performance */}
            <AnalyticsPanel title="Monthly Win Rate Trend">
              <div className="h-[200px]">
                <TrendChart data={months} />
              </div>
            </AnalyticsPanel>
          </div>

          {/* ── Analytics Insights (Neon Row) ── */}
          <div className="relative rounded-2xl border border-zinc-800/60 bg-[#111114] p-5 shadow-[0_8px_30px_-5px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            <div className="flex items-center justify-between mb-5">
               <div className="flex items-center gap-2">
                 <Brain className="size-5 text-indigo-400" />
                 <h2 className="font-display text-[15px] font-bold text-zinc-100">Analytics Insights</h2>
               </div>
               <div className="flex items-center gap-1.5 rounded bg-[#d4af37]/10 px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase text-[#d4af37] border border-[#d4af37]/30 shadow-[0_0_10px_rgba(212,175,55,0.1)]">
                 <AlertTriangle className="size-3" />
                 <span>Based on your real trade data</span>
               </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
               {/* 1. Best Pair */}
               <div className="relative overflow-hidden rounded-xl bg-[#0c0c0e] border border-indigo-500/30 p-4 shadow-[inset_0_0_20px_rgba(99,102,241,0.05),0_4px_20px_rgba(0,0,0,0.5)] transition-all hover:-translate-y-1 hover:border-indigo-500/60 hover:shadow-[inset_0_0_30px_rgba(99,102,241,0.1),0_8px_30px_rgba(0,0,0,0.6)]">
                  <div className="flex items-center gap-2 mb-3">
                     <div className="p-1 rounded-full border border-indigo-500/30 text-indigo-500 bg-indigo-500/5">
                        <TrendingDown className="size-3.5" />
                     </div>
                     <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider">Best Pair</p>
                     <span className="ml-auto text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">TIP</span>
                  </div>
                  <p className="text-lg font-bold text-zinc-100 text-center mb-4">{byPair[0]?.name || "N/A"}</p>
                  <div className="flex justify-between items-center text-center">
                     <div>
                        <p className="text-[9px] text-slate-500 uppercase">Win Rate</p>
                        <p className="text-[13px] font-bold text-emerald-500">{pct(byPair[0]?.winRate || 0)}</p>
                     </div>
                     <div>
                        <p className="text-[9px] text-slate-500 uppercase">Trades</p>
                        <p className="text-[13px] font-bold text-zinc-200">{byPair[0]?.trades || 0}</p>
                     </div>
                  </div>
               </div>

               {/* 2. Best Session */}
               <div className="relative overflow-hidden rounded-xl bg-[#0c0c0e] border border-emerald-500/40 p-4 shadow-[inset_0_0_20px_rgba(16,185,129,0.05),0_4px_20px_rgba(0,0,0,0.5)] transition-all hover:-translate-y-1 hover:border-emerald-500/60 hover:shadow-[inset_0_0_30px_rgba(16,185,129,0.1),0_8px_30px_rgba(0,0,0,0.6)]">
                  <div className="flex items-center gap-2 mb-3">
                     <div className="p-1 rounded-full border border-emerald-500/30 text-emerald-500 bg-emerald-500/5">
                        <Activity className="size-3.5" />
                     </div>
                     <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">Best Session</p>
                     <span className="ml-auto text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">NEW</span>
                  </div>
                  <p className="text-lg font-bold text-zinc-100 text-center mb-4">{bySession[0]?.name || "N/A"}</p>
                  <div className="flex justify-between items-center text-center">
                     <div>
                        <p className="text-[9px] text-slate-500 uppercase">Win Rate</p>
                        <p className="text-[13px] font-bold text-emerald-500">{pct(bySession[0]?.winRate || 0)}</p>
                     </div>
                     <div>
                        <p className="text-[9px] text-slate-500 uppercase">Trades</p>
                        <p className="text-[13px] font-bold text-zinc-200">{bySession[0]?.trades || 0}</p>
                     </div>
                  </div>
               </div>

               {/* 3. Best Setup */}
               <div className="relative overflow-hidden rounded-xl bg-[#0c0c0e] border border-blue-500/40 p-4 shadow-[inset_0_0_20px_rgba(59,130,246,0.05),0_4px_20px_rgba(0,0,0,0.5)] transition-all hover:-translate-y-1 hover:border-blue-500/60 hover:shadow-[inset_0_0_30px_rgba(59,130,246,0.1),0_8px_30px_rgba(0,0,0,0.6)]">
                  <div className="flex items-center gap-2 mb-3">
                     <div className="p-1 rounded-full border border-blue-500/30 text-blue-500 bg-blue-500/5">
                        <Target className="size-3.5" />
                     </div>
                     <p className="text-[11px] font-bold text-blue-500 uppercase tracking-wider flex-1 leading-tight">Best Setup</p>
                     <span className="ml-auto text-[9px] font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">NEW</span>
                  </div>
                  <p className="text-lg font-bold text-zinc-100 text-center mb-4">{bySetup[0]?.name || "N/A"}</p>
                  <div className="flex justify-between items-center text-center">
                     <div>
                        <p className="text-[9px] text-slate-500 uppercase">Win Rate</p>
                        <p className="text-[13px] font-bold text-emerald-500">{pct(bySetup[0]?.winRate || 0)}</p>
                     </div>
                     <div>
                        <p className="text-[9px] text-slate-500 uppercase">Trades</p>
                        <p className="text-[13px] font-bold text-zinc-200">{bySetup[0]?.trades || 0}</p>
                     </div>
                  </div>
               </div>

               {/* 4. Risk Profile */}
               <div className="relative overflow-hidden rounded-xl bg-[#0c0c0e] border border-amber-500/40 p-4 shadow-[inset_0_0_20px_rgba(245,158,11,0.05),0_4px_20px_rgba(0,0,0,0.5)] transition-all hover:-translate-y-1 hover:border-amber-500/60 hover:shadow-[inset_0_0_30px_rgba(245,158,11,0.1),0_8px_30px_rgba(0,0,0,0.6)]">
                  <div className="flex items-center gap-2 mb-3">
                     <div className="p-1 rounded-full border border-amber-500/30 text-amber-500 bg-amber-500/5">
                        <Shield className="size-3.5" />
                     </div>
                     <p className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">Risk Profile</p>
                     <span className="ml-auto text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">NEW</span>
                  </div>
                  <p className="text-lg font-bold text-zinc-100 text-center mb-4">Moderate</p>
                  <div className="flex justify-between items-center text-center">
                     <div>
                        <p className="text-[9px] text-slate-500 uppercase">Max DD</p>
                        <p className="text-[13px] font-bold text-rose-500">{maxDd.toFixed(1)}%</p>
                     </div>
                     <div>
                        <p className="text-[9px] text-slate-500 uppercase">Status</p>
                        <p className="text-[13px] font-bold text-amber-500">Good</p>
                     </div>
                  </div>
               </div>

               {/* 5. Averages */}
               <div className="relative overflow-hidden rounded-xl bg-[#0c0c0e] border border-fuchsia-500/40 p-4 shadow-[inset_0_0_20px_rgba(217,70,239,0.05),0_4px_20px_rgba(0,0,0,0.5)] transition-all hover:-translate-y-1 hover:border-fuchsia-500/60 hover:shadow-[inset_0_0_30px_rgba(217,70,239,0.1),0_8px_30px_rgba(0,0,0,0.6)]">
                  <div className="flex items-center gap-2 mb-3">
                     <div className="p-1 rounded-full border border-fuchsia-500/30 text-fuchsia-500 bg-fuchsia-500/5">
                        <Percent className="size-3.5" />
                     </div>
                     <p className="text-[11px] font-bold text-fuchsia-500 uppercase tracking-wider flex-1">Averages</p>
                  </div>
                  <p className="text-lg font-bold text-zinc-100 text-center mb-4">Healthy</p>
                  <div className="flex justify-between items-center text-center px-2">
                     <div>
                        <p className="text-[9px] text-slate-500 uppercase">Avg Win</p>
                        <p className="text-[13px] font-bold text-emerald-500">{money(s.avgWin)}</p>
                     </div>
                     <div>
                        <p className="text-[9px] text-slate-500 uppercase">Avg Loss</p>
                        <p className="text-[13px] font-bold text-rose-500">{money(Math.abs(s.avgLoss))}</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          {/* ── BOTTOM SECTION: Summary & Tables ── */}
          <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
            {/* Left: Performance Summary Grid */}
            <div className="space-y-4">
              <h2 className="font-display text-[15px] font-bold text-zinc-100 ml-1">Performance Summary</h2>
              <div className="grid grid-cols-2 gap-3">
                <MetricCard icon={<Activity className="size-4" />} label="Net PnL" value={money(s.net)} tone={s.net >= 0 ? "positive" : "negative"} />
                <MetricCard icon={<TrendingDown className="size-4" />} label="Max Drawdown" value={`${maxDd.toFixed(1)}%`} tone="negative" />
                <MetricCard icon={<Target className="size-4" />} label="Avg Win" value={money(Math.round(s.avgWin))} tone="positive" />
                <MetricCard icon={<Shield className="size-4" />} label="Avg Loss" value={money(-Math.round(s.avgLoss))} tone="negative" />
                <MetricCard icon={<Wallet className="size-4" />} label="Total Trades" value={String(s.total)} tone="primary" />
                <MetricCard icon={<Percent className="size-4" />} label="Win Rate" value={pct(s.winRate)} tone="primary" />
                <MetricCard icon={<Trophy className="size-4" />} label="Profit Factor" value={s.profitFactor.toFixed(2)} tone="primary" />
                <MetricCard icon={<Scale className="size-4" />} label="Avg R:R" value={s.avgRRR ? s.avgRRR.toFixed(2) : "0.00"} tone="primary" />
              </div>
            </div>

            {/* Right: Instrument and Setup Tables */}
            <div className="space-y-6">
              <div className="space-y-4">
                 <h2 className="font-display text-[15px] font-bold text-zinc-100 ml-1">Performance by Pair</h2>
                 <div className="rounded-xl border border-zinc-800/80 bg-[#0c0c0e] shadow-lg overflow-hidden">
                   <Table rows={byPair} />
                 </div>
              </div>
              <div className="space-y-4">
                 <h2 className="font-display text-[15px] font-bold text-zinc-100 ml-1">Performance by Session</h2>
                 <div className="rounded-xl border border-zinc-800/80 bg-[#0c0c0e] shadow-lg overflow-hidden">
                   <Table rows={bySession} />
                 </div>
              </div>
            </div>
          </div>

          {/* ── Additional Analytics Row ── */}
          <div className="grid gap-6 lg:grid-cols-2 mt-6">
             <AnalyticsPanel title="Setup-wise Performance">
                <Table rows={bySetup} />
             </AnalyticsPanel>
             <AnalyticsPanel title="Day of Week">
                <div className="h-[300px]">
                   <BarsChart data={byDow} />
                </div>
             </AnalyticsPanel>
             <AnalyticsPanel title="Time of Day (entry hour)">
                <div className="h-[230px]">
                   <BarsChart data={byHour} height={230} />
                </div>
             </AnalyticsPanel>
             <AnalyticsPanel title="Risk Distribution">
                <div className="h-[230px]">
                   <BarsChart data={risk} yKey="count" height={230} />
                </div>
             </AnalyticsPanel>
          </div>

        </div>
      )}
    </AppShell>
  );
}
"""

with open(target_file, 'w', encoding='utf-8') as f:
    f.write(new_content)
