import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, NotebookPen, BarChart3, Brain, CalendarDays, FileText,
  Settings, User, Menu, Plus, Bell, Search, ShieldCheck,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/journal", label: "Journal", icon: NotebookPen },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/ai-coach", label: "AI Coach", icon: Brain },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/profile", label: "Profile", icon: User },
] as const;

const mobileNav = nav.slice(0, 5);

function Brand({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-sm font-bold text-primary-foreground glow-primary">
        TJ
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="font-display text-sm font-semibold">Trading Journal AI</p>
          <p className="text-[11px] text-muted-foreground">Track. Analyze. Improve.</p>
        </div>
      )}
    </div>
  );
}

import { Gatekeeper } from "@/components/app/Gatekeeper";
import { useAuth } from "@/lib/auth-context";

export function AppShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, profile } = useAuth();

  const name = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "TN";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen w-full">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col gap-6 border-r border-border/60 bg-sidebar/70 p-4 backdrop-blur-xl transition-[width] duration-300 lg:flex",
          collapsed ? "w-[86px]" : "w-[262px]",
        )}
      >
        <div className="flex items-center justify-between">
          <Brand compact={collapsed} />
          {!collapsed && (
            <button
              aria-label="Collapse sidebar"
              onClick={() => setCollapsed(true)}
              className="rounded-lg p-2 text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground"
            >
              <Menu className="size-4" />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            aria-label="Expand sidebar"
            onClick={() => setCollapsed(false)}
            className="mx-auto rounded-lg p-2 text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground"
          >
            <Menu className="size-4" />
          </button>
        )}

        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                title={item.label}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-gradient-to-r from-primary/25 to-accent/15 text-foreground shadow-[inset_0_0_0_1px_var(--color-border)]"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                  collapsed && "justify-center px-0",
                )}
              >
                {active && <span className="absolute left-0 h-6 w-1 rounded-r-full bg-gradient-to-b from-primary to-accent" />}
                <item.icon className={cn("size-[18px] shrink-0", active && "text-primary")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}

          {user?.email?.toLowerCase().trim() === "nakultrader007@gmail.com" && (
            <Link
              to="/admin"
              title="Admin Portal"
              className={cn(
                "group relative mt-2 flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-primary/20",
                pathname === "/admin" && "bg-primary/30 shadow-[inset_0_0_0_1px_var(--color-primary)]",
                collapsed && "justify-center px-0",
              )}
            >
              <ShieldCheck className="size-[18px] shrink-0 text-primary animate-pulse" />
              {!collapsed && <span>Admin Portal</span>}
            </Link>
          )}
        </nav>

        {!collapsed && (
          <div className="glass rounded-2xl p-4">
            <p className="font-display text-sm font-semibold">Pro Plan</p>
            <p className="mt-1 text-xs text-muted-foreground">Unlimited AI coach reviews &amp; reports.</p>
            <Link
              to="/ai-coach"
              className="mt-3 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary to-accent px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Open AI Coach
            </Link>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <div className="lg:hidden">
              <Brand compact />
            </div>
            <div className="hidden min-w-0 flex-1 md:block">
              <h1 className="truncate font-display text-lg font-semibold">{title}</h1>
              {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-xl border border-border/70 bg-card/50 px-3 py-2 text-xs text-muted-foreground sm:flex">
                <Search className="size-3.5" />
                <span>Search trades…</span>
              </div>
              <button aria-label="Notifications" className="relative rounded-xl border border-border/70 bg-card/50 p-2 text-muted-foreground transition hover:text-foreground">
                <Bell className="size-4" />
                <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-accent" />
              </button>
              <Link to="/profile" aria-label="Profile" className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-primary text-xs font-bold text-primary-foreground">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={name} className="size-full rounded-xl object-cover" />
                ) : (
                  initials
                )}
              </Link>
            </div>
          </div>
          <div className="px-4 pb-3 md:hidden">
            <h1 className="font-display text-xl font-semibold">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </header>

        <main className="flex-1 px-4 pb-28 pt-5 sm:px-6 lg:pb-10">
          <Gatekeeper>{children}</Gatekeeper>
        </main>
      </div>

      {pathname === "/journal" && (
        <Link
          to="/journal?openModal=true"
          onClick={() => {
            if (typeof window !== "undefined" && window.location.pathname === "/journal") {
              window.dispatchEvent(new CustomEvent("open_log_trade_modal"));
            }
          }}
          aria-label="Add trade"
          className="fixed bottom-24 right-5 z-40 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground glow-primary transition active:scale-95 lg:bottom-8"
        >
          <Plus className="size-6" />
        </Link>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/85 backdrop-blur-xl lg:hidden">
        <div className="flex items-stretch justify-between px-2 py-2">
          {mobileNav.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className={cn("size-5", active && "drop-shadow-[0_0_8px_var(--color-primary)]")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
