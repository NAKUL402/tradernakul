import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { Badge, Panel } from "@/components/app/ui-kit";
import { money, pct, stats } from "@/lib/trades";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Trading Journal AI" },
      { name: "description", content: "Your trader profile: plan, trading style, stats snapshot and account details." },
      { property: "og:title", content: "Profile — Trading Journal AI" },
      { property: "og:description", content: "Trader profile with plan details and lifetime performance snapshot." },
    ],
  }),
  component: Profile,
});

import { useAuth } from "@/lib/auth-context";

function Profile() {
  const s = stats();
  const { user, profile, signOut } = useAuth();
  const name = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "Trader";
  const email = profile?.email || user?.email || "";
  const roleLabel = profile?.is_owner ? "Owner Admin" : profile?.role === "admin" ? "Admin" : "Trader";
  const statusLabel = profile?.status ? profile.status.toUpperCase() : "APPROVED";

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <AppShell title="Profile" subtitle="Your trader identity">
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={name} className="size-20 rounded-3xl object-cover ring-2 ring-primary/40 glow-primary" />
            ) : (
              <div className="grid size-20 place-items-center rounded-3xl bg-gradient-to-br from-primary to-accent font-display text-2xl font-bold text-primary-foreground glow-primary">
                {initials}
              </div>
            )}
            <div className="text-center sm:text-left">
              <h2 className="font-display text-xl font-semibold">{name}</h2>
              <p className="text-sm text-muted-foreground">{email}</p>
              <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                <Badge tone="primary">{roleLabel}</Badge>
                <Badge tone={profile?.status === "approved" || profile?.is_owner ? "win" : "muted"}>{statusLabel}</Badge>
                <Badge>Smart Money Concepts</Badge>
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[["Trades", String(s.total)], ["Win Rate", pct(s.winRate)], ["Net PnL", money(s.net)], ["Best Pair", s.bestPair.name]].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-muted/40 p-3 text-center">
                <p className="text-[11px] uppercase text-muted-foreground">{k}</p>
                <p className="mt-1 font-display text-lg font-semibold">{v}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Account">
          <div className="space-y-3 text-sm">
            {[["Account size", "$10,000"], ["Risk per trade", "1.2%"], ["Broker", "IC Markets"], ["Role", roleLabel]].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => signOut()}
            className="mt-5 flex w-full items-center justify-center rounded-xl border border-border px-3 py-2.5 text-sm font-medium transition hover:border-destructive/60 hover:text-destructive"
          >
            Sign out
          </button>
        </Panel>
      </div>
    </AppShell>
  );
}
