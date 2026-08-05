import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { Badge, Panel } from "@/components/app/ui-kit";
import { BarsChart, TrendChart } from "@/components/app/charts";
import { money, monthly, pct, stats } from "@/lib/trades";
import { Download, FileText } from "lucide-react";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Trading Journal AI" },
      { name: "description", content: "Weekly and monthly trading reports with exportable performance summaries." },
      { property: "og:title", content: "Reports — Trading Journal AI" },
      { property: "og:description", content: "Download weekly and monthly trading performance reports." },
    ],
  }),
  component: Reports,
});

function Reports() {
  const months = monthly();
  const s = stats();
  const weekly = months.slice(-6).map((m, i) => ({ label: `Week ${i + 1}`, pnl: Math.round(m.pnl / 4), winRate: m.winRate }));

  return (
    <AppShell title="Reports" subtitle="Weekly & monthly performance summaries">
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Monthly Report" className="lg:col-span-2" action={<button className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-accent px-3 py-1.5 text-xs font-semibold text-primary-foreground"><Download className="size-3.5" /> Export</button>}>
          <BarsChart data={months} />
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {months.map((m) => (
              <div key={m.name} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5 text-sm">
                <span className="font-medium">{m.label}</span>
                <span className="text-xs text-muted-foreground">{m.trades} trades · {pct(m.winRate)}</span>
                <span className={m.pnl >= 0 ? "font-semibold text-[oklch(0.72_0.19_155)]" : "font-semibold text-destructive"}>{money(m.pnl)}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Summary">
          <div className="space-y-3 text-sm">
            {[
              ["Total Trades", String(s.total)], ["Win Rate", pct(s.winRate)],
              ["Profit Factor", s.profitFactor.toFixed(2)], ["Average RRR", `1:${s.avgRRR.toFixed(2)}`],
              ["Net PnL", money(s.net)], ["Best Pair", s.bestPair.name],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {["Monthly report — Jul 2026", "Weekly report — W27", "Tax summary 2026"].map((r) => (
              <button key={r} className="flex w-full items-center gap-2 rounded-xl border border-border bg-card/50 px-3 py-2.5 text-left text-xs transition hover:border-primary/50">
                <FileText className="size-4 text-primary" /> {r}
                <Badge tone="primary">PDF</Badge>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Weekly Performance"><BarsChart data={weekly} /></Panel>
        <Panel title="Win Rate Trend" className="lg:col-span-2"><TrendChart data={months} /></Panel>
      </div>
    </AppShell>
  );
}
