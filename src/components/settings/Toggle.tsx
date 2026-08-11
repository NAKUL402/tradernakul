import { cn } from "@/lib/utils";

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cn(
        "h-6 w-11 shrink-0 rounded-full p-0.5 transition",
        on ? "bg-gradient-to-r from-primary to-accent" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "block size-5 rounded-full bg-background transition-transform",
          on && "translate-x-5",
        )}
      />
    </button>
  );
}
