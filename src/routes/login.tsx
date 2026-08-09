import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowRight, Mail, KeyRound, User, Lock } from "lucide-react";
import { sendOwnerApprovalEmail } from "@/lib/email-service";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Trading Journal AI" },
      { name: "description", content: "Login to your Trading Journal AI account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, profile, isApproved } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated and approved, go to dashboard
  useEffect(() => {
    if (user && profile && isApproved) {
      navigate({ to: "/" });
    }
  }, [user, profile, isApproved, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }
    if (!password) {
      toast.error("Please enter your password.");
      return;
    }

    setIsLoading(true);
    try {
      if (mode === "signup") {
        if (!name.trim()) {
          toast.error("Please enter your name.");
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name.trim()
            }
          }
        });

        if (error) {
          if (error.message.toLowerCase().includes("user already registered")) {
            toast.error("Account already exists. Please log in.");
            setMode("login");
            setIsLoading(false);
            return;
          }
          throw error;
        }

        if (data.user) {
          // Send owner approval notification in the background
          sendOwnerApprovalEmail({
            userEmail: email,
            userName: name.trim() || email,
          }).catch(console.error);

          if (data.session) {
            toast.success("Account created successfully!");
            navigate({ to: "/" });
          } else {
            toast.success("Account created! Please check your email to verify before logging in.");
            setMode("login");
            setPassword("");
          }
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.toLowerCase().includes("invalid login credentials")) {
            throw new Error("Incorrect email or password.");
          }
          if (error.message.toLowerCase().includes("email not confirmed")) {
            throw new Error("Please verify your email address before logging in.");
          }
          throw error;
        }

        if (data.session) {
          toast.success("Logged in successfully.");
          navigate({ to: "/" });
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -left-32 top-0 size-[28rem] animate-float-slow rounded-full bg-primary/25 blur-[120px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 size-[26rem] animate-float-slow rounded-full bg-accent/25 blur-[120px] [animation-delay:2s]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(var(--color-border)_1px,transparent_1px),linear-gradient(90deg,var(--color-border)_1px,transparent_1px)] [background-size:44px_44px]" />

      <div className="glass relative w-full max-w-md animate-rise rounded-3xl p-6 sm:p-8 text-center">
        <div className="flex items-center justify-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-sm font-bold text-primary-foreground glow-primary">TJ</span>
          <span className="text-left">
            <span className="block font-display text-sm font-semibold">Trading Journal AI</span>
            <span className="block text-[11px] text-muted-foreground">Track. Analyze. Improve.</span>
          </span>
        </div>

        <div className="mt-8 text-left">
          <h1 className="font-display text-2xl font-semibold">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login" 
              ? "Enter your email and password to sign in." 
              : "Register for a secure trading journal account."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-xs font-medium text-foreground">First Name / Display Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rahul Sharma"
                    className="w-full rounded-xl border border-border bg-background/50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                    required={mode === "signup"}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-border bg-background/50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border bg-background/50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50 glow-primary"
            >
              {isLoading ? (
                mode === "login" ? "Signing in..." : "Creating account..."
              ) : (
                mode === "login" ? "Sign In" : "Create Account"
              )}
              {!isLoading && <ArrowRight className="size-4" />}
            </button>
            
            <div className="mt-4 flex justify-center text-xs text-muted-foreground">
              {mode === "login" ? (
                <span>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setPassword("");
                    }}
                    className="font-medium text-primary hover:underline"
                  >
                    Sign up
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setPassword("");
                    }}
                    className="font-medium text-primary hover:underline"
                  >
                    Sign in
                  </button>
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

