import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function Panel({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("glass group relative animate-rise overflow-hidden rounded-3xl p-4 sm:p-5 transition duration-500 hover:border-primary/30 hover:shadow-[0_0_20px_-5px_var(--color-primary)]", className)}>
      <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-primary/0 blur-3xl transition duration-500 group-hover:bg-primary/10" />
      {(title || action) && (
        <div className="relative z-10 mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-display text-sm font-semibold sm:text-base">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  label, value, sub, delta, icon, accent = "primary",
}: {
  label: string; value: string; sub?: string; delta?: number; icon?: ReactNode; accent?: "primary" | "accent" | "success" | "destructive";
}) {
  const ring = {
    primary: "from-primary/25 group-hover:from-primary/40", 
    accent: "from-accent/25 group-hover:from-accent/40", 
    success: "from-[oklch(0.72_0.19_155)]/25 group-hover:from-[oklch(0.72_0.19_155)]/40", 
    destructive: "from-destructive/25 group-hover:from-destructive/40",
  }[accent];
  const shadow = {
    primary: "hover:shadow-[0_0_15px_-3px_var(--color-primary)] hover:border-primary/30",
    accent: "hover:shadow-[0_0_15px_-3px_var(--color-accent)] hover:border-accent/30",
    success: "hover:shadow-[0_0_15px_-3px_oklch(0.72_0.19_155)] hover:border-[oklch(0.72_0.19_155)]/30",
    destructive: "hover:shadow-[0_0_15px_-3px_var(--color-destructive)] hover:border-destructive/30",
  }[accent];
  return (
    <div className={cn("glass group relative animate-rise overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1", shadow)}>
      <div className={cn("pointer-events-none absolute -right-10 -top-12 size-28 rounded-full bg-gradient-to-br to-transparent blur-2xl transition duration-500", ring)} />
      <div className="relative z-10 flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {icon && <span className="text-muted-foreground transition group-hover:text-primary">{icon}</span>}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {typeof delta === "number" && (
          <span className={cn("inline-flex items-center gap-0.5 font-medium", delta >= 0 ? "text-[oklch(0.72_0.19_155)]" : "text-destructive")}>
            {delta >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {sub && <span className="text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}

export function Badge({ children, tone = "muted", className }: { children: ReactNode; tone?: "win" | "loss" | "muted" | "primary" | "accent"; className?: string }) {
  const tones = {
    win: "bg-[oklch(0.72_0.19_155)]/15 text-[oklch(0.78_0.17_155)] border-[oklch(0.72_0.19_155)]/30",
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
