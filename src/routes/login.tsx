import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthLayout, GoogleButton, field, primaryBtn } from "@/components/app/AuthLayout";
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
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Apne trades ka analysis continue karo."
      footer={<>New here? <Link to="/signup" className="font-medium text-primary hover:underline">Create an account</Link></>}
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Logged in — welcome back!");
          navigate({ to: "/" });
        }}
      >
        <input type="email" required placeholder="Email address" className={field} />
        <input type="password" required placeholder="Password" className={field} />
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-muted-foreground"><input type="checkbox" className="accent-[var(--color-primary)]" /> Remember me</label>
          <button type="button" onClick={() => toast.info("Password reset link bhej diya gaya hai.")} className="text-primary hover:underline">Forgot password?</button>
        </div>
        <button type="submit" className={primaryBtn}>Log in</button>
      </form>
      <div className="flex items-center gap-3 text-[11px] uppercase text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
      <GoogleButton />
    </AuthLayout>
  );
}
