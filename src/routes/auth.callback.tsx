import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  const [status, setStatus] = useState("Authenticating...");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Supabase OAuth returns tokens in the URL hash fragment (#access_token=...)
        // or as query params (?code=...) depending on the flow.
        // supabase-js auto-detects and exchanges these when detectSessionInUrl is true.

        // First, try to exchange the code/hash for a session
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          // Implicit flow: set session from hash tokens
          setStatus("Verifying tokens...");
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            console.error("Auth callback setSession error:", error.message);
            setStatus("Authentication failed. Redirecting...");
          } else {
            setStatus("Login successful! Redirecting to dashboard...");
          }
        } else {
          // PKCE flow or already exchanged: check existing session
          setStatus("Verifying session...");
          const searchParams = new URLSearchParams(window.location.search);
          const code = searchParams.get("code");

          if (code) {
            // Exchange code for session
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              console.error("Auth callback code exchange error:", error.message);
              setStatus("Authentication failed. Redirecting...");
            } else {
              setStatus("Login successful! Redirecting to dashboard...");
            }
          } else {
            // No hash tokens and no code — just check for existing session
            const { data } = await supabase.auth.getSession();
            if (data.session) {
              setStatus("Session found! Redirecting...");
            } else {
              setStatus("No session found. Redirecting...");
            }
          }
        }
      } catch (err) {
        console.warn("Auth callback error:", err);
        setStatus("Something went wrong. Redirecting...");
      }

      // Navigate to dashboard after a brief delay
      setTimeout(() => navigate({ to: "/" }), 1000);
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground px-4">
      <div className="glass max-w-md p-8 text-center rounded-3xl">
        <div className="mx-auto size-10 animate-spin rounded-full border-2 border-primary border-t-transparent mb-4" />
        <h2 className="text-lg font-semibold tracking-tight">Authenticating with TraderNakul</h2>
        <p className="mt-2 text-xs text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}
