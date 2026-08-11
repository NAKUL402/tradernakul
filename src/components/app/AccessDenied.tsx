import { useAuth } from "@/lib/auth-context";
import { Badge } from "./ui-kit";
import { LogOut, XCircle } from "lucide-react";

export function AccessDenied() {
  const { user, profile, signOut } = useAuth();
  const name = profile?.full_name || user?.user_metadata?.["full_name"] || user?.user_metadata?.["name"] || "Trader";
  const email = profile?.email || user?.email || "";

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center p-4">
      <div className="pointer-events-none absolute -left-24 top-0 size-80 rounded-full bg-destructive/20 blur-[100px]" />

      <div className="glass relative w-full max-w-lg animate-rise rounded-3xl p-6 text-center sm:p-8">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-destructive/20 text-destructive glow-primary">
          <XCircle className="size-8" />
        </div>

        <h2 className="mt-6 font-display text-2xl font-semibold">Access Denied</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your access request to Edge Journal has been rejected by the owner.
        </p>

        <div className="mt-6 rounded-2xl bg-card/60 p-4 text-left border border-border/60 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">User Name</span>
            <span className="font-medium text-foreground">{name}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Email Address</span>
            <span className="font-medium text-foreground">{email}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Current Status</span>
            <Badge tone="loss">Access Denied</Badge>
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card/40 py-3 text-sm font-medium transition hover:bg-card/80 active:scale-[0.99]"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
