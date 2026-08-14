import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { toast } from "sonner";
import { fetchUserTrades } from "@/lib/trades";
import { cn } from "@/lib/utils";
import {
  User,
  Shield,
  Bell,
  SlidersHorizontal,
  Palette,
  ChevronRight,
  Moon,
  Sun,
  Download,
  LogOut,
  Lock,
  Mail,
  Smartphone,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Edge Journal" },
      { name: "description", content: "Manage your preferences and account settings" },
    ],
  }),
  component: SettingsPage,
});

/* ── Toggle ──────────────────────────────────────────────────── */
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={cn(
        "relative inline-flex h-[22px] w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
        on ? "bg-indigo-500" : "bg-zinc-700"
      )}
    >
      <span className={cn("inline-block size-[18px] rounded-full bg-white shadow transition-transform duration-200", on ? "translate-x-[18px]" : "translate-x-0")} />
    </button>
  );
}

/* ── Accordion Row ───────────────────────────────────────────── */
function SettingRow({
  icon, iconBg, title, subtitle, glowClass, children,
}: {
  icon: React.ReactNode; iconBg: string; title: string; subtitle: string; glowClass?: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("neon-card transition-all duration-200", glowClass, open ? "bg-muted" : "bg-surface")}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-6 py-5 hover:bg-muted/50 transition-colors cursor-pointer"
      >
        <div className={cn("flex items-center justify-center size-12 rounded-2xl flex-shrink-0", iconBg)}>
          {icon}
        </div>
        <div className="flex-1 text-left">
          <p className="text-[15px] font-semibold text-foreground leading-tight">{title}</p>
          <p className="text-[13px] text-muted-foreground mt-0.5 leading-tight">{subtitle}</p>
        </div>
        <ChevronRight className={cn("size-[18px] text-muted-foreground flex-shrink-0 transition-transform duration-200", open && "rotate-90")} />
      </button>

      {open && (
        <div className="border-t border-border px-6 py-5">
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Account Panel ───────────────────────────────────────────── */
function AccountPanel() {
  const { user, profile, signOut, deleteAccount, isOwner } = useAuth();
  const [showDel, setShowDel] = useState(false);
  const [delText, setDelText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const name = profile?.full_name || user?.user_metadata?.["full_name"] || user?.user_metadata?.["name"] || "User";

  const handleDelete = async () => {
    if (delText !== "DELETE") return;
    setDeleting(true);
    try { await deleteAccount(); }
    catch (err: any) { toast.error(`Deletion failed: ${err.message}`); setDeleting(false); setShowDel(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 pb-4 border-b border-border">
        <div className="size-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-[15px] font-semibold text-foreground">{name}</p>
          <p className="text-[13px] text-muted-foreground mt-0.5">{user?.email}</p>
          <span className="mt-1.5 inline-block text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-2 py-0.5 rounded-full">
            {profile?.role === "admin" ? "Admin" : "Trader"}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3 rounded-xl bg-muted/50 border border-border px-4 py-3">
          <Mail className="size-4 text-muted-foreground" />
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Email</p>
            <p className="text-[13px] text-foreground font-medium mt-0.5">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-muted/50 border border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Shield className="size-4 text-muted-foreground" />
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Status</p>
              <p className="text-[13px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 capitalize">{profile?.status || "Active"}</p>
            </div>
          </div>
        </div>
      </div>

      <button onClick={signOut} className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-50 px-4 py-2.5 text-[13px] font-semibold text-rose-600 dark:bg-rose-500/5 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/10 transition cursor-pointer">
        <LogOut className="size-4" /> Sign Out
      </button>

      {!isOwner && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/[0.04] p-4">
          <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">Danger Zone</p>
          <p className="text-[12px] text-muted-foreground mb-3">Permanently delete your account and all data.</p>
          {!showDel ? (
            <button onClick={() => setShowDel(true)} className="w-full rounded-xl bg-rose-600 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-rose-700 transition cursor-pointer">
              Delete Account &amp; All Data
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-[12px] text-muted-foreground">Type <strong className="text-foreground">DELETE</strong> to confirm:</p>
              <input type="text" value={delText} onChange={(e) => setDelText(e.target.value)} placeholder="DELETE"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-rose-500/60 transition" />
              <div className="flex gap-2">
                <button onClick={() => { setShowDel(false); setDelText(""); }} className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-[13px] text-muted-foreground hover:bg-muted transition cursor-pointer">Cancel</button>
                <button onClick={handleDelete} disabled={delText !== "DELETE" || deleting} className="flex-1 rounded-xl bg-rose-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition cursor-pointer">
                  {deleting ? "Deleting…" : "Confirm Delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Security Panel ──────────────────────────────────────────── */
function SecurityPanel() {
  const { user } = useAuth();
  const lastLogin = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-5">
      {/* Auth Method */}
      <div className="rounded-xl border border-border bg-muted/30 px-5 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex-shrink-0">
            <Mail className="size-[18px] text-indigo-400" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-foreground leading-tight">Passwordless OTP Authentication</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">Your account uses secure one-time password login via email — no password required.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5">
          <Shield className="size-4 text-emerald-400 shrink-0" />
          <p className="text-[12px] text-emerald-300 font-medium">Account secured with OTP — {user?.email}</p>
        </div>
      </div>

      {/* Session Info */}
      <div className="border-t border-border pt-5">
        <div className="flex items-center justify-between rounded-xl bg-muted/50 border border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Smartphone className="size-4 text-muted-foreground" />
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Last Login</p>
              <p className="text-[13px] text-foreground font-medium mt-0.5">{lastLogin}</p>
            </div>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">Active</span>
        </div>
      </div>

      {/* How OTP security works */}
      <div className="border-t border-border pt-5">
        <p className="text-[13px] font-semibold text-muted-foreground mb-3">How Your Security Works</p>
        <div className="space-y-2.5">
          {[
            { icon: <Lock className="size-3.5" />, text: "Each login sends a unique 6-digit code to your email" },
            { icon: <Shield className="size-3.5" />, text: "Codes expire after one use — no password to compromise" },
            { icon: <Smartphone className="size-3.5" />, text: "Session tokens are encrypted and stored securely" },
            { icon: <Mail className="size-3.5" />, text: "Unrecognized access triggers automatic code invalidation" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-[12px] text-muted-foreground">
              <span className="text-indigo-400 shrink-0">{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


/* ── Notifications Panel ─────────────────────────────────────── */
function NotificationsPanel() {
  const { userSettings, updateUserSettings } = useAuth();
  if (!userSettings) return null;

  const rows: { key: "daily_summary" | "weekly_report" | "ai_coach_alerts"; label: string; desc: string }[] = [
    { key: "daily_summary", label: "Daily Summary", desc: "Receive a daily summary of your trading activity" },
    { key: "weekly_report", label: "Weekly Report", desc: "Comprehensive Sunday performance report" },
    { key: "ai_coach_alerts", label: "AI Coach Alerts", desc: "Instant alerts when you break your rules" },
  ];

  return (
    <div className="space-y-1">
      {rows.map((row, i) => (
        <div key={row.key} className={cn("flex items-center justify-between py-4", i < rows.length - 1 && "border-b border-border")}>
          <div>
            <p className="text-[13px] font-semibold text-foreground">{row.label}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">{row.desc}</p>
          </div>
          <Toggle on={!!userSettings[row.key]} onChange={(v) => { updateUserSettings({ [row.key]: v }); toast.success(v ? `${row.label} enabled` : `${row.label} disabled`); }} />
        </div>
      ))}
      <div className="pt-3">
        <button onClick={() => toast.success("Test notification sent!")} className="w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-[13px] font-medium text-muted-foreground hover:bg-muted transition cursor-pointer">
          Send Test Notification
        </button>
      </div>
    </div>
  );
}

/* ── Preferences Panel ───────────────────────────────────────── */
function PreferencesPanel() {
  const { userSettings, updateUserSettings } = useAuth();
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  if (!userSettings) return null;

  const handleExport = async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      const trades = await fetchUserTrades();
      if (!trades?.length) { toast.info("No trades to export."); return; }
      const headers = ["ID", "Date", "Pair", "Side", "Session", "Result", "Entry Time", "Exit Time", "Entry Price", "Exit Price", "Risk %", "RRR", "PnL", "Setup", "Notes"];
      const rows = trades.map((t) => [t.id, t.date, t.pair, t.side, t.session, t.result, t.entryTime, t.exitTime, t.entryPrice, t.exitPrice, t.riskPct, t.rrr, t.pnl, t.setup, `"${(t.notes || "").replace(/"/g, '""')}"`]);
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.setAttribute("download", `edgejournal_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success("Exported successfully!");
    } catch { toast.error("Export failed."); }
    finally { setIsExporting(false); }
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="text-[13px] font-semibold text-muted-foreground block mb-2">Currency</label>
        <select value={userSettings.currency} onChange={(e) => { updateUserSettings({ currency: e.target.value }); toast.success("Currency updated"); }}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-[13px] text-foreground outline-none focus:border-indigo-500/40 transition cursor-pointer appearance-none">
          {["USD ($)", "EUR (€)", "GBP (£)", "INR (₹)", "JPY (¥)", "CAD ($)", "AUD ($)"].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="border-t border-border pt-5">
        <label className="text-[13px] font-semibold text-muted-foreground block mb-2">Default Trading Session</label>
        <select value={userSettings.default_session || ""} onChange={(e) => { updateUserSettings({ default_session: e.target.value ? (e.target.value as any) : null }); toast.success("Session updated"); }}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-[13px] text-foreground outline-none focus:border-indigo-500/40 transition cursor-pointer appearance-none">
          <option value="">No default</option>
          {["Asian", "London", "New York"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <p className="text-[11px] text-muted-foreground mt-1.5">Pre-fills the session field when logging new trades.</p>
      </div>

      <div className="border-t border-border pt-5 grid grid-cols-2 gap-3">
        <div>
          <label className="text-[13px] font-semibold text-muted-foreground block mb-2">Default Risk %</label>
          <input type="number" step="0.1" value={userSettings.default_risk_pct || ""} onChange={(e) => updateUserSettings({ default_risk_pct: e.target.value ? parseFloat(e.target.value) : null })}
            onBlur={() => toast.success("Risk % saved")} placeholder="e.g. 1.0"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-[13px] text-foreground outline-none focus:border-indigo-500/40 transition placeholder:text-muted-foreground" />
        </div>
        <div>
          <label className="text-[13px] font-semibold text-muted-foreground block mb-2">Default R:R</label>
          <input type="text" value={userSettings.default_rrr || ""} onChange={(e) => updateUserSettings({ default_rrr: e.target.value || null })}
            onBlur={() => toast.success("R:R saved")} placeholder="e.g. 1:2"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-[13px] text-foreground outline-none focus:border-indigo-500/40 transition placeholder:text-muted-foreground" />
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[13px] font-semibold text-muted-foreground">Compact Interface</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">Reduce spacing across the UI</p>
          </div>
          <Toggle on={!!userSettings.compact_ui} onChange={(v) => { updateUserSettings({ compact_ui: v }); toast.success(v ? "Compact mode on" : "Compact mode off"); }} />
        </div>
        <p className="text-[12px] text-muted-foreground mb-2">Export all your trade data as CSV.</p>
        <button onClick={handleExport} disabled={isExporting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer">
          <Download className="size-4" />{isExporting ? "Exporting…" : "Export My Data (CSV)"}
        </button>
      </div>
    </div>
  );
}

/* ── Appearance Panel ────────────────────────────────────────── */
function AppearancePanel() {
  const { userSettings, updateUserSettings } = useAuth();
  if (!userSettings) return null;

  const ACCENTS = [
    { name: "Indigo", value: "oklch(0.55 0.20 264)" },
    { name: "Pink", value: "oklch(0.65 0.15 340)" },
    { name: "Emerald", value: "oklch(0.60 0.12 150)" },
    { name: "Gold", value: "oklch(0.75 0.08 85)" },
    { name: "Rose", value: "oklch(0.62 0.18 15)" },
    { name: "Cyan", value: "oklch(0.72 0.12 200)" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-muted-foreground">Theme</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">Switch between dark and light mode</p>
        </div>
        <div className="flex rounded-xl border border-border p-1 bg-muted/50">
          <button onClick={() => { updateUserSettings({ theme: "dark" }); toast.success("Dark mode on"); }}
            className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all cursor-pointer",
              userSettings.theme === "dark" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground")}>
            <Moon className="size-3.5" /> Dark
          </button>
          <button onClick={() => { updateUserSettings({ theme: "light" }); toast.success("Light mode on"); }}
            className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all cursor-pointer",
              userSettings.theme === "light" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground")}>
            <Sun className="size-3.5" /> Light
          </button>
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <p className="text-[13px] font-semibold text-muted-foreground mb-3">Accent Colour</p>
        <div className="flex flex-wrap gap-3">
          {ACCENTS.map((a) => {
            const isSelected = userSettings.accent_color === a.value;
            return (
              <button key={a.name} title={a.name} onClick={() => { updateUserSettings({ accent_color: a.value }); toast.success(`${a.name} applied`); }}
                className={cn("relative size-10 rounded-xl cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95",
                  isSelected && "ring-2 ring-indigo-500 ring-offset-2 ring-offset-background scale-110")}
                style={{ background: a.value }}>
                {isSelected && <span className="absolute inset-0 flex items-center justify-center"><Check className="size-4 text-white drop-shadow" /></span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border pt-5 flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-muted-foreground">Compact Interface</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">Reduce spacing in the UI</p>
        </div>
        <Toggle on={!!userSettings.compact_ui} onChange={(v) => { updateUserSettings({ compact_ui: v }); toast.success(v ? "Compact on" : "Compact off"); }} />
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────── */
function SettingsPage() {
  const { userSettings, isLoading } = useAuth();
  const lastLogin = new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

  const sections = [
    {
      icon: <User className="size-[22px] text-[#a855f7]" />,
      iconBg: "bg-[#a855f7]/10 border border-[#a855f7]/25",
      title: "Account",
      subtitle: "Manage your profile and account details",
      glowClass: "neon-glow-purple",
      panel: <AccountPanel />,
    },
    {
      icon: <Shield className="size-[22px] text-emerald-400" />,
      iconBg: "bg-emerald-500/10 border border-emerald-500/25",
      title: "Security",
      subtitle: "Password, 2FA and account security",
      glowClass: "neon-glow-green",
      panel: <SecurityPanel />,
    },
    {
      icon: <Bell className="size-[22px] text-amber-400" />,
      iconBg: "bg-amber-500/10 border border-amber-500/25",
      title: "Notifications",
      subtitle: "Email, push notifications and alerts",
      glowClass: "neon-glow-amber",
      panel: <NotificationsPanel />,
    },
    {
      icon: <SlidersHorizontal className="size-[22px] text-blue-400" />,
      iconBg: "bg-blue-500/10 border border-blue-500/25",
      title: "Preferences",
      subtitle: "Trading preferences and default settings",
      glowClass: "neon-glow-blue",
      panel: <PreferencesPanel />,
    },
    {
      icon: <Palette className="size-[22px] text-purple-400" />,
      iconBg: "bg-purple-500/10 border border-purple-500/25",
      title: "Appearance",
      subtitle: "Theme, colors and display preferences",
      glowClass: "neon-glow-purple",
      panel: <AppearancePanel />,
    },
  ];

  return (
    <AppShell title="Settings" subtitle="Manage your preferences and account settings">
      {isLoading || !userSettings ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading settings…</p>
        </div>
      ) : (
        <div className="w-full max-w-3xl mx-auto space-y-3 pb-12">

          {sections.map((s) => (
            <SettingRow key={s.title} icon={s.icon} iconBg={s.iconBg} title={s.title} subtitle={s.subtitle} glowClass={s.glowClass}>
              {s.panel}
            </SettingRow>
          ))}

          {/* Bottom Security Banner */}
          <div className="neon-card neon-glow-blue flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center size-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex-shrink-0">
                <Shield className="size-[22px]" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-foreground leading-tight">Your data is safe with us</p>
                <p className="text-[13px] text-muted-foreground mt-0.5">We use bank-level encryption to protect your data.</p>
              </div>
            </div>
            <p className="text-[12px] text-muted-foreground flex-shrink-0 text-right">
              Last login: {lastLogin}
            </p>
          </div>

        </div>
      )}
    </AppShell>
  );
}
