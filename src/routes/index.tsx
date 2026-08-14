// Dashboard — Open Access Clean UI
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Panel, StatCard, Badge } from "@/components/app/ui-kit";
import { BarsChart, EquityChart, WinLossPie } from "@/components/app/charts";
import {
  equityCurve,
  fetchUserTrades,
  monthly,
  money,
  pct,
  pnlUsd,
  stats,
  aggregateTradePatterns,
  type Trade,
} from "@/lib/trades";
import {
  Activity,
  Flame,
  Percent,
  Scale,
  Snowflake,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Wallet,
  Crown,
  Brain,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { goldenRules } from "@/lib/golden-rules";
import { DecisionReplayCard } from "@/components/app/DecisionReplayCard";

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

function Dashboard() {
  const [userTrades, setUserTrades] = useState<Trade[]>([]);

  useEffect(() => {
    fetchUserTrades().then((data) => setUserTrades(data));
  }, []);

  const s = stats(userTrades);
  const eq = equityCurve(userTrades);
  const months = monthly(userTrades);
  const recent = [...userTrades].slice(-8).reverse();
  const weekly = months
    .slice(-7)
    .map((m, i) => ({ label: `W${i + 1}`, pnl: Math.round(m.pnl / 4) }));

  const dayIndex = Math.floor(Date.now() / 86400000);
  const todaysRule = goldenRules[dayIndex % goldenRules.length] ?? goldenRules[0];

  const patternSummary = aggregateTradePatterns(userTrades);
  let dynamicInsight = "";
  if (patternSummary) {
    if (patternSummary.topMistakes.length > 0 && patternSummary.topMistakes[0]) {
      dynamicInsight = `Current focus: Reduce "${patternSummary.topMistakes[0].name}" mistakes.`;
    } else if (patternSummary.bestSetup) {
      dynamicInsight = `Strongest edge: ${patternSummary.bestSetup.name} (${patternSummary.bestSetup.winRate}% WR).`;
    } else if (patternSummary.trend === "Improving") {
      dynamicInsight = "Your recent performance is trending up. Keep it going!";
    } else {
      dynamicInsight = "Log more detailed trades to unlock deep pattern analysis.";
    }
  }

  const hasTrades = userTrades.length > 0;

  if (!hasTrades) {
    return (
      <AppShell title="Dashboard" subtitle="Track. Analyze. Improve.">
        <section className="surface-glass elevation-1 relative overflow-hidden rounded-[2rem] p-10 text-center flex flex-col items-center justify-center min-h-[50vh]">
          <div className="absolute -left-24 -top-32 size-80 rounded-full bg-primary/5 blur-[80px]" />
          <div className="absolute -right-20 -bottom-32 size-72 rounded-full bg-accent/20 blur-[80px]" />
          <div className="relative z-10 grid shrink-0 size-16 place-items-center rounded-2xl bg-primary text-primary-foreground elevation-1 mb-6">
            <Target className="size-8" />
          </div>
          <h2 className="relative z-10 font-display text-2xl font-extrabold mb-2 text-foreground">
            Your trading journey starts here.
          </h2>
          <p className="relative z-10 max-w-sm text-sm font-medium text-muted-foreground mb-8">
            Log your first trade to unlock AI insights, performance analytics, and your personalized
            equity curve.
          </p>
          <Link
            to="/journal"
            className="relative z-10 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all duration-200 hover:-translate-y-[2px] elevation-1 hover:elevation-2"
          >
            Log your first trade
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell title="Dashboard" subtitle="Track. Analyze. Improve.">
      <section className="neon-card neon-glow-aurora relative p-8 sm:p-10">
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-400 border border-emerald-500/30">
              Net Performance
            </span>
            <p className="mt-6 font-display text-5xl font-extrabold leading-none text-foreground sm:text-6xl lg:text-7xl tabular-nums">
              {money(s.net)}
            </p>
            <p className="mt-5 max-w-md text-sm font-medium text-muted-foreground leading-relaxed">
              {s.total} trades logged · {pct(s.winRate)} win rate · profit factor{" "}
              {s.profitFactor.toFixed(2)}. Aapka edge data mein clearly visible hai.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/journal"
                className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all duration-200 hover:-translate-y-[2px] shadow-[0_0_16px_rgba(99,102,241,0.4)]"
              >
                Log a trade
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { k: "Win Rate", v: pct(s.winRate), glow: "neon-glow-green" },
              { k: "Avg RRR", v: `1:${s.avgRRR.toFixed(2)}`, glow: "neon-glow-purple" },
              { k: "Monthly", v: money(s.monthlyPnl), glow: s.monthlyPnl >= 0 ? "neon-glow-green" : "neon-glow-red" },
            ].map((i) => (
              <div
                key={i.k}
                className={cn("neon-card p-5 text-center flex flex-col justify-center min-h-[100px]", i.glow)}
              >
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  {i.k}
                </p>
                <p className="mt-2 font-display text-xl sm:text-2xl font-bold tabular-nums text-foreground">{i.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive AI & Psychology Section */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Premium AI Mentor Card */}
        <Panel title="AI Trading Mentor" className="neon-glow-purple flex flex-col h-full">
          <div className="flex flex-col justify-between flex-1 gap-4 p-1 sm:p-2 mt-2">
            <div className="flex items-start gap-4">
              <div className="grid shrink-0 size-12 place-items-center rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
                <Brain className="size-6" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-lg font-bold text-foreground">
                  Consult AI Mentor
                </p>
                <p className="mt-1 text-sm font-medium text-muted-foreground break-words">
                  Ask questions, analyze your trading, and improve your performance instantly.
                </p>
                {dynamicInsight && (
                  <div className="mt-3 inline-block rounded-lg bg-purple-500/15 border border-purple-500/30 px-3 py-1.5 text-[13px] font-bold text-purple-300">
                    <Sparkles className="mr-1.5 inline size-3.5" />
                    {dynamicInsight}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 sm:mt-auto">
              <Link
                to="/ai-coach"
                search={{ chat: false }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-[1px] shadow-[0_0_16px_rgba(168,85,247,0.4)]"
              >
                Open Mentor Session
                <ChevronRight className="size-4" />
              </Link>
            </div>
          </div>
        </Panel>

        {/* Dynamic Golden Rule Section */}
        <Panel title="Golden Rule" className="neon-glow-amber flex flex-col h-full">
          <div className="group relative flex flex-col justify-center flex-1 gap-4 p-5 sm:p-6 sm:items-center sm:flex-row sm:justify-start overflow-hidden transition">
            <div className="relative z-10 grid shrink-0 size-12 place-items-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Crown className="size-6" />
            </div>

            <div className="relative z-10 min-w-0 flex-1">
              <p className="font-display text-lg font-medium sm:text-xl text-foreground leading-relaxed break-words italic">
                "{todaysRule}"
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <StatCard
          label="Total Trades"
          value={String(s.total)}
          sub="all time"
          icon={<Activity className="size-4" />}
          to="/journal"
        />
        <StatCard
          label="Win Rate"
          value={pct(s.winRate)}
          icon={<Target className="size-4" />}
          accent="success"
          to="/analytics"
        />
        <StatCard
          label="Average RRR"
          value={`1 : ${s.avgRRR.toFixed(2)}`}
          sub="risk / reward"
          icon={<Scale className="size-4" />}
          accent="accent"
          to="/analytics"
        />
        <StatCard
          label="Profit Factor"
          value={s.profitFactor.toFixed(2)}
          icon={<Percent className="size-4" />}
          to="/analytics"
        />
        <StatCard
          label="Monthly PnL"
          value={money(s.monthlyPnl)}
          icon={<Wallet className="size-4" />}
          accent={s.monthlyPnl >= 0 ? "success" : "destructive"}
          to="/analytics"
        />
        <StatCard
          label="Win Streak"
          value={`${s.winStreak}`}
          sub="consecutive wins"
          icon={<Flame className="size-4" />}
          accent="success"
          to="/analytics"
        />
        <StatCard
          label="Loss Streak"
          value={`${s.lossStreak}`}
          sub="consecutive losses"
          icon={<Snowflake className="size-4" />}
          accent="destructive"
          to="/analytics"
        />
        <StatCard
          label="Best Pair"
          value={s.bestPair.name}
          sub={`${money(s.bestPair.pnl)} · ${pct(s.bestPair.winRate)}`}
          icon={<Trophy className="size-4" />}
          accent="success"
          to="/analytics"
        />
        <StatCard
          label="Worst Pair"
          value={s.worstPair.name}
          sub={`${money(s.worstPair.pnl)} · ${pct(s.worstPair.winRate)}`}
          icon={<TrendingDown className="size-4" />}
          accent="destructive"
          to="/analytics"
        />
        <StatCard
          label="Weekly PnL"
          value={money(s.weeklyPnl)}
          icon={<TrendingUp className="size-4" />}
          accent="accent"
          to="/analytics"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel
          title="Equity Curve"
          className="neon-glow-green lg:col-span-2"
          action={<Badge tone={s.net >= 0 ? "win" : "loss"}>{money(s.net)} net</Badge>}
        >
          <EquityChart data={eq} />
        </Panel>
        <Panel title="Win / Loss Split" className="neon-glow-purple">
          <WinLossPie wins={s.wins} losses={s.losses} />
          <div className="mt-2 flex justify-center gap-5 text-xs">
            <span className="flex items-center gap-2">
              <i className="size-2 rounded-full bg-success" />
              {s.wins} Wins
            </span>
            <span className="flex items-center gap-2">
              <i className="size-2 rounded-full bg-destructive" />
              {s.losses} Losses
            </span>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Monthly Performance" className="neon-glow-blue">
          <BarsChart data={months} />
        </Panel>
        <Panel title="Weekly Performance" className="neon-glow-green">
          <BarsChart data={weekly} />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel
          title="Recent Trades"
          className="neon-glow-blue lg:col-span-2"
          action={
            <Link to="/journal" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          }
        >
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  {["Date", "Pair", "Side", "Session", "RRR", "Result", "PnL"].map((h) => (
                    <th key={h} className="px-2 pb-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((t, index) => (
                  <tr key={t.id} className={cn(
                    "border-t border-border transition-all duration-200 hover:-translate-y-[1px] hover:elevation-1 relative bg-surface",
                    index % 2 !== 0 && "bg-muted/30"
                  )}>
                    <td className="px-2 py-3 text-muted-foreground text-sm font-medium">{t.date}</td>
                    <td className="px-2 py-3 font-semibold text-foreground">{t.pair}</td>
                    <td className="px-2 py-3">
                      <Badge tone={t.side === "Buy" ? "primary" : "muted"}>{t.side}</Badge>
                    </td>
                    <td className="px-2 py-3 text-muted-foreground text-sm font-medium">{t.session}</td>
                    <td className="px-2 py-3 font-medium text-foreground">{t.rrr}</td>
                    <td className="px-2 py-3">
                      <Badge tone={t.result === "Win" ? "win" : "loss"}>{t.result}</Badge>
                    </td>
                    <td
                      className={`px-2 py-3 font-bold tabular-nums ${pnlUsd(t) >= 0 ? "text-success" : "text-danger"}`}
                    >
                      {money(pnlUsd(t))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <DecisionReplayCard trades={userTrades} />
      </div>
    </AppShell>
  );
}
