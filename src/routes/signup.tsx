import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase, type Profile, generateUUID } from "@/lib/supabase";
import { sendOTPEmail, sendOwnerApprovalEmail } from "@/lib/email-service";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up — Trading Journal AI" },
      { name: "description", content: "Create an account on Trading Journal AI and request access approval." },
      { property: "og:title", content: "Sign up — Trading Journal AI" },
      { property: "og:description", content: "Request access to the premium AI-powered trading journal." },
    ],
  }),
  component: SignupPage,
});

const field =
  "w-full rounded-xl border border-border bg-card/50 px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-ring/40";

const primaryBtn =
  "flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] glow-primary disabled:opacity-50";

function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"details" | "otp">("details");
  const [currentOTP, setCurrentOTP] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName) return;
    setIsSubmitting(true);

    // Generate a secure 6-digit OTP — stored in state, NEVER shown to user
    const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
    setCurrentOTP(generatedOTP);

    try {
      const result = await sendOTPEmail({ email: email.toLowerCase().trim(), otp: generatedOTP });

      if (result.success) {
        toast.success("Verification code sent! Check your email inbox (and spam folder).");
        setStep("otp");
      } else {
        // Do NOT show the OTP — show only the error
        toast.error(
          result.error ||
          "Failed to send verification email. Please verify your email address and try again."
        );
        // Clear the OTP so it cannot be guessed/reused
        setCurrentOTP(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unexpected error. Please try again.";
      toast.error(msg);
      setCurrentOTP(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !currentOTP) return;
    setIsSubmitting(true);

    if (otp.trim() !== currentOTP) {
      toast.error("Invalid verification code. Please try again.");
      setIsSubmitting(false);
      return;
    }

    const cleanedEmail = email.toLowerCase().trim();
    const ownerEmails = ["nakultrader007@gmail.com"];
    const isOwnerEmail = ownerEmails.includes(cleanedEmail);

    try {
      // Check if account already exists
      const { data: profiles } = await supabase.from("profiles").select("*");
      const existing = (profiles || []).find(
        (p: Profile) => p.email.toLowerCase() === cleanedEmail
      );

      if (existing) {
        toast.error("An account with this email already exists. Please log in instead.");
        setIsSubmitting(false);
        return;
      }

      // Create the new user profile with "pending" status (or "approved" for owner)
      const newProfile: Profile = {
        id: generateUUID(),
        email: cleanedEmail,
        full_name: fullName.trim(),
        avatar_url: null,
        role: isOwnerEmail ? "admin" : "user",
        status: isOwnerEmail ? "approved" : "pending",
        is_owner: isOwnerEmail,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase.from("profiles").insert(newProfile);
      if (insertError) {
        toast.error(insertError.message || "Failed to create profile. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Clear OTP immediately after use — security
      setCurrentOTP(null);

      if (isOwnerEmail) {
        // Owner gets instant access — no approval needed
        toast.success("Owner account verified! You can now log in.");
        setIsSuccess(true);
        return;
      }

      // For non-owner users: send approval request email to owner
      const approvalResult = await sendOwnerApprovalEmail({
        userEmail: cleanedEmail,
        userName: fullName.trim(),
      });

      if (approvalResult.success) {
        console.log("[signup] Owner approval email sent successfully.");
      } else {
        // Log the error but don't block the user — profile already created
        console.warn("[signup] Owner approval email failed:", approvalResult.error);
      }

      toast.success("Account request submitted! The owner has been notified.");
      setIsSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed. Please try again.";
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

        {isSuccess ? (
          <div className="mt-8 text-center animate-rise">
            <div className="mx-auto size-16 grid place-items-center rounded-2xl bg-primary/20 text-3xl">⏳</div>
            <h2 className="mt-6 font-display text-xl font-semibold">Pending Approval</h2>
            <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-xs text-left leading-normal space-y-2">
              <p className="font-medium text-foreground">
                ✅ Your email has been verified successfully.
              </p>
              <p className="text-muted-foreground">
                Your access request has been sent to the administrator at <strong>nakultrader007@gmail.com</strong>. 
                You will gain access once the owner approves your request.
              </p>
            </div>
            <Link
              to="/login"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary to-accent py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 glow-primary"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mt-7 font-display text-2xl font-semibold">
              {step === "details" ? "Create account" : "Enter verification code"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {step === "details"
                ? "Request access to the trading platform."
                : `We sent a 6-digit code to ${email}. Check your inbox and spam folder.`}
            </p>

            {step === "details" ? (
              <form className="mt-6 space-y-4" onSubmit={handleSendOTP}>
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  className={field}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                />
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
                  placeholder="Enter 6-digit code from your email"
                  className={`${field} tracking-widest text-center text-lg font-semibold`}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  autoComplete="one-time-code"
                />

                <button type="submit" disabled={isSubmitting} className={primaryBtn}>
                  {isSubmitting ? "Verifying…" : "Verify & Register"}
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setStep("details");
                    setCurrentOTP(null);
                    setOtp("");
                  }}
                  className="mt-2 text-center text-xs text-muted-foreground hover:text-foreground w-full underline"
                >
                  Go Back
                </button>
              </form>
            )}

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Log in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
