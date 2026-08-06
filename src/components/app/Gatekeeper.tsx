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
    if (!isLoading && (!user || !profile || !isApproved)) {
      navigate({ to: "/login" });
    }
  }, [user, profile, isLoading, isApproved, navigate]);

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

  if (!user || !profile || !isApproved) {
    return null; // Will redirect via useEffect
  }

  // Double check status rules
  if (profile.status === "pending" && !profile.is_owner) {
    return <AccessPending />;
  }
  if ((profile.status === "rejected" || profile.status === "suspended") && !profile.is_owner) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
