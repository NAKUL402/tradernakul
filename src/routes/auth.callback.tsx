import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Authenticating — Trading Journal AI" },
    ],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          navigate({ to: "/" });
          return;
        }
      } catch (err) {
        console.warn("Auth callback session check notice:", err);
      }
      setTimeout(() => navigate({ to: "/" }), 800);
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground px-4">
      <div className="glass max-w-md p-8 text-center rounded-3xl">
        <div className="mx-auto size-10 animate-spin rounded-full border-2 border-primary border-t-transparent mb-4" />
        <h2 className="text-lg font-semibold tracking-tight">Authenticating with TraderNakul</h2>
        <p className="mt-2 text-xs text-muted-foreground">Setting up your secure trading session...</p>
      </div>
    </div>
  );
}
