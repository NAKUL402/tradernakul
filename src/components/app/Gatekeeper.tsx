import { useAuth } from "@/lib/auth-context";
import { AccessPending } from "./AccessPending";
import { AccessDenied } from "./AccessDenied";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export function Gatekeeper({ children }: { children: ReactNode }) {
  const { user, profile, isLoading, isApproved } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, isLoading, navigate]);

  if (isLoading || (user && profile === null)) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Verifying access permissions…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  // Double check status rules with strict deny-by-default
  if (!isApproved) {
    if (profile?.status === "rejected" || profile?.status === "suspended") {
      return <AccessDenied />;
    }
    return <AccessPending />;
  }

  return <>{children}</>;
}
