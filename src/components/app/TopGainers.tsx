import { Panel } from "@/components/app/ui-kit";
import { AlertCircle, TrendingUp } from "lucide-react";

export function TopGainers() {
  // As per ZERO FAKE DATA rule, we do not mock top gainers
  // Since Upstox V3 and Finnhub do not provide a free Top Gainers endpoint
  // for stocks without a premium data feed, we gracefully display this limitation.
  return (
    <Panel title="Top Gainers (Stocks)" className="h-full flex flex-col">
      <div className="flex flex-col items-center justify-center text-center p-8 flex-1 bg-card/30 rounded-xl border border-border/50">
        <TrendingUp className="size-10 text-muted-foreground/50 mb-4" />
        <p className="text-base font-semibold text-foreground">API Limitation</p>
        <p className="text-sm text-muted-foreground mt-2 max-w-[250px]">
          The configured API providers (Upstox/Finnhub) do not supply a real-time Top Gainers endpoint for stocks on this tier.
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-amber-500/80 bg-amber-500/10 px-3 py-1.5 rounded-full">
          <AlertCircle className="size-3.5" />
          Zero Fake Data Enforced
        </div>
      </div>
    </Panel>
  );
}
