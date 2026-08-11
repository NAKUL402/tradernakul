import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -left-32 top-0 size-[28rem] animate-float-slow rounded-full bg-primary/25 blur-[120px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 size-[26rem] animate-float-slow rounded-full bg-accent/25 blur-[120px] [animation-delay:2s]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(var(--color-border)_1px,transparent_1px),linear-gradient(90deg,var(--color-border)_1px,transparent_1px)] [background-size:44px_44px]" />

      <div className="glass relative w-full max-w-md animate-rise rounded-3xl p-6 sm:p-8">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Edge Journal Logo" className="size-10 rounded-xl object-cover glow-primary" />
          <span>
            <span className="block font-display text-sm font-semibold">Edge Journal</span>
            <span className="block text-[11px] text-muted-foreground">Track. Analyze. Improve.</span>
          </span>
        </Link>

        <h1 className="mt-7 font-display text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

        <div className="mt-6 space-y-4">{children}</div>
        <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
      </div>
    </div>
  );
}

export const field =
  "w-full rounded-xl border border-border bg-card/50 px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-ring/40";

export const primaryBtn =
  "flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] glow-primary";
