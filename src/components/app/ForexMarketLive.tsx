import { useEffect, useState } from "react";
import { Panel } from "@/components/app/ui-kit";
import { AlertCircle, Clock } from "lucide-react";

type ForexInstrument = {
  symbol: string;
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
};

type ForexResponse = {
  status: "live" | "unconfigured" | "error";
  message?: string;
  data?: {
    instruments: ForexInstrument[];
    lastUpdated: string;
    marketStatus: "OPEN" | "CLOSED";
  };
};

export function ForexMarketLive() {
  const [market, setMarket] = useState<ForexResponse | null>(null);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const isDev = import.meta.env.DEV;
        const baseUrl = isDev ? "http://localhost:3001" : "";
        
        const res = await fetch(`${baseUrl}/api/market-data`);
        const json = await res.json();
        
        setMarket(json.forexMarket);
      } catch (err) {
        setMarket({ status: "error", message: "Live market data temporarily unavailable." });
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 5000); // Smart polling every 5s
    return () => clearInterval(interval);
  }, []);

  if (!market) {
    return (
      <Panel title="Forex Market Live" className="h-full flex flex-col justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground p-6">
          <Clock className="size-4 animate-spin" /> Connecting to live feed...
        </div>
      </Panel>
    );
  }

  if (market.status !== "live" || !market.data) {
    return (
      <Panel title="Forex Market Live" className="h-full flex flex-col">
        <div className="flex flex-col items-center justify-center text-center p-6 flex-1 bg-card/30 rounded-xl border border-border/50">
          <AlertCircle className="size-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">{market.message || "Live market data unavailable."}</p>
          {market.status === "unconfigured" && (
            <p className="text-xs text-muted-foreground mt-1">Please configure FINNHUB_API_KEY.</p>
          )}
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Forex Market Live" className="h-full flex flex-col"
      action={
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
            </span>
            {market.data.marketStatus}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">
            Updated: {market.data.lastUpdated}
          </span>
        </div>
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {market.data.instruments.map((inst) => {
          const isPos = inst.change >= 0;
          const isNeutral = inst.change === 0;
          const colorClass = isNeutral ? "text-muted-foreground" : isPos ? "text-emerald-400" : "text-destructive";
          const bgClass = isNeutral ? "bg-muted/10" : isPos ? "bg-emerald-500/10" : "bg-destructive/10";
          const sign = isPos && !isNeutral ? "+" : "";

          // Format forex to 4 or 5 decimals (e.g. 1.09345), JPY to 3 (e.g. 149.345)
          const decimals = inst.symbol.includes("JPY") ? 3 : 4;

          return (
            <div key={inst.symbol} className="rounded-xl border border-border/40 bg-card/40 p-3 transition hover:bg-card/70">
              <p className="text-[11px] font-semibold text-muted-foreground tracking-wide uppercase">{inst.symbol}</p>
              <p className="font-display text-base font-bold text-foreground mt-0.5 tracking-tight">
                {inst.price.toFixed(decimals)}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${bgClass} ${colorClass}`}>
                  {sign}{inst.changePct.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
