import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthLayout, GoogleButton, field, primaryBtn } from "@/components/app/AuthLayout";
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
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Ek journal jo aapko profitable trader banaye."
      footer={<>Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link></>}
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Account created — let's start journaling!");
          navigate({ to: "/" });
        }}
      >
        <input required placeholder="Full name" className={field} />
        <input type="email" required placeholder="Email address" className={field} />
        <input type="password" required placeholder="Create password" className={field} />
        <button type="submit" className={primaryBtn}>Create free account</button>
      </form>
      <div className="flex items-center gap-3 text-[11px] uppercase text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
      <GoogleButton />
      <p className="text-center text-[11px] text-muted-foreground">By signing up you agree to our Terms &amp; Privacy Policy.</p>
    </AuthLayout>
  );
}
