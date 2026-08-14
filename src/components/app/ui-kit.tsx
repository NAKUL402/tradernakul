import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "neon-card p-6",
        className,
      )}
    >
      {(title || action) && (
        <div className="relative z-10 mb-5 flex items-center justify-between gap-3">
          {title && <h2 className="font-display text-base font-extrabold text-foreground">{title}</h2>}
          {action}
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  sub,
  delta,
  icon,
  accent = "primary",
  to,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: number;
  icon?: ReactNode;
  accent?: "primary" | "accent" | "success" | "destructive";
  to?: string;
}) {
  const iconBgs = {
    primary: "bg-primary text-primary-foreground elevation-1",
    accent: "bg-accent text-accent-foreground elevation-1",
    success: "bg-success text-white elevation-glow-success",
    destructive: "bg-destructive text-white elevation-glow-danger",
  }[accent];

  const inner = (
    <div className="relative z-10 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-muted-foreground">
          {label}
        </p>
        {icon && (
          <div className={cn("flex size-8 items-center justify-center rounded-lg", iconBgs)}>
            <span className="size-4">{icon}</span>
          </div>
        )}
      </div>
      <div className="flex items-end gap-3">
        <p className="font-display text-3xl font-bold tabular-nums text-foreground">{value}</p>
        {typeof delta === "number" && (
          <span
            className={cn(
              "mb-1 flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold",
              delta >= 0 ? "bg-success-bg text-success" : "bg-danger-bg text-danger",
            )}
          >
            {delta >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );

  const glowClass = {
    primary: "neon-glow-blue",
    accent: "neon-glow-purple",
    success: "neon-glow-green",
    destructive: "neon-glow-red",
  }[accent];

  const containerClasses = cn(
    "neon-card p-6 block text-left",
    glowClass,
  );

  if (to) {
    return (
      <Link to={to} className={containerClasses}>
        {inner}
      </Link>
    );
  }
  return <div className={containerClasses}>{inner}</div>;
}

export function Badge({
  children,
  tone = "muted",
  className,
}: {
  children: ReactNode;
  tone?: "win" | "loss" | "muted" | "primary" | "accent";
  className?: string;
}) {
  const tones = {
    win: "bg-success-bg text-success border-success/20",
    loss: "bg-danger-bg text-danger border-danger/20",
    primary: "bg-primary text-primary-foreground border-transparent elevation-1",
    accent: "bg-accent text-accent-foreground border-transparent elevation-1",
    muted: "bg-muted text-muted-foreground border-border",
  }[tone];
  
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[11px] font-semibold",
        tones,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/50 bg-muted/30 py-16 text-center elevation-1">
      <p className="font-display text-base font-extrabold text-foreground">{title}</p>
      <p className="max-w-xs text-sm font-medium text-muted-foreground">{hint}</p>
    </div>
  );
}
