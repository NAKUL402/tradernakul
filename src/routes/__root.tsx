import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  Navigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Clock, ShieldAlert, Wrench } from "lucide-react";
import { AccessPending } from "@/components/app/AccessPending";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center glass p-8 rounded-3xl">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 glow-primary"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    try {
      reportLovableError(error, { boundary: "tanstack_root_error_component" });
    } catch (e) {
      console.error("Error reporting exception:", e);
    }
  }, [error]);

  const handleRefresh = () => {
    try {
      router.invalidate();
    } catch {
      // Fallback
    }
    reset();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center glass p-8 rounded-3xl">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Edge Journal Dashboard
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error?.message?.toLowerCase().includes("session") || error?.message?.toLowerCase().includes("auth")
            ? "Your session needs to be refreshed."
            : "Something went wrong while loading the application."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 glow-primary"
          >
            Refresh Session
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-card/40 px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-card/70"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Edge Journal" },
      {
        name: "description",
        content:
          "Track, analyze and improve your trading with Edge Journal's AI-powered analytics, equity curves and performance insights.",
      },
      { name: "author", content: "Edge Journal" },
      { property: "og:title", content: "Edge Journal" },
      {
        property: "og:description",
        content:
          "Track, analyze and improve your trading with Edge Journal's AI-powered analytics, equity curves and performance insights.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://EdgeJournal.site" },
      { property: "og:image", content: "https://EdgeJournal.site/logo.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Edge Journal" },
      {
        name: "twitter:description",
        content:
          "Track, analyze and improve your trading with Edge Journal's AI-powered analytics, equity curves and performance insights.",
      },
      { name: "twitter:image", content: "https://EdgeJournal.site/logo.jpg" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.jpg", type: "image/jpeg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  // Resolve environment variables on the server (handling the Vercel typo "ANON_KEY")
  const envUrl =
    typeof process !== "undefined" && process.env["VITE_SUPABASE_URL"]
      ? process.env["VITE_SUPABASE_URL"]
      : (import.meta as any).env?.["VITE_SUPABASE_URL"] || "";

  const envKey =
    typeof process !== "undefined" &&
    (process.env["VITE_SUPABASE_ANON_KEY"] || process.env["SUPABASE_ANON_KEY"])
      ? process.env["VITE_SUPABASE_ANON_KEY"] || process.env["SUPABASE_ANON_KEY"]
      : (import.meta as any).env?.["VITE_SUPABASE_ANON_KEY"] ||
        (import.meta as any).env?.["SUPABASE_ANON_KEY"] ||
        "";

  const envScript = `
  window.__TRADERNAKUL_ENV__ = {
    VITE_SUPABASE_URL: ${JSON.stringify(envUrl)},
    VITE_SUPABASE_ANON_KEY: ${JSON.stringify(envKey)}
  };
  `;

  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: envScript }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function PendingApprovalComponent() {
  return <AccessPending />;
}

function RejectedComponent() {
  const { signOut } = useAuth();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center glass p-8 rounded-3xl">
        <ShieldAlert className="mx-auto size-16 text-destructive" />
        <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Access Denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account request was declined by the administrator. Please contact support if you
          believe this is a mistake.
        </p>
        <button
          onClick={signOut}
          className="mt-6 inline-flex items-center justify-center rounded-xl border border-border bg-card/40 px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-card/70"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

function MaintenanceComponent() {
  const { signOut } = useAuth();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center glass p-8 rounded-3xl relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 top-0 size-80 rounded-full bg-destructive/10 blur-[80px]" />
        <Wrench className="mx-auto size-16 text-destructive animate-pulse" />
        <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Under Maintenance</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Edge Journal is currently undergoing scheduled upgrades. We will be back online shortly.
          Thank you for your patience!
        </p>
        <button
          onClick={signOut}
          className="mt-6 inline-flex items-center justify-center rounded-xl border border-border bg-card/40 px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-card/70"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

function AuthGuard({ children }: { children: ReactNode }) {
  const { user, profile, isLoading, isAdmin, isApproved, fetchError, signOut, siteSettings } =
    useAuth();
  const { location } = useRouterState();
  const isAuthRoute = ["/login"].includes(location.pathname);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center glass p-8 rounded-3xl">
          <ShieldAlert className="mx-auto size-16 text-destructive" />
          <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Database Error</h1>
          <p className="mt-2 text-sm text-muted-foreground">{fetchError}</p>
          <button
            onClick={signOut}
            className="mt-6 inline-flex items-center justify-center rounded-xl border border-border bg-card/40 px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-card/70"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // If not authenticated, and trying to access a protected route (not login)
  if (!user && !isAuthRoute) {
    return <Navigate to="/login" />;
  }

  // If authenticated and trying to access login, redirect to home
  if (user && isAuthRoute) {
    return <Navigate to="/" />;
  }

  // Check maintenance mode for non-admin logged-in users
  if (user && !isAuthRoute && siteSettings?.maintenance_mode && !isAdmin) {
    return <MaintenanceComponent />;
  }

  // If authenticated, and NOT on login, check approval status
  if (user && !isAuthRoute) {
    if (location.pathname === "/admin") {
      if (!isAdmin) {
        return <Navigate to="/" />;
      }
    } else {
      if (isApproved) {
        return <>{children}</>;
      }

      if (profile?.status === "rejected" || profile?.status === "suspended") {
        return <RejectedComponent />;
      }
      
      if (profile?.status === "pending") {
        return <PendingApprovalComponent />;
      }
      
      // Fallback deny to prevent unexpected bypasses
      return <RejectedComponent />;
    }
  }

  return <>{children}</>;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <AuthGuard>
          <Outlet />
        </AuthGuard>
        <Toaster position="top-center" />
      </QueryClientProvider>
    </AuthProvider>
  );
}
