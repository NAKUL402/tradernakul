import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { ForexMarketLive } from "@/components/app/ForexMarketLive";
import { IndianMarketLive } from "@/components/app/IndianMarketLive";
import { TopGainers } from "@/components/app/TopGainers";
import { TopLosers } from "@/components/app/TopLosers";

export const Route = createFileRoute("/market")({
  head: () => ({
    meta: [
      { title: "Market Intelligence — Trading Journal AI" },
      { name: "description", content: "Live forex, indices, and market movers." },
    ],
  }),
  component: MarketIntelligence,
});

function MarketIntelligence() {
  return (
    <AppShell title="Market Intelligence" subtitle="Live Data & Analytics">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Row 1: The two active Market sections */}
        <ForexMarketLive />
        <IndianMarketLive />
        
        {/* Row 2: Top Gainers and Losers */}
        <TopGainers />
        <TopLosers />
      </div>
    </AppShell>
  );
}
