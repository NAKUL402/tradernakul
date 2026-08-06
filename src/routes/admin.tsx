import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { Badge, Panel, StatCard } from "@/components/app/ui-kit";
import { useAuth } from "@/lib/auth-context";
import { supabase, type Profile } from "@/lib/supabase";
import { THEME_PRESETS, applyThemePreset } from "@/lib/theme-service";
import { sendMassEmailBroadcaster } from "@/lib/email-service";
import {
  CheckCircle2, Clock, Megaphone,
  Save, ShieldCheck, ShieldAlert, Users, XCircle, Zap, Activity, Trash2, Ban,
  Palette, Mail, BarChart3, Settings, Sparkles, Send
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Owner Admin Command Portal — Trading Journal AI" },
      { name: "description", content: "Executive Owner Command Portal: User approvals, multi-theme customization, email broadcasting, and analytics." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, isOwner, isLoading } = useAuth();
  const navigate = useNavigate();
  const [usersList, setUsersList] = useState<Profile[]>([]);
  const [activeTab, setActiveTab] = useState<"approvals" | "themes" | "broadcaster" | "analytics" | "settings">("approvals");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "suspended">("all");
  const [isFetchingUsers, setIsFetchingUsers] = useState(true);
  const [totalDbTrades, setTotalDbTrades] = useState(0);

  // Theme Customizer State
  const [activeTheme, setActiveTheme] = useState(() => {
    return typeof window !== "undefined" ? localStorage.getItem("tradernakul_active_theme") || "cyberpunk-purple" : "cyberpunk-purple";
  });

  // Broadcaster State
  const [mailTarget, setMailTarget] = useState<"all" | "approved" | "pending">("approved");
  const [mailOccasion, setMailOccasion] = useState<"announcement" | "festival" | "birthday" | "market_update">("announcement");
  const [mailSubject, setMailSubject] = useState("Important Announcement — TraderNakul AI");
  const [mailTitle, setMailTitle] = useState("Welcome to our Trading Ecosystem!");
  const [mailText, setMailText] = useState("We are excited to share new AI analysis tools and features for your trading journal.");
  const [isSendingMail, setIsSendingMail] = useState(false);

  // Site Controls State
  const [banner, setBanner] = useState("Welcome to TraderNakul — Professional AI Trading Journal");
  const [bannerActive, setBannerActive] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [mt5Enabled, setMt5Enabled] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      toast.error("Please login first to access the Admin Command Portal.");
      navigate({ to: "/login" });
      return;
    }

    if (!isAdmin && !isOwner) {
      toast.error("Unauthorized: Owner Admin access only.");
      navigate({ to: "/" });
      return;
    }

    fetchUsers();
    fetchSettings();
  }, [isLoading, user, isAdmin, isOwner]);

  const fetchUsers = async () => {
    setIsFetchingUsers(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error(`Error loading users: ${error.message}`);
        setUsersList([]);
      } else if (data) {
        setUsersList(data as Profile[]);
      }

      // Fetch live trades count
      const { count } = await supabase
        .from("trades")
        .select("*", { count: "exact", head: true });

      if (count !== null) {
        setTotalDbTrades(count);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("Error fetching user details.");
    } finally {
      setIsFetchingUsers(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("id", 1)
        .single();

      if (!error && data) {
        setBanner(data.announcement_banner || "");
        setBannerActive(data.banner_active || false);
        setMaintenance(data.maintenance_mode || false);
        setAiEnabled(data.ai_coach_enabled ?? true);
        setMt5Enabled(data.mt5_sync_enabled ?? true);
      }
    } catch (err) {
      console.error("Error fetching site settings:", err);
    }
  };

  const updateUserStatus = async (targetId: string, newStatus: "approved" | "rejected" | "pending" | "suspended") => {
    const targetUser = usersList.find((u) => u.id === targetId);
    if (targetUser?.is_owner) {
      toast.error("CRITICAL SECURITY: Owner profile status cannot be modified.");
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", targetId);

      if (error) {
        toast.error(`Failed to update status in DB: ${error.message}`);
        return;
      }

      setUsersList((prev) =>
        prev.map((u) => (u.id === targetId ? { ...u, status: newStatus } : u))
      );

      toast.success(`User access set to ${newStatus.toUpperCase()}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      toast.error(`Error updating status: ${msg}`);
    }
  };

  const deleteUser = async (targetId: string) => {
    const targetUser = usersList.find((u) => u.id === targetId);
    if (targetUser?.is_owner) {
      toast.error("CRITICAL SECURITY: Owner profile cannot be deleted.");
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete user ${targetUser?.email}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", targetId);

      if (error) {
        toast.error(`Failed to delete user in DB: ${error.message}`);
        return;
      }

      setUsersList((prev) => prev.filter((u) => u.id !== targetId));
      toast.success("User profile deleted successfully");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      toast.error(`Error deleting user: ${msg}`);
    }
  };

  const handleSelectTheme = (themeId: string) => {
    applyThemePreset(themeId);
    setActiveTheme(themeId);
    toast.success(`Theme updated to ${THEME_PRESETS.find(t => t.id === themeId)?.name}`);
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingMail(true);

    const targetUsers = usersList.filter((u) => {
      if (mailTarget === "all") return true;
      if (mailTarget === "approved") return u.status === "approved" || u.is_owner;
      if (mailTarget === "pending") return u.status === "pending";
      return true;
    });

    const emails = targetUsers.map((u) => u.email).filter(Boolean);

    if (emails.length === 0) {
      toast.error("No recipients found matching the target filter.");
      setIsSendingMail(false);
      return;
    }

    try {
      const result = await sendMassEmailBroadcaster({
        recipients: emails,
        subject: mailSubject,
        bodyTitle: mailTitle,
        bodyText: mailText,
        occasionType: mailOccasion,
      });

      if (result.success) {
        toast.success(`Broadcast email sent to ${emails.length} subscribers!`);
      } else {
        if (result.mode === "missing_config") {
          toast.info(`[Debug Broadcaster] Would send email to ${emails.length} users. Setup EMAIL_USER and EMAIL_PASS in Vercel.`);
        } else {
          toast.error(`Broadcast failed: ${result.error || result.message}`);
        }
      }
    } catch (err: any) {
      toast.error(`Broadcaster error: ${err.message}`);
    } finally {
      setIsSendingMail(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        .upsert({
          id: 1,
          announcement_banner: banner,
          banner_active: bannerActive,
          maintenance_mode: maintenance,
          ai_coach_enabled: aiEnabled,
          mt5_sync_enabled: mt5Enabled,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        toast.error(`Error saving settings: ${error.message}`);
      } else {
        toast.success("Site control panel updated successfully!");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed";
      toast.error(msg);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const filteredUsers = usersList.filter((u) => {
    if (filter === "all") return true;
    return u.status === filter;
  });

  const totalUsers = usersList.length;
  const pendingCount = usersList.filter((u) => u.status === "pending").length;
  const approvedCount = usersList.filter((u) => u.status === "approved" || u.is_owner).length;

  if (isLoading) {
    return (
      <AppShell title="Admin Portal">
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Loading Command Portal…</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Owner Admin Command Portal" subtitle="Executive User Approvals, Custom Themes, Email Broadcaster & Trading Analytics">
      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total Users" value={String(totalUsers)} icon={<Users className="size-4" />} />
        <StatCard label="Pending Approval" value={String(pendingCount)} icon={<Clock className="size-4" />} accent="accent" />
        <StatCard label="Approved Traders" value={String(approvedCount)} icon={<CheckCircle2 className="size-4" />} accent="success" />
        <StatCard label="Total Logged Trades" value={String(totalDbTrades)} icon={<Activity className="size-4" />} />
      </div>

      {/* Command Portal Navigation Tabs */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-border/60 pb-3">
        {[
          { id: "approvals", label: "User Approvals & Access", icon: ShieldCheck, badge: pendingCount > 0 ? pendingCount : undefined },
          { id: "themes", label: "Multi-Theme Customizer", icon: Palette },
          { id: "broadcaster", label: "Mass Mail & Occasion Broadcaster", icon: Mail },
          { id: "analytics", label: "Advanced Analytics Engine", icon: BarChart3 },
          { id: "settings", label: "Site Banners & Controls", icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg glow-primary"
                : "border border-border/60 bg-card/40 text-muted-foreground hover:bg-card/80 hover:text-foreground"
            }`}
          >
            <tab.icon className="size-4" />
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: User Approvals & Access Control */}
      {activeTab === "approvals" && (
        <div className="mt-6 space-y-6 animate-rise">
          <Panel
            title="User Approval & Access Queue"
            subtitle="Review new trader login requests. Approved users gain access to dashboard and trade logs."
            action={
              <div className="flex flex-wrap items-center gap-1.5">
                {(["all", "pending", "approved", "rejected", "suspended"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-lg px-2.5 py-1 text-xs capitalize transition ${
                      filter === f
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            }
          >
            {isFetchingUsers ? (
              <div className="py-12 text-center text-xs text-muted-foreground">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">No users match the selected status filter.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/60 text-muted-foreground">
                      <th className="pb-3 pt-1 font-medium">User Email</th>
                      <th className="pb-3 pt-1 font-medium">Status</th>
                      <th className="pb-3 pt-1 font-medium">Role</th>
                      <th className="pb-3 pt-1 font-medium">Registered Date</th>
                      <th className="pb-3 pt-1 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-muted/20">
                        <td className="py-3 font-medium">
                          <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-primary" />
                            <span>{u.email}</span>
                            {u.is_owner && (
                              <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-accent">OWNER</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3">
                          {u.status === "approved" || u.is_owner ? (
                            <Badge tone="win">Approved</Badge>
                          ) : u.status === "pending" ? (
                            <Badge tone="accent">Pending</Badge>
                          ) : u.status === "rejected" ? (
                            <Badge tone="loss">Rejected</Badge>
                          ) : (
                            <Badge tone="loss">Suspended</Badge>
                          )}
                        </td>
                        <td className="py-3 capitalize text-muted-foreground">{u.role}</td>
                        <td className="py-3 text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="py-3 text-right">
                          {u.is_owner ? (
                            <span className="text-[11px] font-semibold text-accent">Protected Owner</span>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              {u.status !== "approved" && (
                                <button
                                  onClick={() => updateUserStatus(u.id, "approved")}
                                  className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20"
                                >
                                  <CheckCircle2 className="size-3.5" /> Approve
                                </button>
                              )}
                              {u.status !== "rejected" && (
                                <button
                                  onClick={() => updateUserStatus(u.id, "rejected")}
                                  className="flex items-center gap-1 rounded-lg bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive hover:bg-destructive/20"
                                >
                                  <XCircle className="size-3.5" /> Reject
                                </button>
                              )}
                              {u.status !== "suspended" && (
                                <button
                                  onClick={() => updateUserStatus(u.id, "suspended")}
                                  className="flex items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 hover:bg-amber-500/20"
                                >
                                  <Ban className="size-3.5" /> Suspend
                                </button>
                              )}
                              <button
                                onClick={() => deleteUser(u.id)}
                                className="rounded-lg p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                title="Delete user profile"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* TAB 2: Multi-Theme & Design Customizer */}
      {activeTab === "themes" && (
        <div className="mt-6 space-y-6 animate-rise">
          <Panel
            title="Multi-Theme & Color Engine"
            subtitle="Switch website theme presets dynamically with 1-click. Applies site-wide color variables automatically."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {THEME_PRESETS.map((t) => {
                const isSelected = activeTheme === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTheme(t.id)}
                    className={`group relative cursor-pointer rounded-2xl border p-4 transition-all duration-300 ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-lg glow-primary"
                        : "border-border/60 bg-card/40 hover:border-primary/50 hover:bg-card/70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-sm font-semibold text-foreground">{t.name}</h3>
                      {isSelected && <Badge tone="win">Active</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                    <div className={`mt-4 h-12 w-full rounded-xl bg-gradient-to-r ${t.previewGradient} p-2 flex items-center justify-between shadow-inner`}>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded-full">Preview</span>
                      <Sparkles className="size-4 text-white animate-pulse" />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      )}

      {/* TAB 3: Mass Mail & Occasion Broadcaster */}
      {activeTab === "broadcaster" && (
        <div className="mt-6 space-y-6 animate-rise">
          <Panel
            title="Mass Email Broadcaster & Occasion Mailer"
            subtitle="Send member announcements, festival greetings, birthday wishes, or market updates to your registered users."
          >
            <form onSubmit={handleSendBroadcast} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Target Recipients</label>
                  <select
                    className="w-full rounded-xl border border-border bg-card/60 px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                    value={mailTarget}
                    onChange={(e) => setMailTarget(e.target.value as any)}
                  >
                    <option value="approved">Approved Traders Only ({approvedCount})</option>
                    <option value="all">All Registered Accounts ({totalUsers})</option>
                    <option value="pending">Pending Access Queue ({pendingCount})</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Occasion / Type</label>
                  <select
                    className="w-full rounded-xl border border-border bg-card/60 px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                    value={mailOccasion}
                    onChange={(e) => setMailOccasion(e.target.value as any)}
                  >
                    <option value="announcement">📢 Member Announcement</option>
                    <option value="festival">🎉 Festival & Season Wish</option>
                    <option value="birthday">🎂 Birthday Greetings</option>
                    <option value="market_update">📈 Market Analysis Update</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Email Subject Line</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-xl border border-border bg-card/60 px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                  value={mailSubject}
                  onChange={(e) => setMailSubject(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Email Heading Title</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-xl border border-border bg-card/60 px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                  value={mailTitle}
                  onChange={(e) => setMailTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Message Body</label>
                <textarea
                  rows={4}
                  required
                  className="w-full rounded-xl border border-border bg-card/60 p-3 text-xs outline-none focus:ring-2 focus:ring-ring"
                  value={mailText}
                  onChange={(e) => setMailText(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={isSendingMail}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-3 text-xs font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] glow-primary disabled:opacity-50"
              >
                <Send className="size-4" />
                {isSendingMail ? "Broadcasting Mail…" : "Send Broadcast Email"}
              </button>
            </form>
          </Panel>
        </div>
      )}

      {/* TAB 4: Advanced Analytics & Ratios Engine */}
      {activeTab === "analytics" && (
        <div className="mt-6 space-y-6 animate-rise">
          <Panel
            title="Advanced Analytical Ratios & Trading Engine"
            subtitle="Executive metrics breakdown for trading performance, expectancy, and risk control."
          >
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
                <p className="text-xs text-muted-foreground">Profit Factor</p>
                <p className="mt-1 font-display text-xl font-bold text-foreground">2.45</p>
                <p className="mt-1 text-[10px] text-emerald-400">High Efficiency</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
                <p className="text-xs text-muted-foreground">Expectancy per Trade</p>
                <p className="mt-1 font-display text-xl font-bold text-foreground">+₹3,420</p>
                <p className="mt-1 text-[10px] text-emerald-400">Positive Edge</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
                <p className="text-xs text-muted-foreground">Max Drawdown</p>
                <p className="mt-1 font-display text-xl font-bold text-destructive">-4.2%</p>
                <p className="mt-1 text-[10px] text-muted-foreground">Within Safe Limits</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
                <p className="text-xs text-muted-foreground">Win / Loss Ratio</p>
                <p className="mt-1 font-display text-xl font-bold text-foreground">68% / 32%</p>
                <p className="mt-1 text-[10px] text-emerald-400">Consistent Win Rate</p>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* TAB 5: Site Banners & Controls */}
      {activeTab === "settings" && (
        <div className="mt-6 space-y-6 animate-rise">
          <Panel
            title="Global Website Controls"
            subtitle="Configure announcement banners, maintenance modes, and feature modules."
          >
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Announcement Banner Text</label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-border bg-card/60 px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                  value={banner}
                  onChange={(e) => setBanner(e.target.value)}
                />
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between rounded-xl border border-border/60 bg-card/40 p-3 cursor-pointer">
                  <span className="text-xs font-medium">Show Announcement Banner</span>
                  <input
                    type="checkbox"
                    checked={bannerActive}
                    onChange={(e) => setBannerActive(e.target.checked)}
                    className="size-4 accent-primary"
                  />
                </label>

                <label className="flex items-center justify-between rounded-xl border border-border/60 bg-card/40 p-3 cursor-pointer">
                  <span className="text-xs font-medium">Enable AI Coach Module</span>
                  <input
                    type="checkbox"
                    checked={aiEnabled}
                    onChange={(e) => setAiEnabled(e.target.checked)}
                    className="size-4 accent-primary"
                  />
                </label>

                <label className="flex items-center justify-between rounded-xl border border-border/60 bg-card/40 p-3 cursor-pointer">
                  <span className="text-xs font-medium">Enable MT5 Integration Sync</span>
                  <input
                    type="checkbox"
                    checked={mt5Enabled}
                    onChange={(e) => setMt5Enabled(e.target.checked)}
                    className="size-4 accent-primary"
                  />
                </label>

                <label className="flex items-center justify-between rounded-xl border border-destructive/40 bg-destructive/10 p-3 cursor-pointer">
                  <span className="text-xs font-semibold text-destructive">Enable Maintenance Mode</span>
                  <input
                    type="checkbox"
                    checked={maintenance}
                    onChange={(e) => setMaintenance(e.target.checked)}
                    className="size-4 accent-destructive"
                  />
                </label>
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-3 text-xs font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] glow-primary disabled:opacity-50"
              >
                <Save className="size-4" />
                {isSavingSettings ? "Saving Settings…" : "Save Controls"}
              </button>
            </div>
          </Panel>
        </div>
      )}
    </AppShell>
  );
}
