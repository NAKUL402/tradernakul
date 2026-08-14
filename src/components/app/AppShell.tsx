import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  NotebookPen,
  BarChart3,
  Brain,
  CalendarDays,
  FileText,
  Settings,
  User,
  Menu,
  Plus,
  Bell,
  Search,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  Activity,
  Zap,
  Command,
  TrendingUp,
} from "lucide-react";
import { useState, useEffect, type ReactNode } from "react";
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

const mobileNav = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/journal", label: "Journal", icon: NotebookPen },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/ai-coach", label: "Coach", icon: Brain },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
];

function Brand({ compact }: { compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", compact && "justify-center")}>
      <div className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 shadow-md shadow-purple-500/20">
        <span className="font-display text-lg font-black tracking-tight text-white">EJ</span>
        <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-background"></span>
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="font-display text-base font-bold tracking-tight text-foreground">Edge Journal</p>
          <p className="text-[11px] text-muted-foreground">Pro Trading Journal</p>
        </div>
      )}
    </div>
  );
}

import { Gatekeeper } from "@/components/app/Gatekeeper";
import { FloatingAICoach } from "@/components/app/FloatingAICoach";
import { useAuth } from "@/lib/auth-context";
import { LocalTestControlPanel } from "@/components/app/LocalTestControlPanel";

export function AppShell({
  title,
  subtitle,
  headerAction,
  children,
}: {
  title: ReactNode;
  subtitle?: string;
  headerAction?: ReactNode;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, profile, isAdmin } = useAuth();

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.["full_name"] ||
    user?.user_metadata?.["name"] ||
    "Nakul Trader";
  const displayEmail = user?.email || "nakul.trader@gmail.com";
  const initials = displayName
    .split(" ")
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // ══════════════ GLOBAL KEYBOARD SHORTCUTS ══════════════
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when user is typing inside an input / textarea / contenteditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "Escape") {
        setIsNotificationsOpen(false);
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        if (window.location.pathname !== "/journal") {
          navigate({ to: "/journal" });
        }
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("open_log_trade_modal"));
        }, 80);
      } else if (e.key === "1") {
        navigate({ to: "/" });
      } else if (e.key === "2") {
        navigate({ to: "/journal" });
      } else if (e.key === "3") {
        navigate({ to: "/analytics" });
      } else if (e.key === "4") {
        navigate({ to: "/ai-coach", search: {} as any });
      } else if (e.key === "5") {
        navigate({ to: "/calendar" });
      } else if (e.key === "6") {
        navigate({ to: "/reports" });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground transition-colors duration-200">
      {import.meta.env.DEV && String((import.meta.env as any)["VITE_DEV_TEST_MODE"]).trim() === "true" && (
        <div className="fixed bottom-2 right-2 z-50 rounded bg-red-600/90 px-2 py-1 text-[10px] font-bold tracking-widest text-white shadow-lg pointer-events-none">
          LOCAL DEV TEST MODE
        </div>
      )}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col justify-between border-r border-border/70 bg-sidebar/80 p-4 backdrop-blur-xl transition-[width] duration-300 lg:flex",
          collapsed ? "w-[86px]" : "w-[264px]",
        )}
      >
        <div className="flex flex-col gap-5 min-h-0">
          <div className="flex items-center justify-between">
            <Brand compact={collapsed} />
            {!collapsed && (
              <button
                aria-label="Collapse sidebar"
                onClick={() => setCollapsed(true)}
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <Menu className="size-4" />
              </button>
            )}
          </div>
          {collapsed && (
            <button
              aria-label="Expand sidebar"
              onClick={() => setCollapsed(false)}
              className="mx-auto rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer"
            >
              <Menu className="size-4" />
            </button>
          )}

          <nav className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-1">
            {nav.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200",
                    active
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-sm dark:bg-gradient-to-r dark:from-purple-950/70 dark:via-purple-900/40 dark:to-indigo-950/50 dark:text-white dark:border-purple-500/35 dark:shadow-[0_0_18px_rgba(168,85,247,0.2)]"
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                    collapsed && "justify-center px-0",
                  )}
                >
                  <div className={cn("flex size-[24px] items-center justify-center rounded-md transition-colors", active && "text-indigo-600 dark:text-purple-300")}>
                    <item.icon className="size-[17px] shrink-0" />
                  </div>
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                to="/admin"
                title="Admin Portal"
                className={cn(
                  "group relative mt-1.5 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-primary/10",
                  pathname === "/admin" &&
                    "bg-primary/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] ring-1 ring-primary/20",
                  collapsed && "justify-center px-0",
                )}
              >
                <ShieldCheck className="size-[18px] shrink-0 text-primary animate-pulse" />
                {!collapsed && <span>Admin Portal</span>}
              </Link>
            )}
          </nav>
        </div>

        {!collapsed && (
          <div className="flex flex-col gap-3 pt-3 border-t border-border/60">
            {/* Need help? View Documentation */}
            <a
              href="/ai-coach"
              className="flex items-center gap-2.5 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground transition cursor-pointer"
            >
              <HelpCircle className="size-3.5" />
              <span>Need help? <strong className="font-semibold underline">View Documentation</strong></span>
            </a>

            {/* User Profile Card */}
            <Link
              to="/profile"
              className="flex items-center justify-between rounded-xl border border-border/80 bg-surface p-2.5 hover:bg-muted/60 transition group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative size-8 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {initials}
                  <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background"></span>
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-[12px] font-bold text-foreground truncate group-hover:text-primary transition-colors">{displayName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{displayEmail}</p>
                </div>
              </div>
              <ChevronDown className="size-3.5 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors ml-1" />
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
              <Link 
                to="/journal"
                className="hidden items-center gap-2 rounded-xl border border-border bg-surface-glass px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm transition hover:text-foreground hover:bg-muted sm:flex"
              >
                <Search className="size-3.5" />
                <span>Search trades…</span>
              </Link>
              
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  aria-label="Notifications"
                  className="relative rounded-xl border border-border bg-surface-glass p-2 text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground"
                >
                  <Bell className="size-4" />
                </button>
                {isNotificationsOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsNotificationsOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-72 z-50 rounded-2xl border border-border bg-card/95 backdrop-blur-xl p-4 shadow-xl animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-3">
                        <h3 className="font-semibold text-sm">Notifications</h3>
                      </div>
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <Bell className="size-8 text-muted-foreground/30 mb-3" />
                        <p className="text-sm font-medium text-foreground">All caught up!</p>
                        <p className="text-xs text-muted-foreground mt-1">Check back later for updates</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <Link
                to="/profile"
                aria-label="Profile"
                className="grid size-9 place-items-center rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-sm transition-transform hover:scale-105"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="size-full rounded-xl object-cover"
                  />
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
        <a
          href="/journal?openModal=true"
          onClick={() => {
            if (typeof window !== "undefined" && window.location.pathname === "/journal") {
              window.dispatchEvent(new CustomEvent("open_log_trade_modal"));
            }
          }}
          aria-label="Add trade"
          className="fixed bottom-24 right-5 z-40 grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground elevation-2 transition-all hover:scale-105 active:scale-95 lg:bottom-8"
        >
          <Plus className="size-6" />
        </a>
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
                <item.icon
                  className={cn("size-5", active && "drop-shadow-[0_0_8px_var(--color-primary)]")}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
      <LocalTestControlPanel />
      <FloatingAICoach />
    </div>
  );
}
