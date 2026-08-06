import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — Trading Journal AI" },
      { name: "description", content: "Log in to Trading Journal AI to access your dashboard, trade journal and AI coach." },
      { property: "og:title", content: "Log in — Trading Journal AI" },
      { property: "og:description", content: "Access your premium AI-powered trading journal." },
    ],
  }),
  component: LoginPage,
});

const field =
  "w-full rounded-xl border border-border bg-card/50 px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-ring/40";

const primaryBtn =
  "flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] glow-primary disabled:opacity-50";

function LoginPage() {
  const navigate = useNavigate();
  const { user, isApproved, sendOTP, verifyOTP } = useAuth();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<"pending" | "rejected" | "suspended" | null>(null);

  useEffect(() => {
    // Listen for custom approval block events from AuthContext
    const handleApprovalBlocked = (e: Event) => {
      const customEvent = e as CustomEvent;
      const status = customEvent.detail?.status;
      if (status) {
        setApprovalStatus(status);
        if (status === "pending") {
          toast.info("Access pending: Your request is awaiting administrator approval.");
        } else if (status === "rejected") {
          toast.error("Access denied: Your request has been rejected.");
        } else if (status === "suspended") {
          toast.error("Account suspended: Please contact the administrator.");
        }
      }
    };

    window.addEventListener("auth_approval_blocked", handleApprovalBlocked);
    return () => {
      window.removeEventListener("auth_approval_blocked", handleApprovalBlocked);
    };
  }, []);

  // Redirect if already logged in and approved
  useEffect(() => {
    if (user && isApproved) {
      navigate({ to: "/" });
    }
  }, [user, isApproved, navigate]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    setApprovalStatus(null);

    try {
      await sendOTP(email);
      toast.success("Verification code (OTP) sent to your email!");
      setStep("otp");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send code";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp) return;
    setIsSubmitting(true);
    setApprovalStatus(null);

    try {
      await verifyOTP(email, otp);
      toast.success("Verification successful — welcome!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid code. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -left-32 top-0 size-[28rem] animate-float-slow rounded-full bg-primary/25 blur-[120px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 size-[26rem] animate-float-slow rounded-full bg-accent/25 blur-[120px] [animation-delay:2s]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(var(--color-border)_1px,transparent_1px),linear-gradient(90deg,var(--color-border)_1px,transparent_1px)] [background-size:44px_44px]" />

      <div className="glass relative w-full max-w-md animate-rise rounded-3xl p-6 sm:p-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-sm font-bold text-primary-foreground glow-primary">TJ</span>
          <span>
            <span className="block font-display text-sm font-semibold">Trading Journal AI</span>
            <span className="block text-[11px] text-muted-foreground">Track. Analyze. Improve.</span>
          </span>
        </Link>

        <h1 className="mt-7 font-display text-2xl font-semibold">
          {step === "email" ? "Verify your email" : "Enter verification code"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {step === "email"
            ? "Log in securely using a one-time code sent to your email address."
            : `We sent a 6-digit code to ${email}`}
        </p>

        {approvalStatus && (
          <div className="mt-5 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-xs animate-rise">
            {approvalStatus === "pending" && (
              <p className="font-medium text-foreground leading-normal">
                Your access request has been sent to the administrator. Please wait for approval.
              </p>
            )}
            {approvalStatus === "rejected" && (
              <p className="font-medium text-destructive leading-normal">
                Your access request has been rejected by the administrator.
              </p>
            )}
            {approvalStatus === "suspended" && (
              <p className="font-medium text-destructive leading-normal">
                Your account is currently suspended. Please contact the administrator.
              </p>
            )}
          </div>
        )}

        {step === "email" ? (
          <form className="mt-6 space-y-4" onSubmit={handleSendOTP}>
            <input
              type="email"
              required
              placeholder="Email address"
              className={field}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            
            <button type="submit" disabled={isSubmitting} className={primaryBtn}>
              {isSubmitting ? "Sending code…" : "Send Verification Code"}
            </button>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleVerifyOTP}>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="Enter 6-digit OTP code"
              className={`${field} tracking-widest text-center text-lg font-semibold`}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              autoComplete="one-time-code"
            />
            
            <button type="submit" disabled={isSubmitting} className={primaryBtn}>
              {isSubmitting ? "Verifying…" : "Verify & Log in"}
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setStep("email")}
              className="mt-2 text-center text-xs text-muted-foreground hover:text-foreground w-full underline"
            >
              Go Back
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
