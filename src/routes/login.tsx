import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout, GoogleButton, field, primaryBtn } from "@/components/app/AuthLayout";
import { supabase } from "@/lib/supabase";
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

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Logged in successfully — welcome back!");
      navigate({ to: "/" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to log in";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Apne trades ka analysis continue karo."
      footer={<>New here? <Link to="/signup" className="font-medium text-primary hover:underline">Create an account</Link></>}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          type="email"
          required
          placeholder="Email address"
          className={field}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          required
          placeholder="Password"
          className={field}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input type="checkbox" className="accent-[var(--color-primary)]" /> Remember me
          </label>
          <button
            type="button"
            onClick={() => toast.info("Password reset link has been requested.")}
            className="text-primary hover:underline"
          >
            Forgot password?
          </button>
        </div>
        <button type="submit" disabled={isSubmitting} className={primaryBtn}>
          {isSubmitting ? "Logging in…" : "Log in"}
        </button>
      </form>
      <div className="flex items-center gap-3 text-[11px] uppercase text-muted-foreground">
        <span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" />
      </div>
      <GoogleButton />
    </AuthLayout>
  );
}
