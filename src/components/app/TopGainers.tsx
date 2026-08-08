import { Panel } from "@/components/app/ui-kit";
import { AlertCircle, TrendingUp } from "lucide-react";

export function TopGainers() {
  // As per ZERO FAKE DATA rule, we do not mock top gainers
  // Since Upstox V3 and Finnhub do not provide a free Top Gainers endpoint
  // for stocks without a premium data feed, we gracefully display this limitation.
  return (
    <Panel title="Top Gainers (Stocks)" className="h-full flex flex-col">
      <div className="flex flex-col items-center justify-center text-center p-8 flex-1 bg-card/10 rounded-xl border border-border/30">
        <TrendingUp className="size-10 text-muted-foreground/30 mb-4" />
        <p className="text-sm font-semibold text-foreground/80 tracking-wide">PREMIUM DATA REQUIRED</p>
        <p className="text-[13px] text-muted-foreground mt-2 max-w-[280px]">
          Live Top Gainers mapping requires an upgraded market-data subscription. We strictly enforce zero fake data.
        </p>
        <div className="mt-5 flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-emerald-500/80 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
          <AlertCircle className="size-3" />
          Zero Fake Data Enforced
        </div>
      </div>
    </Panel>
  );
}
