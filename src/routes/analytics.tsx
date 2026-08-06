import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Badge, Panel, StatCard } from "@/components/app/ui-kit";
import { BarsChart, DrawdownChart, TrendChart } from "@/components/app/charts";
import { DOW, equityCurve, fetchUserTrades, groupStats, money, monthly, pct, stats, type Trade } from "@/lib/trades";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Trading Journal AI" },
      { name: "description", content: "Deep performance analytics: pair, session, setup, day-of-week, time-of-day, drawdown and risk analysis." },
      { property: "og:title", content: "Analytics — Trading Journal AI" },
      { property: "og:description", content: "Interactive charts for pair, session and setup performance plus drawdown and risk analysis." },
    ],
  }),
  component: Analytics,
});

function Table({ rows }: { rows: { name: string; trades: number; winRate: number; pnl: number }[] }) {
  return (
    <div className="overflow-x-auto text-xs sm:text-sm">
      <table className="w-full min-w-[320px]">
        <thead>
          <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <th className="pb-2 font-medium">Name</th>
            <th className="pb-2 font-medium">Trades</th>
            <th className="pb-2 font-medium">Win Rate</th>
            <th className="pb-2 font-medium text-right">PnL</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-border/40 transition hover:bg-muted/10">
              <td className="py-2.5 font-medium">{row.name}</td>
              <td className="py-2.5 text-muted-foreground">{row.trades}</td>
              <td className="py-2.5 text-muted-foreground">{pct(row.winRate)}</td>
              <td className={`py-2.5 text-right font-semibold ${row.pnl >= 0 ? "text-[oklch(0.72_0.19_155)]" : "text-destructive"}`}>
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
  const bySession = groupStats(userTrades, (t) => t.session);
  const bySetup = groupStats(userTrades, (t) => t.setup).sort((a, b) => b.pnl - a.pnl);
  const byDow = groupStats(userTrades, (t) => DOW[new Date(`${t.date}T00:00:00Z`).getUTCDay()]!).map((g) => ({ ...g, label: g.name }));
  const byHour = groupStats(userTrades, (t) => `${t.entryTime.slice(0, 2)}:00`).sort((a, b) => (a.name < b.name ? -1 : 1)).map((g) => ({ ...g, label: g.name }));
  const months = monthly(userTrades);
  const risk = groupStats(userTrades, (t) => `${t.riskPct}%`).sort((a, b) => parseFloat(a.name) - parseFloat(b.name)).map((g) => ({ ...g, label: g.name, count: g.trades }));
  const maxDd = Math.min(...eq.map((e) => e.drawdown));

  return (
    <AppShell title="Analytics" subtitle="Advanced performance breakdown">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Net PnL" value={money(s.net)} accent={s.net >= 0 ? "success" : "destructive"} delta={5.3} />
        <StatCard label="Max Drawdown" value={`${maxDd.toFixed(1)}%`} accent="destructive" sub="peak to valley" />
        <StatCard label="Avg Win" value={money(Math.round(s.avgWin))} accent="success" />
        <StatCard label="Avg Loss" value={money(-Math.round(s.avgLoss))} accent="destructive" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Pair-wise Performance"><BarsChart data={byPair.map((p) => ({ ...p, label: p.name }))} /><Table rows={byPair} /></Panel>
        <Panel title="Session-wise Performance"><BarsChart data={bySession.map((p) => ({ ...p, label: p.name }))} /><Table rows={bySession} /></Panel>
        <Panel title="Setup-wise Performance"><Table rows={bySetup} /></Panel>
        <Panel title="Day of Week"><BarsChart data={byDow} /></Panel>
        <Panel title="Time of Day (entry hour)"><BarsChart data={byHour} height={230} /></Panel>
        <Panel title="Win Rate Trend"><TrendChart data={months} /></Panel>
        <Panel title="Monthly Report"><BarsChart data={months} /><Table rows={months} /></Panel>
        <Panel title="Risk Distribution"><BarsChart data={risk} yKey="count" height={230} /></Panel>
        <Panel title="Drawdown Analysis" className="lg:col-span-2"><DrawdownChart data={eq} /></Panel>
      </div>
    </AppShell>
  );
}
