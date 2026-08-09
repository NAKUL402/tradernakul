import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowRight, Mail, KeyRound, Clock } from "lucide-react";
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
  const { user, profile } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // If already authenticated and approved, go to dashboard
  useEffect(() => {
    if (user && profile && profile.status !== "pending" && profile.status !== "rejected" && profile.status !== "suspended") {
      navigate({ to: "/" });
    }
  }, [user, profile, navigate]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return;
    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: {
            full_name: name.trim()
          }
        },
      });

      if (error) throw error;

      toast.success("Verification code sent to your email!");
      setStep("otp");
      setCooldown(60);
    } catch (err: any) {
      if (err.message?.toLowerCase().includes("rate limit")) {
        toast.error("Too many verification requests. Please wait a few minutes and try again.");
      } else {
        toast.error(err.message || "Failed to send verification code.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit code.");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (error) throw error;

      if (data.session) {
        toast.success("Identity verified successfully.");
        
        // Check if user was just created (within the last 60 seconds)
        const userCreatedAt = new Date(data.session.user.created_at).getTime();
        const now = Date.now();
        const isNewUser = (now - userCreatedAt) < 60000;

        if (isNewUser) {
          // Dispatch owner approval notification in the background
          sendOwnerApprovalEmail({
            userEmail: email,
            userName: data.session.user.user_metadata?.full_name || email,
          }).catch(console.error);
        }

        navigate({ to: "/" });
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid or expired verification code.");
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
            {step === "email" ? "Request Access" : "Verify Email"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {step === "email" 
              ? "Enter your email to sign in or request an account." 
              : `Enter the 6-digit code sent to ${email}`}
          </p>

          {step === "email" ? (
            <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">First Name / Display Name</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 size-4 -translate-y-1/2 flex items-center justify-center text-muted-foreground font-bold text-xs">
                    TN
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rahul Sharma"
                    className="w-full rounded-xl border border-border bg-background/50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
              </div>

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

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50 glow-primary"
              >
                {isLoading ? "Sending code..." : "Send Verification Code"}
                {!isLoading && <ArrowRight className="size-4" />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">6-Digit Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full rounded-xl border border-border bg-background/50 py-2.5 pl-10 pr-4 text-sm tracking-widest outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                    required
                    maxLength={6}
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50 glow-primary"
              >
                {isLoading ? "Verifying..." : "Verify & Continue"}
                {!isLoading && <ArrowRight className="size-4" />}
              </button>
              
              <div className="mt-4 flex justify-between text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="hover:text-foreground transition"
                >
                  Change email
                </button>
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={cooldown > 0 || isLoading}
                  className="flex items-center gap-1 hover:text-foreground transition disabled:opacity-50"
                >
                  {cooldown > 0 ? (
                    <>
                      <Clock className="size-3" />
                      Resend in {cooldown}s
                    </>
                  ) : (
                    "Resend Code"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
