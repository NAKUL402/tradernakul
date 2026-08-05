import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout, GoogleButton, field, primaryBtn } from "@/components/app/AuthLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up — Trading Journal AI" },
      { name: "description", content: "Create your free Trading Journal AI account and start tracking, analyzing and improving your trades." },
      { property: "og:title", content: "Sign up — Trading Journal AI" },
      { property: "og:description", content: "Start your premium AI trading journal in under a minute." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Account created successfully — welcome to TraderNakul!");
      navigate({ to: "/" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create account";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Ek journal jo aapko profitable trader banaye."
      footer={<>Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link></>}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          type="text"
          required
          placeholder="Full name"
          className={field}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
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
          placeholder="Create password"
          className={field}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" disabled={isSubmitting} className={primaryBtn}>
          {isSubmitting ? "Creating account…" : "Create free account"}
        </button>
      </form>
      <div className="flex items-center gap-3 text-[11px] uppercase text-muted-foreground">
        <span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" />
      </div>
      <GoogleButton />
      <p className="text-center text-[11px] text-muted-foreground">By signing up you agree to our Terms &amp; Privacy Policy.</p>
    </AuthLayout>
  );
}
