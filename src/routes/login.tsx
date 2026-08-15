import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, KeyboardEvent, ClipboardEvent } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowRight, Mail, User, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { sendOwnerApprovalEmail } from "@/lib/email-service";
import { LoginGuide } from "@/components/app/LoginGuide";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Edge Journal" },
      { name: "description", content: "Access your Edge Journal account securely." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, profile, isApproved, siteSettings } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [showOtp, setShowOtp] = useState(false);
  const [otpToken, setOtpToken] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input box when OTP screen is shown
  useEffect(() => {
    if (showOtp) {
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 50);
    }
  }, [showOtp]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    setOtpError("");
    const digit = value.slice(-1);

    const newOtp = otpToken.split("");
    newOtp[index] = digit;

    while (newOtp.length <= index) {
      newOtp.push("");
    }

    const nextToken = newOtp.join("").slice(0, 6);
    setOtpToken(nextToken);

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpToken[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
      const newOtp = otpToken.split("");
      newOtp[index - 1] = "";
      setOtpToken(newOtp.join(""));
      setOtpError("");
    }
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setOtpError("");
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData) {
      setOtpToken(pastedData);
      const nextEmptyIndex = pastedData.length < 6 ? pastedData.length : 5;
      otpRefs.current[nextEmptyIndex]?.focus();
    }
  };

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // If already authenticated and approved, go to dashboard
  useEffect(() => {
    const ownerBypass = user?.email === "nakulrathi641@gmail.com";
    if (user && (ownerBypass || (profile && isApproved))) {
      navigate({ to: "/" });
    }
  }, [user, profile, isApproved, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      if (siteSettings && !siteSettings.login_enabled) {
        if (email !== "nakulrathi641@gmail.com") {
          toast.error("Login is temporarily disabled by the administrator.");
          setIsLoading(false);
          return;
        }
      }

      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          data: {
            full_name: name.trim(),
          },
        },
      });

      if (error) throw error;

      toast.success("Verification code sent to your email.");
      setShowOtp(true);
      setOtpToken("");
      setOtpError("");
      setResendCooldown(30);
    } catch (err: any) {
      toast.error(err.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isGoogleLoading || isLoading) return;

    // Honour the site-wide login toggle (owner always bypassed server-side)
    if (siteSettings && !siteSettings.login_enabled) {
      toast.error("Login is temporarily disabled by the administrator.");
      return;
    }

    setIsGoogleLoading(true);
    try {
      const redirectTo =
        typeof window !== "undefined"
          ? window.location.origin
          : (import.meta.env.VITE_SITE_URL as string) || "https://tradernakul.vercel.app";

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (error) throw error;
      // Browser redirects to Google — on return, onAuthStateChange in auth-context.tsx
      // picks up the session automatically via the URL hash/code exchange.
    } catch (err: any) {
      toast.error(err.message || "Google sign-in failed. Please try again.");
      setIsGoogleLoading(false);
    }
    // Do NOT setIsGoogleLoading(false) on success — the page redirects away.
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpToken.length < 6) return;
    setIsLoading(true);
    setOtpError("");
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpToken,
        type: "email",
      });
      if (error) throw error;

      if (data.session) {
        toast.success("Verified successfully!");

        // Request owner approval silently (owner email is auto-approved by RLS/Trigger, so this is fine to call)
        try {
          await sendOwnerApprovalEmail({ userEmail: email, userName: name.trim() });
        } catch (e) {
          console.error("Failed to send owner approval request email:", e);
        }

        navigate({ to: "/" });
      } else {
        throw new Error("Verification successful, but failed to load session. Please try again.");
      }
    } catch (err: any) {
      const msg = err.message?.toLowerCase() || "";
      if (
        msg.includes("expired") ||
        msg.includes("invalid token") ||
        msg.includes("token has expired")
      ) {
        setOtpError("That code has expired. Please request a new code.");
      } else if (
        msg.includes("too many requests") ||
        msg.includes("rate limit") ||
        msg.includes("email rate limit")
      ) {
        setOtpError("Too many attempts. Please wait a moment and try again.");
      } else if (
        msg.includes("network") ||
        msg.includes("fetch") ||
        msg.includes("failed to fetch")
      ) {
        setOtpError("Something went wrong. Please check your connection and try again.");
      } else {
        setOtpError("That code is incorrect. Please check your email and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    setOtpError("");
    try {
      const { error } = await supabase.auth.resend({
        type: "signup", // Supabase requires "signup" for resend when using signInWithOtp for new users
        email,
      });

      if (error) throw error;

      toast.success("A new verification code has been sent.");
      setResendCooldown(30);
    } catch (err: any) {
      toast.error(err.message || "Failed to resend code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Static Premium Background */}
      <div className="pointer-events-none absolute -left-32 top-0 size-[32rem] rounded-full bg-primary/10 blur-[100px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 size-[28rem] rounded-full bg-accent/10 blur-[100px]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(var(--color-border)_1px,transparent_1px),linear-gradient(90deg,var(--color-border)_1px,transparent_1px)] [background-size:44px_44px]" />

      <div className="relative w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="rounded-3xl border border-border/40 bg-background/60 p-8 text-center shadow-2xl shadow-black/10 backdrop-blur-2xl">
          {/* Logo & Header */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <img
              src="/logo.png"
              alt="Edge Journal"
              className="size-20 rounded-[20px] object-cover shadow-lg shadow-primary/20"
            />

            <div className="space-y-1">
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                {showOtp ? "Verify Your Email" : "Welcome to Edge Journal"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {showOtp ? (
                  <>
                    We sent a secure code to
                    <br />
                    <span className="font-medium text-foreground">{email}</span>
                  </>
                ) : (
                  "Enter your details to securely access your journal."
                )}
              </p>
            </div>
          </div>

            {/* Forms */}
          {showOtp ? (
            <form onSubmit={handleVerifyOtp} className="mt-8 space-y-6">
              <div className="animate-in fade-in zoom-in-95 duration-500">
                <div className="flex justify-between gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      ref={(el) => { otpRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={otpToken[index] || ""}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="size-11 sm:size-12 text-center text-xl font-bold rounded-xl border border-border/50 bg-background/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                      maxLength={2}
                      aria-label={`Digit ${index + 1}`}
                      disabled={isLoading}
                    />
                  ))}
                </div>
                {otpError && (
                  <p className="mt-3 text-sm font-medium text-destructive animate-in fade-in slide-in-from-top-1">
                    {otpError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || otpToken.length < 6}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3.5 text-sm font-semibold text-background transition-all hover:bg-foreground/90 active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? "Verifying..." : "Verify Code"}
                {!isLoading && <ArrowRight className="size-4" />}
              </button>

              <div className="mt-6 flex flex-col items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span>Didn't receive the code?</span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading || resendCooldown > 0}
                    className="font-semibold text-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:hover:text-foreground"
                  >
                    {resendCooldown > 0 ? `Wait ${resendCooldown}s` : "Resend"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowOtp(false);
                    setOtpToken("");
                    setOtpError("");
                  }}
                  className="font-medium hover:text-foreground transition-colors"
                >
                  Use a different email address
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-8 space-y-5">
              {/* ── OTP Email Form ───────────────────────────────── */}
              <form onSubmit={handleSubmit} className="space-y-5 text-left">
                <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 fill-mode-backwards">
                  <label className="text-[13px] font-semibold text-foreground/80">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground/70" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="E.g. Rahul Sharma"
                      className="w-full rounded-xl border border-border/50 bg-background/50 py-3 pl-10 pr-4 text-[15px] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 fill-mode-backwards">
                  <label className="text-[13px] font-semibold text-foreground/80">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground/70" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full rounded-xl border border-border/50 bg-background/50 py-3 pl-10 pr-4 text-[15px] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>

                <div className="pt-1 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 fill-mode-backwards">
                  <button
                    type="submit"
                    disabled={isLoading || isGoogleLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3.5 text-[15px] font-semibold text-background transition-all hover:bg-foreground/90 active:scale-[0.98] disabled:opacity-50 shadow-md shadow-black/5"
                  >
                    {isLoading ? "Sending secure code..." : "Continue with Email"}
                    {!isLoading && <ArrowRight className="size-4" />}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer info */}
        <p className="mt-8 text-center text-[13px] text-muted-foreground animate-in fade-in duration-700 delay-300 fill-mode-backwards">
          Secure, passwordless authentication by Edge Journal.
        </p>
      </div>

      <LoginGuide />
    </div>
  );
}
