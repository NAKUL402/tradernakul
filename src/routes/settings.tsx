import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { Panel } from "@/components/app/ui-kit";
import { cn } from "@/lib/utils";
import { Download, Moon, Save, Sun, Upload } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Trading Journal AI" },
      { name: "description", content: "Control theme, accent colour, currency, CSV import/export, backups and notifications." },
      { property: "og:title", content: "Settings — Trading Journal AI" },
      { property: "og:description", content: "Personalise your trading journal: theme, accent, currency and data backups." },
    ],
  }),
  component: SettingsPage,
});

const ACCENTS = [
  { name: "Neon Blue", value: "oklch(0.64 0.21 268)" },
  { name: "Violet", value: "oklch(0.62 0.24 305)" },
  { name: "Emerald", value: "oklch(0.72 0.19 155)" },
  { name: "Amber", value: "oklch(0.78 0.16 85)" },
  { name: "Rose", value: "oklch(0.65 0.23 15)" },
];

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cn("h-6 w-11 rounded-full p-0.5 transition", on ? "bg-gradient-to-r from-primary to-accent" : "bg-muted")}
    >
      <span className={cn("block size-5 rounded-full bg-background transition-transform", on && "translate-x-5")} />
    </button>
  );
}

function SettingsPage() {
  const [dark, setDark] = useState(true);
  const [accent, setAccent] = useState(ACCENTS[0]!.value);
  const [currency, setCurrency] = useState("USD ($)");
  const [notif, setNotif] = useState({ daily: true, weekly: true, coach: false });

  const setTheme = (isDark: boolean) => {
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  };

  const applyAccent = (v: string) => {
    setAccent(v);
    document.documentElement.style.setProperty("--primary", v);
    document.documentElement.style.setProperty("--ring", v);
  };

  return (
    <AppShell title="Settings" subtitle="Personalise your journal">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Appearance">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground">Switch between dark and light mode</p>
            </div>
            <div className="flex rounded-xl border border-border p-1">
              <button onClick={() => setTheme(true)} className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs", dark && "bg-primary/20 text-primary")}><Moon className="size-3.5" /> Dark</button>
              <button onClick={() => setTheme(false)} className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs", !dark && "bg-primary/20 text-primary")}><Sun className="size-3.5" /> Light</button>
            </div>
          </div>
          <div className="mt-5">
            <p className="text-sm font-medium">Accent colour</p>
            <div className="mt-3 flex gap-3">
              {ACCENTS.map((a) => (
                <button
                  key={a.name}
                  aria-label={a.name}
                  onClick={() => applyAccent(a.value)}
                  className={cn("size-9 rounded-xl ring-offset-2 ring-offset-background transition", accent === a.value && "ring-2 ring-foreground")}
                  style={{ background: a.value }}
                />
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Trading Preferences">
          <label className="text-sm font-medium">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="mt-2 w-full rounded-xl border border-border bg-card/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {["USD ($)", "INR (₹)", "EUR (€)", "GBP (£)", "AED (د.إ)"].map((c) => <option key={c}>{c}</option>)}
          </select>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button onClick={() => toast.success("CSV export ready — download started.")} className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-3 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"><Download className="size-4" /> Export CSV</button>
            <button onClick={() => toast.info("Choose a CSV file to import your trades.")} className="flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-medium transition hover:border-primary/60"><Upload className="size-4" /> Import CSV</button>
          </div>
          <button onClick={() => toast.success("Backup created successfully.")} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-medium transition hover:border-primary/60"><Save className="size-4" /> Create backup</button>
        </Panel>

        <Panel title="Notifications" className="lg:col-span-2">
          <div className="space-y-4">
            {([
              ["daily", "Daily summary", "Roz shaam ko aapka PnL summary"],
              ["weekly", "Weekly report", "Har Sunday performance report"],
              ["coach", "AI Coach alerts", "Rule break hone par instant alert"],
            ] as const).map(([key, title, desc]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <Toggle on={notif[key]} onChange={(v) => setNotif({ ...notif, [key]: v })} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
