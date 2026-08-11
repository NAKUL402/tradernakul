import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function Panel({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("glass-card-3d transform-3d elevated-surface group relative animate-rise overflow-hidden rounded-3xl p-4 sm:p-5 transition-all duration-500 hover:border-primary/40", className)}>
      <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-primary/0 blur-[80px] transition-all duration-700 group-hover:bg-primary/15 parallax-bg" />
      {(title || action) && (
        <div className="relative z-10 mb-4 flex items-center justify-between gap-3 layer-3d">
          {title && <h2 className="font-display text-sm font-semibold sm:text-base">{title}</h2>}
          {action}
        </div>
      )}
      <div className="layer-3d">
        {children}
      </div>
    </section>
  );
}

import { Link } from "@tanstack/react-router";

export function StatCard({
  label, value, sub, delta, icon, accent = "primary", to
}: {
  label: string; value: string; sub?: string; delta?: number; icon?: ReactNode; accent?: "primary" | "accent" | "success" | "destructive"; to?: string;
}) {
  const ring = {
    primary: "from-primary/25 group-hover:from-primary/40", 
    accent: "from-accent/25 group-hover:from-accent/40", 
    success: "from-success/25 group-hover:from-success/40", 
    destructive: "from-destructive/25 group-hover:from-destructive/40",
  }[accent];
  const shadow = {
    primary: "hover:shadow-[0_8px_25px_-8px_var(--color-primary)] hover:border-primary/40",
    accent: "hover:shadow-[0_8px_25px_-8px_var(--color-accent)] hover:border-accent/40",
    success: "hover:shadow-[0_8px_25px_-8px_var(--success)] hover:border-success/40",
    destructive: "hover:shadow-[0_8px_25px_-8px_var(--color-destructive)] hover:border-destructive/40",
  }[accent];
  const inner = (
    <div className="transform-3d layer-3d">
      <div className={cn("pointer-events-none absolute -right-10 -top-12 size-28 rounded-full bg-gradient-to-br to-transparent blur-2xl transition duration-500 parallax-bg", ring)} />
      <div className="relative z-10 flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {icon && <span className="text-muted-foreground transition group-hover:text-primary layer-3d-extreme">{icon}</span>}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold layer-3d-extreme">{value}</p>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {typeof delta === "number" && (
          <span className={cn("inline-flex items-center gap-0.5 font-medium", delta >= 0 ? "text-success" : "text-destructive")}>
            {delta >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {sub && <span className="text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );

  const containerClasses = cn("glass-card-3d perspective-container elevated-surface depth-hover group relative animate-rise overflow-hidden rounded-2xl p-4 transition-all duration-300 block text-left", shadow);

  if (to) {
    return <Link to={to} className={containerClasses}>{inner}</Link>;
  }
  return <div className={containerClasses}>{inner}</div>;
}

export function Badge({ children, tone = "muted", className }: { children: ReactNode; tone?: "win" | "loss" | "muted" | "primary" | "accent"; className?: string }) {
  const tones = {
    win: "bg-success/15 text-success border-success/30",
    loss: "bg-destructive/15 text-destructive border-destructive/30",
    primary: "bg-primary/15 text-primary border-primary/30",
    accent: "bg-accent/15 text-accent border-accent/30",
    muted: "bg-muted/60 text-muted-foreground border-border",
  }[tone];
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium", tones, className)}>{children}</span>;
}

export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-14 text-center">
      <p className="font-display text-sm font-semibold">{title}</p>
      <p className="max-w-xs text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
