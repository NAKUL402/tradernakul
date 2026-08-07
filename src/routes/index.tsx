// Dashboard — Open Access Clean UI
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Panel, StatCard, Badge } from "@/components/app/ui-kit";
import { BarsChart, EquityChart, WinLossPie } from "@/components/app/charts";
import { equityCurve, fetchUserTrades, monthly, money, pct, pnlUsd, stats, type Trade } from "@/lib/trades";
import { Activity, Flame, Percent, Scale, Snowflake, TrendingDown, TrendingUp, Trophy } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Trading Journal AI" },
      { name: "description", content: "Track, analyze and improve your trading with AI-powered analytics, equity curves and performance insights." },
      { property: "og:title", content: "Dashboard — Trading Journal AI" },
      { property: "og:description", content: "Track, analyze and improve your trading with AI-powered analytics, equity curves and performance insights." },
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
  const weekly = months.slice(-7).map((m, i) => ({ label: `W${i + 1}`, pnl: Math.round(m.pnl / 4) }));

  return (
    <AppShell title="Dashboard" subtitle="Track. Analyze. Improve.">
      <section className="glass relative animate-rise overflow-hidden rounded-[2rem] p-6 sm:p-8">
        <div className="pointer-events-none absolute -left-24 -top-32 size-80 rounded-full bg-primary/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-32 size-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
              Net Performance
            </span>
            <p className="mt-5 font-display text-5xl leading-none text-gradient sm:text-6xl lg:text-7xl">
              {money(s.net)}
            </p>
            <p className="mt-4 max-w-md text-sm text-muted-foreground">
              {s.total} trades logged · {pct(s.winRate)} win rate · profit factor {s.profitFactor.toFixed(2)}. Aapka edge data mein clearly visible hai.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/journal" className="rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 glow-primary">
                Log a trade
              </Link>
              <Link to="/ai-coach" className="rounded-xl border border-border bg-card/40 px-5 py-2.5 text-sm font-medium transition hover:bg-card/70">
                Ask AI Coach
              </Link>
            </div>
          </div>
          <div className="flex justify-center sm:justify-end">
            <div className="hairline rounded-2xl bg-background/30 p-4 text-center min-w-[140px]">
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Avg RRR</p>
              <p className="mt-2 font-display text-xl sm:text-2xl">1:{s.avgRRR.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total Trades" value={String(s.total)} sub="all time" icon={<Activity className="size-4" />} />
        <StatCard label="Average RRR" value={`1 : ${s.avgRRR.toFixed(2)}`} sub="risk / reward" icon={<Scale className="size-4" />} accent="accent" />
        <StatCard label="Profit Factor" value={s.profitFactor.toFixed(2)} delta={1.8} icon={<Percent className="size-4" />} />
        <StatCard label="Win Streak" value={`${s.winStreak}`} sub="consecutive wins" icon={<Flame className="size-4" />} accent="success" />
        <StatCard label="Loss Streak" value={`${s.lossStreak}`} sub="consecutive losses" icon={<Snowflake className="size-4" />} accent="destructive" />
        <StatCard label="Best Pair" value={s.bestPair.name} sub={`${money(s.bestPair.pnl)} · ${pct(s.bestPair.winRate)}`} icon={<Trophy className="size-4" />} accent="success" />
        <StatCard label="Worst Pair" value={s.worstPair.name} sub={`${money(s.worstPair.pnl)} · ${pct(s.worstPair.winRate)}`} icon={<TrendingDown className="size-4" />} accent="destructive" />
        <StatCard label="Weekly PnL" value={money(s.weeklyPnl)} delta={2.6} icon={<TrendingUp className="size-4" />} accent="accent" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel
          title="Equity Curve"
          className="lg:col-span-2"
          action={<Badge tone={s.net >= 0 ? "win" : "loss"}>{money(s.net)} net</Badge>}
        >
          <EquityChart data={eq} />
        </Panel>
        <Panel title="Win / Loss Split">
          <WinLossPie wins={s.wins} losses={s.losses} />
          <div className="mt-2 flex justify-center gap-5 text-xs">
            <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-[oklch(0.72_0.19_155)]" />{s.wins} Wins</span>
            <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-destructive" />{s.losses} Losses</span>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Monthly Performance"><BarsChart data={months} /></Panel>
        <Panel title="Weekly Performance"><BarsChart data={weekly} /></Panel>
      </div>

      <Panel
        title="Recent Trades"
        className="mt-4"
        action={<Link to="/journal" className="text-xs font-medium text-primary hover:underline">View all</Link>}
      >
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                {["Date", "Pair", "Side", "Session", "RRR", "Result", "PnL"].map((h) => (
                  <th key={h} className="px-2 pb-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((t) => (
                <tr key={t.id} className="border-t border-border/60 transition hover:bg-muted/30">
                  <td className="px-2 py-3 text-muted-foreground">{t.date}</td>
                  <td className="px-2 py-3 font-medium">{t.pair}</td>
                  <td className="px-2 py-3"><Badge tone={t.side === "Buy" ? "primary" : "muted"}>{t.side}</Badge></td>
                  <td className="px-2 py-3 text-muted-foreground">{t.session}</td>
                  <td className="px-2 py-3">1:{t.rrr}</td>
                  <td className="px-2 py-3"><Badge tone={t.result === "Win" ? "win" : "loss"}>{t.result}</Badge></td>
                  <td className={`px-2 py-3 font-semibold ${pnlUsd(t) >= 0 ? "text-[oklch(0.72_0.19_155)]" : "text-destructive"}`}>{money(pnlUsd(t))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
