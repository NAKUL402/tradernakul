import { useAuth } from "@/lib/auth-context";
import { AccessPending } from "./AccessPending";
import { AccessDenied } from "./AccessDenied";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

export function Gatekeeper({ children }: { children: ReactNode }) {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Verifying access permissions…</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated or profile is not loaded yet, allow fallback UI
  // Note: if user is logged in:
  if (user && profile) {
    if (profile.status === "pending" && !profile.is_owner) {
      return <AccessPending />;
    }
    if (profile.status === "rejected" && !profile.is_owner) {
      return <AccessDenied />;
    }
  }

  return <>{children}</>;
}
