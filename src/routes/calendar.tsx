import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Badge, Panel } from "@/components/app/ui-kit";
import { fetchUserTrades, money, pnlUsd, type Trade } from "@/lib/trades";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Edge Journal" },
      {
        name: "description",
        content:
          "Daily PnL calendar heatmap showing which trading days made money and which cost you.",
      },
      { property: "og:title", content: "Calendar — Edge Journal" },
      {
        property: "og:description",
        content: "Visual PnL heatmap of every trading day of the month.",
      },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const [userTrades, setUserTrades] = useState<Trade[]>([]);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    fetchUserTrades().then((data) => setUserTrades(data));
  }, []);

  const byDay = new Map<string, number>();
  for (const t of userTrades) byDay.set(t.date, (byDay.get(t.date) ?? 0) + pnlUsd(t));

  // Use the real current date as the base — offset 0 = current month
  const now = new Date();
  const base = new Date(Date.UTC(now.getFullYear(), now.getMonth() + offset, 1));
  const year = base.getUTCFullYear();
  const month = base.getUTCMonth();
  const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const label = base.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthPnl = [...byDay.entries()]
    .filter(([d]) => d.startsWith(monthKey))
    .reduce((s, [, v]) => s + v, 0);

  return (
    <AppShell title="Calendar" subtitle="Daily PnL heatmap">
      <Panel
        title={label}
        className="neon-glow-blue"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOffset(0)}
              className="rounded-lg border border-border bg-muted/30 px-2.5 py-1 text-[11px] font-bold text-foreground hover:bg-muted transition cursor-pointer"
            >
              Today
            </button>
            <Badge tone={monthPnl >= 0 ? "win" : "loss"}>{money(monthPnl)}</Badge>
            <button
              aria-label="Previous month"
              onClick={() => setOffset((o) => o - 1)}
              className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              aria-label="Next month"
              onClick={() => setOffset((o) => o + 1)}
              className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] uppercase text-muted-foreground">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="pb-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} />;
            const key = `${monthKey}-${String(d).padStart(2, "0")}`;
            const pnl = byDay.get(key);
            const hasTrades = pnl !== undefined;
            return (
              <div
                key={key}
                onClick={() => {
                  if (hasTrades) {
                    window.location.href = `/journal?q=${key}`;
                  }
                }}
                className={cn(
                  "group relative flex aspect-square flex-col items-center justify-center rounded-xl p-1 transition-all duration-200 hover:-translate-y-1 hover:scale-105 cursor-pointer",
                  !hasTrades
                    ? "bg-muted/20 border border-border/40 hover:bg-muted/40 text-foreground"
                    : pnl >= 0
                      ? "neon-glow-green bg-emerald-500/15 text-emerald-400 font-bold shadow-md"
                      : "neon-glow-red bg-rose-500/15 text-rose-400 font-bold shadow-md",
                )}
              >
                <span className={cn("text-[11px] font-medium", !hasTrades ? "text-muted-foreground" : "text-foreground")}>{d}</span>
                {hasTrades && (
                  <span className="text-[9px] font-bold sm:text-[10px] mt-0.5 tabular-nums truncate max-w-full px-0.5">{money(pnl)}</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <i className="size-2.5 rounded bg-success/60" /> Profit day
          </span>
          <span className="flex items-center gap-1.5">
            <i className="size-2.5 rounded bg-destructive/60" /> Loss day
          </span>
          <span className="flex items-center gap-1.5">
            <i className="size-2.5 rounded bg-muted" /> No trade
          </span>
        </div>
      </Panel>
    </AppShell>
  );
}
