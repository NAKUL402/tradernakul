import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Open Access — Trading Journal AI" },
      { name: "description", content: "Free Instant Access to Trading Journal AI dashboard and tools." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -left-32 top-0 size-[28rem] animate-float-slow rounded-full bg-primary/25 blur-[120px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 size-[26rem] animate-float-slow rounded-full bg-accent/25 blur-[120px] [animation-delay:2s]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(var(--color-border)_1px,transparent_1px),linear-gradient(90deg,var(--color-border)_1px,transparent_1px)] [background-size:44px_44px]" />

      <div className="glass relative w-full max-w-md animate-rise rounded-3xl p-6 sm:p-8 text-center">
        <Link to="/" className="flex items-center justify-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-sm font-bold text-primary-foreground glow-primary">TJ</span>
          <span className="text-left">
            <span className="block font-display text-sm font-semibold">Trading Journal AI</span>
            <span className="block text-[11px] text-muted-foreground">Track. Analyze. Improve.</span>
          </span>
        </Link>

        <div className="mt-8">
          <div className="mx-auto size-16 grid place-items-center rounded-2xl bg-primary/20 text-3xl">🎉</div>
          <h1 className="mt-4 font-display text-2xl font-semibold">Instant Access Unlocked</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            No signup or approval required. Start logging trades and exploring AI insights right away.
          </p>

          <Link
            to="/"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-3.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] glow-primary"
          >
            Enter Dashboard Directly
          </Link>
        </div>
      </div>
    </div>
  );
}
