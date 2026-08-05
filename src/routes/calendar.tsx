import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Badge, Panel } from "@/components/app/ui-kit";
import { money, pnlUsd, trades } from "@/lib/trades";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Trading Journal AI" },
      { name: "description", content: "Daily PnL calendar heatmap showing which trading days made money and which cost you." },
      { property: "og:title", content: "Calendar — Trading Journal AI" },
      { property: "og:description", content: "Visual PnL heatmap of every trading day of the month." },
    ],
  }),
  component: CalendarPage,
});

const byDay = new Map<string, number>();
for (const t of trades) byDay.set(t.date, (byDay.get(t.date) ?? 0) + pnlUsd(t));

function CalendarPage() {
  const [offset, setOffset] = useState(0);
  const base = new Date(Date.UTC(2026, 6 + offset, 1));
  const year = base.getUTCFullYear();
  const month = base.getUTCMonth();
  const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const label = base.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthPnl = [...byDay.entries()].filter(([d]) => d.startsWith(monthKey)).reduce((s, [, v]) => s + v, 0);

  return (
    <AppShell title="Calendar" subtitle="Daily PnL heatmap">
      <Panel
        title={label}
        action={
          <div className="flex items-center gap-2">
            <Badge tone={monthPnl >= 0 ? "win" : "loss"}>{money(monthPnl)}</Badge>
            <button aria-label="Previous month" onClick={() => setOffset((o) => o - 1)} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground"><ChevronLeft className="size-4" /></button>
            <button aria-label="Next month" onClick={() => setOffset((o) => o + 1)} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground"><ChevronRight className="size-4" /></button>
          </div>
        }
      >
        <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] uppercase text-muted-foreground">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="pb-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} />;
            const key = `${monthKey}-${String(d).padStart(2, "0")}`;
            const pnl = byDay.get(key);
            const tone = pnl === undefined ? "bg-muted/25 text-muted-foreground"
              : pnl >= 0 ? "bg-[oklch(0.72_0.19_155)]/20 text-[oklch(0.8_0.17_155)] ring-1 ring-[oklch(0.72_0.19_155)]/40"
              : "bg-destructive/20 text-destructive ring-1 ring-destructive/40";
            return (
              <div key={key} className={cn("flex aspect-square flex-col items-center justify-center rounded-xl p-1 transition hover:scale-105", tone)}>
                <span className="text-[11px] font-medium">{d}</span>
                {pnl !== undefined && <span className="text-[9px] font-semibold sm:text-[10px]">{money(pnl)}</span>}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><i className="size-2.5 rounded bg-[oklch(0.72_0.19_155)]/60" /> Profit day</span>
          <span className="flex items-center gap-1.5"><i className="size-2.5 rounded bg-destructive/60" /> Loss day</span>
          <span className="flex items-center gap-1.5"><i className="size-2.5 rounded bg-muted" /> No trade</span>
        </div>
      </Panel>
    </AppShell>
  );
}
