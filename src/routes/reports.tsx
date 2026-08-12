import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Badge, Panel } from "@/components/app/ui-kit";
import { BarsChart, TrendChart } from "@/components/app/charts";
import { fetchUserTrades, money, monthly, weekly, pct, stats, type Trade } from "@/lib/trades";
import { FileText, SlidersHorizontal } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Edge Journal" },
      {
        name: "description",
        content: "Weekly and monthly trading reports with exportable performance summaries.",
      },
      { property: "og:title", content: "Reports — Edge Journal" },
      {
        property: "og:description",
        content: "Download weekly and monthly trading performance reports.",
      },
    ],
  }),
  component: Reports,
});

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
    const now = new Date();

    return userTrades.filter((t) => {
      if (!t.date) return false;
      const tradeDate = new Date(`${t.date}T00:00:00Z`);
      if (isNaN(tradeDate.getTime())) return false;

      const diffTime = now.getTime() - tradeDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      switch (dateRange) {
        case "7d":
          return diffDays <= 7;
        case "30d":
          return diffDays <= 30;
        case "90d":
          return diffDays <= 90;
        case "this-month":
          return (
            tradeDate.getUTCMonth() === now.getUTCMonth() &&
            tradeDate.getUTCFullYear() === now.getUTCFullYear()
          );
        case "this-week": {
          const day = now.getUTCDay();
          const monday = new Date(now);
          monday.setUTCDate(now.getUTCDate() - day + (day === 0 ? -6 : 1));
          monday.setUTCHours(0, 0, 0, 0);
          return tradeDate >= monday;
        }
        case "all":
        default:
          return true;
      }
    });
  }, [userTrades, dateRange]);

  const months = useMemo(() => monthly(filteredTrades), [filteredTrades]);
  const weeklyData = useMemo(() => weekly(filteredTrades), [filteredTrades]);
  const s = useMemo(() => stats(filteredTrades), [filteredTrades]);

  if (userTrades === null) {
    return (
      <AppShell title="Reports" subtitle="Weekly & monthly performance summaries">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading performance report...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (userTrades.length === 0) {
    return (
      <AppShell title="Reports" subtitle="Weekly & monthly performance summaries">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center max-w-md px-6">
            <div className="grid size-16 place-items-center rounded-2xl bg-card border border-border shadow-lg">
              <FileText className="size-8 text-muted-foreground opacity-60" />
            </div>
            <h3 className="font-display text-lg font-semibold">No trade data available yet</h3>
            <p className="text-sm text-muted-foreground">
              Add your first trade in the Journal to generate a comprehensive trading performance report.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Reports" subtitle="Weekly & monthly performance summaries">
      {/* Date Range Selection Filter */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/60 p-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-primary" />
          <div>
            <h2 className="font-display text-xs font-semibold">Filter Report</h2>
            <p className="text-[10px] text-muted-foreground">Select date range for metrics</p>
          </div>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as any)}
          className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
        >
          <option value="all">All Time</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="this-month">This Month</option>
          <option value="this-week">This Week</option>
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Monthly Report" className="lg:col-span-2">
          {months.length > 0 ? (
            <>
              <BarsChart data={months} />
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {months.map((m) => (
                  <div
                    key={m.name}
                    className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5 text-sm"
                  >
                    <span className="font-medium">{m.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {m.trades} trades · {pct(m.winRate)}
                    </span>
                    <span
                      className={
                        m.pnl >= 0 ? "font-semibold text-success" : "font-semibold text-destructive"
                      }
                    >
                      {money(m.pnl, currencySymbol)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground">
              Not enough data for selected period
            </div>
          )}
        </Panel>

        <Panel title="Summary">
          <div className="space-y-3 text-sm">
            {[
              ["Total Trades", String(s.total)],
              ["Win Rate", pct(s.winRate)],
              ["Profit Factor", s.profitFactor > 0 ? s.profitFactor.toFixed(2) : "0.00"],
              ["Average RRR", `1:${s.avgRRR.toFixed(2)}`],
              ["Net PnL", money(s.net, currencySymbol)],
              ["Best Pair", s.bestPair?.name || "N/A"],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between border-b border-border/50 pb-2"
              >
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Weekly Performance">
          {weeklyData.length > 0 ? (
            <BarsChart data={weeklyData} />
          ) : (
            <div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground">
              Not enough data for selected period
            </div>
          )}
        </Panel>
        <Panel title="Win Rate Trend" className="lg:col-span-2">
          {months.length > 0 ? (
            <TrendChart data={months} />
          ) : (
            <div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground">
              Not enough data for selected period
            </div>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
