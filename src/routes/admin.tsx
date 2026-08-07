import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { Badge, Panel, StatCard } from "@/components/app/ui-kit";
import { useAuth } from "@/lib/auth-context";
import { supabase, type Profile } from "@/lib/supabase";
import { sendStatusNotificationEmail } from "@/lib/email-service";
import {
  CheckCircle2, Clock, Megaphone,
  Save, ShieldCheck, ShieldAlert, Users, XCircle, Zap, Activity, Trash2, Ban
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Owner Admin Dashboard — Trading Journal AI" },
      { name: "description", content: "Secure Owner Admin Portal: User approvals, access control, website settings, and analytics." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, isOwner, isLoading } = useAuth();
  const navigate = useNavigate();
  const [usersList, setUsersList] = useState<Profile[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "suspended">("all");
  const [isFetchingUsers, setIsFetchingUsers] = useState(true);
  const [totalDbTrades, setTotalDbTrades] = useState(0);

  // Site Controls State
  const [banner, setBanner] = useState("Welcome to TraderNakul — Professional AI Trading Journal");
  const [bannerActive, setBannerActive] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [mt5Enabled, setMt5Enabled] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchSettings();
  }, []);

  // Handle approve/reject query params from email links
  useEffect(() => {
    const isStrictAdmin = user?.email?.toLowerCase().trim() === "nakultrader007@gmail.com";
    if (isLoading || !isStrictAdmin) return;
    const params = new URLSearchParams(window.location.search);
    const approveEmail = params.get("approve");
    const rejectEmail = params.get("reject");
    const fromEmail = params.get("fromEmail");

    if (fromEmail !== "1") return;

    const applyEmailAction = async (targetEmail: string, action: "approved" | "rejected") => {
      const { data: profiles } = await supabase.from("profiles").select("*");
      const target = (profiles || []).find(
        (p: Profile) => p.email.toLowerCase() === targetEmail.toLowerCase()
      );
      if (!target) {
        toast.error(`User not found: ${targetEmail}`);
        return;
      }
      await updateUserStatus(target.id, action);
      // Clean URL
      window.history.replaceState({}, document.title, "/admin");
    };

    if (approveEmail) {
      applyEmailAction(decodeURIComponent(approveEmail), "approved");
    } else if (rejectEmail) {
      applyEmailAction(decodeURIComponent(rejectEmail), "rejected");
    }
  }, [isLoading, user, usersList]);

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

      // Fetch live trades count directly from database
      const { count, error: countError } = await supabase
        .from("trades")
        .select("*", { count: "exact", head: true });

      if (!countError && count !== null) {
        setTotalDbTrades(count);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("Network error fetching user details.");
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
      toast.error("CRITICAL SECURITY: Owner profile cannot be modified.");
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

      // Send status notification email to the user
      if (targetUser && (newStatus === "approved" || newStatus === "rejected")) {
        const userName = targetUser.full_name || targetUser.email.split("@")[0] || "Trader";
        sendStatusNotificationEmail({
          email: targetUser.email,
          name: userName,
          status: newStatus,
        }).then((res) => {
          if (res.success) {
            toast.success(`Status notification email sent to ${targetUser.email}`);
          } else {
            console.warn("Failed to send status notification email:", res.error);
          }
        }).catch((err) => {
          console.warn("Error sending status notification email:", err);
        });
      }
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
      <AppShell title="Admin Dashboard">
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Loading admin dashboard…</p>
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell title="Login Required">
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <ShieldAlert className="size-16 text-accent" />
          <h1 className="mt-4 font-display text-2xl font-bold">Login Required</h1>
          <p className="mt-2 text-sm text-muted-foreground">Please login with your Owner email to access the Admin Dashboard.</p>
          <a href="/login" className="mt-4 rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 glow-primary">
            Go to Login
          </a>
        </div>
      </AppShell>
    );
  }

  const isStrictAdmin = user.email?.toLowerCase().trim() === "nakultrader007@gmail.com";
  if (!isStrictAdmin) {
    return (
      <AppShell title="Access Denied">
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <ShieldAlert className="size-16 text-destructive" />
          <h1 className="mt-4 font-display text-2xl font-bold">403 Forbidden</h1>
          <p className="mt-2 text-sm text-muted-foreground">Only the administrator nakultrader007@gmail.com can access this portal.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Owner Admin Dashboard" subtitle="User approvals, access control & website settings">
      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total Users" value={String(totalUsers)} icon={<Users className="size-4" />} />
        <StatCard label="Pending Approval" value={String(pendingCount)} icon={<Clock className="size-4" />} accent="accent" />
        <StatCard label="Approved Traders" value={String(approvedCount)} icon={<CheckCircle2 className="size-4" />} accent="success" />
        <StatCard label="Total Logged Trades" value={String(totalDbTrades)} icon={<Activity className="size-4" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* User Management Table */}
        <Panel
          title="User Approval Management"
          className="lg:col-span-2"
          action={
            <div className="flex rounded-xl border border-border p-1 overflow-x-auto max-w-[280px] sm:max-w-none">
              {(["all", "pending", "approved", "rejected", "suspended"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-lg px-2 py-1 text-[11px] capitalize transition ${
                    filter === f ? "bg-primary/20 text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          }
        >
          {isFetchingUsers ? (
            <p className="py-8 text-center text-xs text-muted-foreground">Loading users list…</p>
          ) : filteredUsers.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">No users matching filter "{filter}".</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Signed Up</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-t border-border/60 transition hover:bg-muted/30">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 text-xs font-bold text-primary">
                            {u.full_name?.slice(0, 2).toUpperCase() || "TN"}
                          </div>
                          <div>
                            <p className="font-medium">{u.full_name || "Trader"}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        {u.is_owner ? (
                          <Badge tone="primary" className="glow-primary">Owner</Badge>
                        ) : u.role === "admin" ? (
                          <Badge tone="accent">Admin</Badge>
                        ) : (
                          <Badge tone="muted">User</Badge>
                        )}
                      </td>
                      <td className="py-3">
                        <Badge tone={u.status === "approved" || u.is_owner ? "win" : u.status === "pending" ? "primary" : u.status === "suspended" ? "loss" : "muted"}>
                          {u.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right">
                        {u.is_owner ? (
                          <span className="text-[11px] text-muted-foreground italic">Protected</span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {u.status !== "approved" && (
                              <button
                                onClick={() => updateUserStatus(u.id, "approved")}
                                title="Approve user access"
                                className="flex items-center gap-1 rounded-lg bg-[oklch(0.72_0.19_155)]/20 px-2.5 py-1 text-xs font-semibold text-[oklch(0.8_0.17_155)] hover:bg-[oklch(0.72_0.19_155)]/30"
                              >
                                <CheckCircle2 className="size-3" /> Approve
                              </button>
                            )}
                            {u.status !== "suspended" && u.status !== "rejected" && (
                              <button
                                onClick={() => updateUserStatus(u.id, "suspended")}
                                title="Suspend user access"
                                className="flex items-center gap-1 rounded-lg bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/30"
                              >
                                <Ban className="size-3" /> Suspend
                              </button>
                            )}
                            {u.status !== "rejected" && u.status !== "approved" && (
                              <button
                                onClick={() => updateUserStatus(u.id, "rejected")}
                                title="Reject user access"
                                className="flex items-center gap-1 rounded-lg bg-destructive/20 px-2 py-1 text-xs font-semibold text-destructive hover:bg-destructive/30"
                              >
                                <XCircle className="size-3" /> Reject
                              </button>
                            )}
                            <button
                              onClick={() => deleteUser(u.id)}
                              title="Permanently Delete User"
                              className="flex items-center gap-1 rounded-lg bg-destructive/10 p-1 text-xs font-semibold text-destructive hover:bg-destructive/25"
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

        {/* Website Control Panel */}
        <Panel title="Platform Control Panel">
          <div className="space-y-4">
            <div>
              <label className="flex items-center justify-between text-xs font-medium">
                <span>Announcement Banner</span>
                <input
                  type="checkbox"
                  checked={bannerActive}
                  onChange={(e) => setBannerActive(e.target.checked)}
                  className="accent-primary"
                />
              </label>
              <input
                type="text"
                value={banner}
                onChange={(e) => setBanner(e.target.value)}
                placeholder="Site wide banner message..."
                className="mt-1.5 w-full rounded-xl border border-border bg-card/60 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex items-center justify-between border-t border-border/60 pt-3">
              <div>
                <p className="text-xs font-medium">Maintenance Mode</p>
                <p className="text-[11px] text-muted-foreground">Temporarily lock site for updates</p>
              </div>
              <input
                type="checkbox"
                checked={maintenance}
                onChange={(e) => setMaintenance(e.target.checked)}
                className="accent-destructive size-4"
              />
            </div>

            <div className="flex items-center justify-between border-t border-border/60 pt-3">
              <div>
                <p className="text-xs font-medium">AI Coach Feature</p>
                <p className="text-[11px] text-muted-foreground">Enable AI trading coach</p>
              </div>
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
                className="accent-primary size-4"
              />
            </div>

            <div className="flex items-center justify-between border-t border-border/60 pt-3">
              <div>
                <p className="text-xs font-medium">MT5 Auto Sync</p>
                <p className="text-[11px] text-muted-foreground">MetaTrader 5 API integration</p>
              </div>
              <input
                type="checkbox"
                checked={mt5Enabled}
                onChange={(e) => setMt5Enabled(e.target.checked)}
                className="accent-primary size-4"
              />
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent py-2.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] glow-primary"
            >
              <Save className="size-3.5" />
              {isSavingSettings ? "Saving…" : "Save Control Settings"}
            </button>
          </div>
        </Panel>

        {/* Future Architecture Readiness Panel */}
        <Panel title="System & Feature Readiness" className="lg:col-span-3">
          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            <div className="rounded-xl border border-border/60 bg-card/40 p-4">
              <div className="flex items-center gap-2 font-semibold text-primary">
                <Zap className="size-4" /> MT5 Integration Endpoint
              </div>
              <p className="mt-1 text-muted-foreground">Ready for Phase 5 Webhook Connector. Payload listeners ready.</p>
              <Badge tone="win" className="mt-3">Phase 5 Ready</Badge>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/40 p-4">
              <div className="flex items-center gap-2 font-semibold text-accent">
                <ShieldCheck className="size-4" /> Trade Journal RLS
              </div>
              <p className="mt-1 text-muted-foreground">PostgreSQL schema ready for isolated multi-tenant trade tables.</p>
              <Badge tone="primary" className="mt-3">Phase 4 Ready</Badge>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/40 p-4">
              <div className="flex items-center gap-2 font-semibold text-[oklch(0.72_0.19_155)]">
                <Megaphone className="size-4" /> Live AI Assistant Engine
              </div>
              <p className="mt-1 text-muted-foreground">Gemini API context prompt builder pipeline structured.</p>
              <Badge tone="win" className="mt-3">Phase 5 Ready</Badge>
            </div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
