import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, KeyboardEvent, ClipboardEvent } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowRight, Mail, KeyRound, User, Lock, Eye, EyeOff } from "lucide-react";
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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpToken, setOtpToken] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

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

        if (password !== confirmPassword) {
          toast.error("Passwords do not match.");
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
          if (data.session) {
            toast.success("Account created successfully!");
            navigate({ to: "/" });
          } else {
            toast.success("OTP sent to your email.");
            setShowOtp(true);
            setResendCooldown(60);
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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpToken.length < 6) return;
    setIsLoading(true);
    setOtpError("");
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpToken,
        type: "signup"
      });
      if (error) throw error;
      
      await supabase.auth.signOut();
      toast.success("Email verified successfully. Please sign in.");
      setShowOtp(false);
      setMode("login");
      setPassword("");
      setConfirmPassword("");
      setOtpToken("");
    } catch (err: any) {
      const msg = err.message?.toLowerCase() || "";
      if (msg.includes("expired") || msg.includes("invalid token") || msg.includes("token has expired")) {
        setOtpError("That code has expired. Please request a new code.");
      } else if (msg.includes("too many requests") || msg.includes("rate limit") || msg.includes("email rate limit")) {
        setOtpError("Too many attempts. Please wait a moment and try again.");
      } else if (msg.includes("network") || msg.includes("fetch") || msg.includes("failed to fetch")) {
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
      // In many Supabase versions, calling signUp again resends the confirmation.
      // If `resend` method is available, you can use it, but `signUp` is safe here.
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name.trim()
          }
        }
      });
      if (error && !error.message.toLowerCase().includes("user already registered")) {
        throw error;
      }
      toast.success("A new verification code has been sent.");
      setResendCooldown(30);
    } catch (err: any) {
      toast.error(err.message || "Failed to resend code.");
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
            {showOtp ? "Verify your email" : mode === "login" ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {showOtp ? (
              <>
                We've sent a 6-digit verification code to
                <br />
                <span className="font-medium text-foreground">{email}</span>
              </>
            ) : mode === "login" ? (
              "Enter your email and password to sign in."
            ) : (
              "Register for a secure trading journal account."
            )}
          </p>

          {showOtp ? (
            <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
              <div className="animate-in fade-in duration-300">
                <div 
                  className="flex justify-between gap-2 sm:gap-3" 
                  onPaste={handleOtpPaste}
                >
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={otpToken[index] || ""}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="size-10 sm:size-12 text-center text-lg sm:text-xl font-semibold rounded-xl border border-border bg-background/50 outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
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
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50 glow-primary"
              >
                {isLoading ? "Verifying..." : "Verify Code"}
                {!isLoading && <ArrowRight className="size-4" />}
              </button>

              <div className="mt-6 flex flex-col items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span>Didn't receive the code?</span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading || resendCooldown > 0}
                    className="font-medium text-primary hover:underline disabled:opacity-50 disabled:no-underline"
                  >
                    {resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : "Resend code"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOtp(false)}
                  className="hover:underline"
                >
                  Change email address
                </button>
              </div>
            </form>
          ) : (
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
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-border bg-background/50 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {mode === "signup" && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-medium text-foreground">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-border bg-background/50 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                      required={mode === "signup"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50 glow-primary"
              >
                {isLoading ? (
                  mode === "login" ? "Signing in..." : "Sending OTP..."
                ) : (
                  mode === "login" ? "Sign In" : "Send OTP"
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
                        setConfirmPassword("");
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
                        setConfirmPassword("");
                      }}
                      className="font-medium text-primary hover:underline"
                    >
                      Sign in
                    </button>
                  </span>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

