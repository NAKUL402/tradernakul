import { useMemo } from "react";
import { type Trade } from "@/lib/trades";
import { Panel } from "@/components/app/ui-kit";
import { Target, TrendingUp, AlertTriangle, Fingerprint } from "lucide-react";

type InsightData = {
  type: "setup" | "pair" | "session";
  name: string;
  winRate: number;
  avgRrr: number;
  tradesCount: number;
};

export function TraderEdgeIntelligence({ trades }: { trades: Trade[] }) {
  const edgeData = useMemo(() => {
    if (!trades || trades.length < 5) return null;

    const insights: InsightData[] = [];

    // Helper to process groups
    const processGroup = (
      type: "setup" | "pair" | "session",
      getKey: (t: Trade) => string
    ) => {
      const groups = new Map<string, Trade[]>();
      for (const t of trades) {
        const k = getKey(t);
        if (!k) continue;
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k)!.push(t);
      }

      for (const [name, groupTrades] of groups.entries()) {
        if (groupTrades.length < 3) continue; // Minimum trades to be considered a pattern

        const wins = groupTrades.filter(t => t.result === "Win");
        const winRate = (wins.length / groupTrades.length) * 100;
        
        let totalRrr = 0;
        let validRrrCount = 0;
        for (const w of wins) {
          const rrrVal = parseFloat(w.rrr);
          if (!isNaN(rrrVal)) {
            totalRrr += rrrVal;
            validRrrCount++;
          }
        }
        const avgRrr = validRrrCount > 0 ? totalRrr / validRrrCount : 0;

        insights.push({ type, name, winRate, avgRrr, tradesCount: groupTrades.length });
      }
    };

    processGroup("setup", t => t.setup);
    processGroup("pair", t => t.pair);
    processGroup("session", t => t.session);

    if (insights.length === 0) return null;

    // Sort to find best and worst
    // Best: Highest win rate, tie breaker avg RRR
    insights.sort((a, b) => b.winRate - a.winRate || b.avgRrr - a.avgRrr);
    
    const best = insights[0];
    const worst = insights[insights.length - 1];
    
    // Calculate a rough "Edge Score" based on consistency and profitability of the best edge
    const baseScore = 50;
    const wrBonus = Math.min(30, (best.winRate - 40)); 
    const rrrBonus = Math.min(20, (best.avgRrr * 10));
    const edgeScore = Math.max(0, Math.min(100, Math.round(baseScore + wrBonus + rrrBonus)));

    let edgeMessage = "";
    if (best.type === "setup") {
      edgeMessage = `Your strongest edge is trading the ${best.name} setup.`;
    } else if (best.type === "pair") {
      edgeMessage = `Your strongest edge is trading ${best.name}.`;
    } else {
      edgeMessage = `Your strongest edge is during the ${best.name} session.`;
    }

    return {
      score: edgeScore,
      best,
      worst,
      edgeMessage,
      totalAnalyzed: trades.length
    };
  }, [trades]);

  if (!edgeData) {
    return (
      <Panel title="Trader Edge Intelligence" className="flex flex-col h-full shadow-xl relative overflow-hidden group border-primary/20">
        <div className="absolute -right-10 -bottom-10 size-40 rounded-full bg-primary/10 blur-3xl transition duration-700 group-hover:bg-primary/20" />
        
        <div className="flex flex-col items-center justify-center text-center p-6 sm:p-8 flex-1 relative z-10">
          <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 text-primary mb-5 shadow-lg shadow-primary/10">
            <Fingerprint className="size-7 opacity-80" />
          </div>
          <p className="font-display text-lg font-semibold text-foreground tracking-wide">
            Building Your Edge...
          </p>
          <p className="mt-2 text-sm text-muted-foreground max-w-[260px] leading-relaxed">
            Log more trades to unlock your personal trading fingerprint. Your unique statistical advantage will appear here.
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel 
      title="Trader Edge Intelligence" 
      className="flex flex-col h-full shadow-xl border-primary/30 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col h-full">
        <p className="text-xs text-muted-foreground mb-5 -mt-1 font-medium tracking-wide">
          Discover what actually makes your trading profitable.
        </p>

        <div className="flex items-center gap-5 mb-6">
          <div className="relative grid size-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 text-primary shadow-lg shadow-primary/20">
            <div className="absolute inset-0 rounded-full border border-primary/50 animate-[spin_4s_linear_infinite] [border-top-color:transparent] [border-bottom-color:transparent]" />
            <span className="font-display text-2xl font-bold tracking-tighter">{edgeData.score}</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">Edge Score</p>
            <p className="text-sm font-medium text-foreground mt-0.5 leading-snug">
              Based on {edgeData.totalAnalyzed} logged trades.
            </p>
          </div>
        </div>

        <div className="space-y-4 flex-1">
          {/* Best Edge */}
          <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 size-24 rounded-full bg-primary/20 blur-xl opacity-50 transition-opacity group-hover:opacity-100" />
            <div className="relative z-10 flex items-start gap-3">
              <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-md">
                <Target className="size-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">Your Trading Fingerprint</p>
                <p className="text-sm font-medium text-foreground leading-relaxed">{edgeData.edgeMessage}</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-[oklch(0.72_0.19_155)] bg-[oklch(0.72_0.19_155)]/10 px-2 py-1 rounded-md">
                    Win Rate: {edgeData.best.winRate.toFixed(1)}%
                  </span>
                  <span className="flex items-center gap-1.5 text-accent bg-accent/10 px-2 py-1 rounded-md">
                    Avg R: {edgeData.best.avgRrr.toFixed(1)}R
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Worst Edge / Weakness */}
          {edgeData.worst && edgeData.worst.name !== edgeData.best.name && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4">
              <div className="flex items-start gap-3">
                <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-destructive/20 text-destructive">
                  <AlertTriangle className="size-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-destructive mb-1">Performance Leak</p>
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    Data shows a performance drop with <span className="font-semibold">{edgeData.worst.name}</span> ({edgeData.worst.type}s).
                  </p>
                  <div className="mt-2 text-xs font-medium text-muted-foreground flex items-center gap-2">
                     <span className="inline-block w-1.5 h-1.5 rounded-full bg-destructive/60" /> Win Rate: {edgeData.worst.winRate.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
