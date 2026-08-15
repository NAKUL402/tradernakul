import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { Badge, Panel, StatCard } from "@/components/app/ui-kit";
import { useAuth } from "@/lib/auth-context";
import { supabase, type Profile, type SiteSettings } from "@/lib/supabase";
import { sendStatusNotificationEmail } from "@/lib/email-service";
import {
  CheckCircle2,
  Clock,
  Megaphone,
  Save,
  ShieldCheck,
  ShieldAlert,
  Users,
  XCircle,
  Zap,
  Activity,
  Trash2,
  Ban,
  Wrench,
  Send,
  Plus,
  Edit3,
  SlidersHorizontal,
  RefreshCw,
  Play,
  Key,
  Brain,
  Lock,
  Unlock,
  Mail,
  FileText,
  LayoutDashboard,
  Sliders,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Owner Admin Control Center — Edge Journal" },
      {
        name: "description",
        content:
          "Secure Owner Admin Portal: User approvals, access control, website settings, and analytics.",
      },
    ],
  }),
  component: AdminPage,
});

type TabId =
  | "overview"
  | "users"
  | "approvals"
  | "platform"
  | "features"
  | "deadlines"
  | "health"
  | "security"
  | "announcements"
  | "email"
  | "emergency";

type Deadline = {
  id: string;
  feature_name: string;
  start_date: string;
  deadline: string;
  status: "active" | "scheduled" | "disabled" | "maintenance" | "completed";
  created_at: string;
};

type AuditLog = {
  id: string;
  admin_email: string;
  action: string;
  target_type: string;
  target_id: string;
  previous_state: string;
  new_state: string;
  timestamp: string;
  result: string;
};

type Announcement = {
  id: string;
  title: string;
  message: string;
  audience: "all" | "approved" | "pending";
  status: "draft" | "published" | "archived";
  created_at: string;
  published_at: string | null;
};

function AdminPage() {
  const {
    user,
    isAdmin,
    isOwner,
    isLoading: isAuthLoading,
    siteSettings,
    refreshSettings,
  } = useAuth();
  const navigate = useNavigate();

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Core Data State
  const [usersList, setUsersList] = useState<Profile[]>([]);
  const [isFetchingUsers, setIsFetchingUsers] = useState(true);
  const [totalDbTrades, setTotalDbTrades] = useState(0);
  const [stats, setStats] = useState<{
    total_users: number;
    pending_users: number;
    approved_users: number;
    suspended_users: number;
    rejected_users: number;
    total_trades: number;
    total_ai_chats: number;
    total_mt5_keys: number;
  } | null>(null);

  // Platform State (local copies for editing)
  const [banner, setBanner] = useState("");
  const [bannerActive, setBannerActive] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [mt5Enabled, setMt5Enabled] = useState(true);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [loginEnabled, setLoginEnabled] = useState(true);
  const [journalEnabled, setJournalEnabled] = useState(true);
  const [marketDataEnabled, setMarketDataEnabled] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Deadlines State
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [isFetchingDeadlines, setIsFetchingDeadlines] = useState(false);
  const [newDeadlineFeature, setNewDeadlineFeature] = useState("AI Coach");
  const [newDeadlineStart, setNewDeadlineStart] = useState("");
  const [newDeadlineEnd, setNewDeadlineEnd] = useState("");
  const [newDeadlineStatus, setNewDeadlineStatus] = useState<Deadline["status"]>("scheduled");
  const [isSavingDeadline, setIsSavingDeadline] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isFetchingLogs, setIsFetchingLogs] = useState(false);

  // Announcements State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isFetchingAnnouncements, setIsFetchingAnnouncements] = useState(false);
  const [newAnnTitle, setNewAnnTitle] = useState("");
  const [newAnnMessage, setNewAnnMessage] = useState("");
  const [newAnnAudience, setNewAnnAudience] = useState<Announcement["audience"]>("all");
  const [newAnnStatus, setNewAnnStatus] = useState<Announcement["status"]>("published");
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);

  // User Detail Panel State
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  // Users Filter State
  const [userFilter, setUserFilter] = useState<
    "all" | "pending" | "approved" | "rejected" | "suspended"
  >("all");
  const [userSearch, setUserSearch] = useState("");

  // Health Center Diagnostic State
  const [healthStatus, setHealthStatus] = useState<{
    auth: "checking" | "ok" | "error";
    db: "checking" | "ok" | "error";
    api: "checking" | "ok" | "error";
    ai: "checking" | "ok" | "error";
    email: "checking" | "ok" | "error";
    lastChecked: string | null;
    rawHealthData: any;
  }>({
    auth: "checking",
    db: "checking",
    api: "checking",
    ai: "checking",
    email: "checking",
    lastChecked: null,
    rawHealthData: null,
  });

  // Emergency Input Validations
  const [emergencyConfirmReg, setEmergencyConfirmReg] = useState("");
  const [emergencyConfirmLogin, setEmergencyConfirmLogin] = useState("");
  const [emergencyConfirmMaint, setEmergencyConfirmMaint] = useState("");

  // Email Center State
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [testEmailName, setTestEmailName] = useState("Trader");
  const [testEmailStatus, setTestEmailStatus] = useState<"approved" | "rejected">("approved");
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);

  // Load baseline data on mount
  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchSettingsLocal();
      fetchStats();
      fetchDeadlines();
      fetchAuditLogs();
      fetchAnnouncements();
      runHealthDiagnostic();
    }
  }, [isAdmin]);

  // Sync settings state when siteSettings loads
  const fetchSettingsLocal = async () => {
    if (siteSettings) {
      setBanner(siteSettings.announcement_banner || "");
      setBannerActive(siteSettings.banner_active || false);
      setMaintenance(siteSettings.maintenance_mode || false);
      setAiEnabled(siteSettings.ai_coach_enabled ?? true);
      setMt5Enabled(siteSettings.mt5_sync_enabled ?? true);
      setRegistrationEnabled(siteSettings.registration_enabled ?? true);
      setLoginEnabled(siteSettings.login_enabled ?? true);
      setJournalEnabled(siteSettings.journal_enabled ?? true);
      setMarketDataEnabled(siteSettings.market_data_enabled ?? true);
    }
  };

  const logAdminAction = async (
    action: string,
    targetType: string,
    targetId: string | null,
    prev: any,
    current: any,
  ) => {
    try {
      const { error } = await supabase.from("audit_logs").insert({
        admin_id: user?.id,
        admin_email: user?.email || "unknown_admin",
        action,
        target_type: targetType,
        target_id: targetId,
        previous_state: prev ? JSON.stringify(prev) : null,
        new_state: current ? JSON.stringify(current) : null,
        result: "success",
      });
      if (error) console.error("Failed to write audit log:", error);
      fetchAuditLogs();
    } catch (e) {
      console.error("Exception writing audit log:", e);
    }
  };

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

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc("get_admin_stats");
      if (error) {
        console.warn("RPC stats failed, fallback calculation:", error);
      } else if (data) {
        setStats(data);
      }
    } catch (err) {
      console.error("Exception fetching stats:", err);
    }
  };

  const fetchDeadlines = async () => {
    setIsFetchingDeadlines(true);
    try {
      const { data, error } = await supabase
        .from("feature_deadlines")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setDeadlines(data as Deadline[]);
      }
    } catch (err) {
      console.error("Failed to fetch deadlines:", err);
    } finally {
      setIsFetchingDeadlines(false);
    }
  };

  const fetchAuditLogs = async () => {
    setIsFetchingLogs(true);
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(50);

      if (!error && data) {
        setAuditLogs(data as AuditLog[]);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setIsFetchingLogs(false);
    }
  };

  const fetchAnnouncements = async () => {
    setIsFetchingAnnouncements(true);
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setAnnouncements(data as Announcement[]);
      }
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
    } finally {
      setIsFetchingAnnouncements(false);
    }
  };

  const runHealthDiagnostic = async () => {
    setHealthStatus((prev) => ({
      ...prev,
      auth: "checking",
      db: "checking",
      api: "checking",
      ai: "checking",
      email: "checking",
    }));

    let authCheck: "ok" | "error" = "error";
    let dbCheck: "ok" | "error" = "error";
    let apiCheck: "ok" | "error" = "error";
    let aiCheck: "ok" | "error" = "error";
    let emailCheck: "ok" | "error" = "error";
    let rawHealth: any = null;

    // 1. Auth check
    try {
      const { data, error } = await supabase.auth.getSession();
      if (!error) authCheck = "ok";
    } catch (e) {
      console.error("Auth check exception:", e);
    }

    // 2. DB check
    try {
      const { data, error } = await supabase.from("profiles").select("id").limit(1);
      if (!error) dbCheck = "ok";
    } catch (e) {
      console.error("DB check exception:", e);
    }

    // 3. API & Env variables check
    try {
      const response = await fetch("/api/health");
      if (response.ok) {
        const payload = await response.json();
        rawHealth = payload;
        apiCheck = "ok";

        // SMTP/Resend state
        if (payload.activeEmailProvider && !payload.activeEmailProvider.includes("❌")) {
          emailCheck = "ok";
        }

        // AI Groq state
        if (payload.env && payload.env.GROQ_API_KEY && payload.env.GROQ_API_KEY.includes("✅")) {
          aiCheck = "ok";
        }
      }
    } catch (e) {
      console.error("API diagnostic exception:", e);
    }

    setHealthStatus({
      auth: authCheck,
      db: dbCheck,
      api: apiCheck,
      ai: aiCheck,
      email: emailCheck,
      lastChecked: new Date().toLocaleTimeString(),
      rawHealthData: rawHealth,
    });
  };

  const handleSavePlatformSettings = async () => {
    setIsSavingSettings(true);
    const prevState = { ...siteSettings };
    const nextState = {
      announcement_banner: banner,
      banner_active: bannerActive,
      maintenance_mode: maintenance,
      ai_coach_enabled: aiEnabled,
      mt5_sync_enabled: mt5Enabled,
      registration_enabled: registrationEnabled,
      login_enabled: loginEnabled,
      journal_enabled: journalEnabled,
      market_data_enabled: marketDataEnabled,
    };

    try {
      const { error } = await supabase
        .from("site_settings")
        .update({
          ...nextState,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

      if (error) {
        toast.error(`Error saving settings: ${error.message}`);
      } else {
        toast.success("Site control panel updated successfully!");
        await refreshSettings();
        await fetchStats();
        await logAdminAction(
          "update_platform_settings",
          "site_settings",
          "1",
          prevState,
          nextState,
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed";
      toast.error(msg);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleUpdateUserStatus = async (targetId: string, newStatus: Profile["status"]) => {
    const targetUser = usersList.find((u) => u.id === targetId);
    if (!targetUser) return;

    if (targetUser.is_owner || targetUser.email === "nakulrathi641@gmail.com") {
      toast.error("CRITICAL SECURITY: Owner profile cannot be modified.");
      return;
    }

    setIsUpdatingUser(true);
    const prevState = { status: targetUser.status };
    const nextState = { status: newStatus };

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", targetId)
        .select();

      if (error) {
        toast.error(`Failed to update status in DB: ${error.message}`);
        return;
      }
      if (!data || data.length === 0) {
        toast.error(
          `Update failed: Database permission denied (RLS block) for user ${targetUser.email}`,
        );
        return;
      }

      setUsersList((prev) =>
        prev.map((u) => (u.id === targetId ? { ...u, status: newStatus } : u)),
      );

      // Sync active detail view if open
      if (selectedUser?.id === targetId) {
        setSelectedUser((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      toast.success(`User access set to ${newStatus.toUpperCase()}`);
      await fetchStats();
      await logAdminAction(
        `change_user_status_${newStatus}`,
        "profiles",
        targetId,
        prevState,
        nextState,
      );

      // Send status notification email to the user
      if (newStatus === "approved" || newStatus === "rejected") {
        const userName = targetUser.full_name || targetUser.email.split("@")[0] || "Trader";
        sendStatusNotificationEmail({
          email: targetUser.email,
          name: userName,
          status: newStatus,
        })
          .then((res) => {
            if (res.success) {
              toast.success(`Access notification email sent to ${targetUser.email}`);
            } else {
              console.warn("Failed to send status notification email:", res.error);
            }
          })
          .catch((err) => {
            console.warn("Error sending status notification email:", err);
          });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      toast.error(`Error updating status: ${msg}`);
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleSaveDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeadlineFeature || !newDeadlineStart) {
      toast.error("Feature Name and Start Date are required.");
      return;
    }

    setIsSavingDeadline(true);
    const payload = {
      feature_name: newDeadlineFeature,
      start_date: new Date(newDeadlineStart).toISOString(),
      deadline: newDeadlineEnd ? new Date(newDeadlineEnd).toISOString() : null,
      status: newDeadlineStatus,
      changed_by: user?.id,
    };

    try {
      const { error } = await supabase.from("feature_deadlines").insert(payload);

      if (error) {
        toast.error(`Error saving deadline: ${error.message}`);
      } else {
        toast.success("Feature deadline scheduled successfully!");
        setNewDeadlineStart("");
        setNewDeadlineEnd("");
        await fetchDeadlines();
        await logAdminAction("create_feature_deadline", "feature_deadlines", null, null, payload);
      }
    } catch (err: any) {
      toast.error(err.message || "Save deadline exception");
    } finally {
      setIsSavingDeadline(false);
    }
  };

  const handleDeleteDeadline = async (id: string) => {
    if (!confirm("Are you sure you want to delete this deadline?")) return;

    try {
      const { error } = await supabase.from("feature_deadlines").delete().eq("id", id);

      if (error) {
        toast.error(`Failed to delete deadline: ${error.message}`);
      } else {
        toast.success("Deadline removed.");
        await fetchDeadlines();
        await logAdminAction("delete_feature_deadline", "feature_deadlines", id, null, null);
      }
    } catch (err: any) {
      toast.error(err.message || "Exception deleting deadline");
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle || !newAnnMessage) {
      toast.error("Title and Message are required.");
      return;
    }

    setIsSavingAnnouncement(true);
    const payload = {
      title: newAnnTitle,
      message: newAnnMessage,
      audience: newAnnAudience,
      status: newAnnStatus,
      created_by: user?.id,
      published_at: newAnnStatus === "published" ? new Date().toISOString() : null,
    };

    try {
      const { error } = await supabase.from("announcements").insert(payload);

      if (error) {
        toast.error(`Error publishing announcement: ${error.message}`);
      } else {
        toast.success("Announcement saved successfully!");
        setNewAnnTitle("");
        setNewAnnMessage("");
        await fetchAnnouncements();
        await logAdminAction("create_announcement", "announcements", null, null, payload);

        // Auto update the site banner settings to this announcement if it was published site-wide
        if (newAnnStatus === "published" && newAnnAudience === "all") {
          setBanner(newAnnTitle + ": " + newAnnMessage);
          setBannerActive(true);
          supabase
            .from("site_settings")
            .update({
              announcement_banner: newAnnTitle + ": " + newAnnMessage,
              banner_active: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", 1)
            .then(() => refreshSettings());
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Exception creating announcement");
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    try {
      const { error } = await supabase.from("announcements").delete().eq("id", id);

      if (error) {
        toast.error(`Failed to delete: ${error.message}`);
      } else {
        toast.success("Announcement deleted.");
        await fetchAnnouncements();
        await logAdminAction("delete_announcement", "announcements", id, null, null);
      }
    } catch (err: any) {
      toast.error(err.message || "Exception deleting announcement");
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailAddress) {
      toast.error("Please enter a destination email address.");
      return;
    }

    setIsSendingTestEmail(true);
    try {
      const res = await sendStatusNotificationEmail({
        email: testEmailAddress,
        name: testEmailName,
        status: testEmailStatus,
      });

      if (res.success) {
        toast.success(`Diagnostic test email dispatched successfully to ${testEmailAddress}`);
        await logAdminAction("send_diagnostic_test_email", "email_system", null, null, {
          to: testEmailAddress,
          name: testEmailName,
          status: testEmailStatus,
        });
      } else {
        toast.error(`Email dispatch failed: ${res.error}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Network exception sending test email");
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleDeleteUser = async (targetId: string) => {
    const targetUser = usersList.find((u) => u.id === targetId);
    if (!targetUser) return;

    if (targetUser.is_owner || targetUser.email === "nakulrathi641@gmail.com") {
      toast.error("CRITICAL SECURITY: Owner profile cannot be demoted or deleted.");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to permanently delete user ${targetUser.email}?\nThis action is irreversible and preserves no history.`,
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase.from("profiles").delete().eq("id", targetId);

      if (error) {
        toast.error(`Failed to delete user: ${error.message}`);
        return;
      }

      setUsersList((prev) => prev.filter((u) => u.id !== targetId));
      setSelectedUser(null);
      toast.success("User profile successfully deleted from system database.");
      await fetchStats();
      await logAdminAction("delete_user_permanently", "profiles", targetId, targetUser, null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      toast.error(`Error deleting user: ${msg}`);
    }
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchesSearch =
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.full_name || "").toLowerCase().includes(userSearch.toLowerCase());
      const matchesFilter = userFilter === "all" ? true : u.status === userFilter;
      return matchesSearch && matchesFilter;
    });
  }, [usersList, userSearch, userFilter]);

  // Sidebar navigation panel helper
  const sidebarItems: Array<{
    id: TabId;
    label: string;
    icon: any;
    badge?: number | string | undefined;
    badgeColor?: string | undefined;
  }> = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "users", label: "Trader Registry", icon: Users, badge: usersList.length },
    {
      id: "approvals",
      label: "Pending Approvals",
      icon: Clock,
      badge: usersList.filter((u) => u.status === "pending").length,
      badgeColor: "bg-accent/20 text-accent border-accent/30",
    },
    { id: "platform", label: "Platform Controls", icon: Sliders },
    { id: "features", label: "Feature Flags", icon: Zap },
    { id: "deadlines", label: "System Deadlines", icon: Wrench },
    { id: "health", label: "System Health Center", icon: Activity },
    { id: "security", label: "Security & Audit Logs", icon: FileText },
    { id: "announcements", label: "Announcement Center", icon: Megaphone },
    { id: "email", label: "Email Diagnostic Center", icon: Mail },
    {
      id: "emergency",
      label: "Emergency Center",
      icon: ShieldAlert,
      badge: siteSettings?.maintenance_mode ? "ON" : undefined,
      badgeColor: "bg-red-500/20 text-red-300 border-red-500/30 border animate-pulse",
    },
  ];

  if (isAuthLoading) {
    return (
      <AppShell title="Admin Control Center">
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground font-semibold">
            Validating session permissions…
          </p>
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell title="Login Required" subtitle="Authentication mandatory">
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="rounded-full bg-accent/15 p-5 text-accent animate-pulse">
            <Lock className="size-16" />
          </div>
          <h1 className="mt-6 font-display text-2xl font-bold">Admin Portal Secured</h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Please log in using the owner credentials to access these controls.
          </p>
          <a
            href="/login"
            className="mt-6 rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 glow-primary active:scale-95"
          >
            Log In normally
          </a>
        </div>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell title="Access Denied" subtitle="Unauthorized access attempt logged">
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="rounded-full bg-destructive/15 p-5 text-destructive">
            <ShieldAlert className="size-16" />
          </div>
          <h1 className="mt-6 font-display text-2xl font-bold text-foreground">
            403 Forbidden Access
          </h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Only authorized administrators are permitted to view the Control Center.
          </p>
          <button
            onClick={() => navigate({ to: "/" })}
            className="mt-6 rounded-xl border border-border bg-card/60 px-5 py-2.5 text-sm font-medium hover:bg-card transition"
          >
            Back to Dashboard
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Admin Control Center"
      subtitle={`Logged in as ${isOwner ? "Owner Administrator" : "Administrator"}`}
    >
      {/* Sleek Layout */}
      <div className="mt-4 flex flex-col gap-6 lg:flex-row">
        {/* Left Hand tab selector */}
        <aside className="w-full shrink-0 lg:w-64">
          <div className="neon-card neon-glow-purple flex flex-col gap-1.5 p-3.5 sticky top-20 border border-border/70 backdrop-blur-xl">
            <div className="flex items-center justify-between px-2 pb-2 border-b border-border/40 mb-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                System Navigation
              </p>
              <ShieldCheck className="size-3.5 text-primary" />
            </div>
            <nav className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1 pb-2 lg:pb-0 scrollbar-none">
              {sidebarItems.map((item) => {
                const IconComponent = item.icon;
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-3 w-full rounded-xl px-3.5 py-2.5 text-left text-xs font-bold transition-all border whitespace-nowrap lg:whitespace-normal cursor-pointer ${
                      isSelected
                        ? "bg-primary/15 text-primary border-primary/40 shadow-sm shadow-primary/20"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                  >
                    <IconComponent
                      className={`size-4 shrink-0 ${isSelected ? "text-primary scale-105" : "text-muted-foreground"}`}
                    />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge !== undefined && Number(item.badge) > 0 && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${item.badgeColor || "bg-muted text-foreground border-border"}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Right Hand component content */}
        <main className="flex-1 overflow-hidden min-h-[60vh] flex flex-col">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-250">
              {/* StatCards */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard
                  label="Total Registered Users"
                  value={stats ? String(stats.total_users) : String(usersList.length)}
                  icon={<Users className="size-4" />}
                />
                <StatCard
                  label="Awaiting Approval"
                  value={
                    stats
                      ? String(stats.pending_users)
                      : String(usersList.filter((u) => u.status === "pending").length)
                  }
                  icon={<Clock className="size-4" />}
                  accent="accent"
                />
                <StatCard
                  label="Total Logged Trades"
                  value={stats ? String(stats.total_trades) : String(totalDbTrades)}
                  icon={<Activity className="size-4" />}
                  accent="success"
                />
                <StatCard
                  label="AI Chat Queries"
                  value={stats ? String(stats.total_ai_chats) : "Data unavailable"}
                  icon={<Brain className="size-4" />}
                />
              </div>

              {siteSettings?.maintenance_mode && (
                <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-5 text-red-200 flex gap-4 items-start relative overflow-hidden">
                  <div className="pointer-events-none absolute -left-20 -top-20 size-60 rounded-full bg-red-500/10 blur-3xl" />
                  <AlertTriangle className="size-8 shrink-0 text-red-400 animate-pulse mt-0.5" />
                  <div>
                    <h3 className="font-display font-bold text-red-300">
                      EMERGENCY LOCKDOWN ACTIVE: MAINTENANCE MODE ON
                    </h3>
                    <p className="mt-1 text-xs text-red-300/80 leading-relaxed">
                      All normal users are blocked from access. Only owner accounts and
                      administrators retain database bypass permissions. Remember to toggle
                      Maintenance Mode off from the Platform Control panel or Emergency Center when
                      service is restored.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-2">
                <Panel title="Platform Health Quick View">
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                      <span className="text-xs text-muted-foreground">
                        Database Sync Integration
                      </span>
                      <Badge tone={healthStatus.db === "ok" ? "win" : "loss"}>
                        {healthStatus.db === "ok" ? "ONLINE" : "OFFLINE"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                      <span className="text-xs text-muted-foreground">
                        Vercel Edge Functions API
                      </span>
                      <Badge tone={healthStatus.api === "ok" ? "win" : "loss"}>
                        {healthStatus.api === "ok" ? "ONLINE" : "OFFLINE"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                      <span className="text-xs text-muted-foreground">
                        AI Inference Pipeline (Groq)
                      </span>
                      <Badge tone={healthStatus.ai === "ok" ? "win" : "loss"}>
                        {healthStatus.ai === "ok" ? "READY" : "UNCONFIGURED"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-xs text-muted-foreground">
                        SMTP/Resend Mail Dispatcher
                      </span>
                      <Badge tone={healthStatus.email === "ok" ? "win" : "loss"}>
                        {healthStatus.email === "ok" ? "CONFIGURED" : "OFFLINE"}
                      </Badge>
                    </div>
                    <button
                      onClick={() => {
                        runHealthDiagnostic();
                        toast.info("Diagnostic health check triggered.");
                      }}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card/60 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-card transition"
                    >
                      <RefreshCw className="size-3.5" /> Re-Scan Systems
                    </button>
                  </div>
                </Panel>

                <Panel title="Platform Access Controls Summary">
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Signups Allowed:</span>
                      <span
                        className={
                          registrationEnabled
                            ? "text-emerald-400 font-bold"
                            : "text-red-400 font-bold"
                        }
                      >
                        {registrationEnabled ? "YES" : "NO"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Logins Allowed:</span>
                      <span
                        className={
                          loginEnabled ? "text-emerald-400 font-bold" : "text-red-400 font-bold"
                        }
                      >
                        {loginEnabled ? "YES" : "NO"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">AI Coach Active:</span>
                      <span
                        className={
                          aiEnabled ? "text-emerald-400 font-bold" : "text-red-400 font-bold"
                        }
                      >
                        {aiEnabled ? "YES" : "NO"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">MetaTrader 5 Sync:</span>
                      <span
                        className={
                          mt5Enabled ? "text-emerald-400 font-bold" : "text-red-400 font-bold"
                        }
                      >
                        {mt5Enabled ? "YES" : "NO"}
                      </span>
                    </div>
                    <div className="mt-4 border-t border-border/40 pt-4 flex gap-2">
                      <button
                        onClick={() => setActiveTab("platform")}
                        className="flex-1 text-center py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 transition font-semibold"
                      >
                        Edit Controls
                      </button>
                      <button
                        onClick={() => setActiveTab("emergency")}
                        className="flex-1 text-center py-2 bg-red-500/10 text-red-300 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition font-semibold"
                      >
                        Emergency
                      </button>
                    </div>
                  </div>
                </Panel>
              </div>
            </div>
          )}

          {/* TAB 2: TRADER REGISTRY */}
          {activeTab === "users" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-250 flex-1 flex flex-col">
              <Panel
                title="Trader Registry"
                className="flex-1 flex flex-col"
                action={
                  <div className="flex rounded-xl border border-border p-1 overflow-x-auto max-w-[280px] sm:max-w-none">
                    {(["all", "pending", "approved", "rejected", "suspended"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setUserFilter(f)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] capitalize transition ${
                          userFilter === f
                            ? "bg-primary/20 text-primary font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                }
              >
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2">
                  <SlidersHorizontal className="size-4 text-muted-foreground" />
                  <input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by full name, email, or user ID…"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>

                {isFetchingUsers ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    Loading users list…
                  </p>
                ) : filteredUsers.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    No users matching search or filter.
                  </p>
                ) : (
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full min-w-[620px] text-sm">
                      <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border/40 pb-2">
                          <th className="pb-3 font-medium">User</th>
                          <th className="pb-3 font-medium">Role</th>
                          <th className="pb-3 font-medium">Status</th>
                          <th className="pb-3 font-medium">Registered</th>
                          <th className="pb-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u) => (
                          <tr
                            key={u.id}
                            className="border-t border-border/40 transition hover:bg-muted/30"
                          >
                            <td className="py-3">
                              <button
                                onClick={() => setSelectedUser(u)}
                                className="flex items-center gap-2.5 text-left group"
                              >
                                <div className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 text-xs font-bold text-primary transition group-hover:scale-105">
                                  {u.full_name?.slice(0, 2).toUpperCase() || "TR"}
                                </div>
                                <div>
                                  <p className="font-medium text-foreground group-hover:text-primary transition">
                                    {u.full_name || "Trader"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{u.email}</p>
                                </div>
                              </button>
                            </td>
                            <td className="py-3">
                              {u.is_owner ? (
                                <Badge tone="primary" className="glow-primary">
                                  Owner
                                </Badge>
                              ) : u.role === "admin" ? (
                                <Badge tone="accent">Admin</Badge>
                              ) : (
                                <Badge tone="muted">User</Badge>
                              )}
                            </td>
                            <td className="py-3">
                              <Badge
                                tone={
                                  u.status === "approved" || u.is_owner
                                    ? "win"
                                    : u.status === "pending"
                                      ? "primary"
                                      : u.status === "suspended"
                                        ? "loss"
                                        : "muted"
                                }
                              >
                                {u.status}
                              </Badge>
                            </td>
                            <td className="py-3 text-xs text-muted-foreground">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 text-right">
                              {u.is_owner || u.email === "nakulrathi641@gmail.com" ? (
                                <span className="text-[11px] text-muted-foreground italic">
                                  Protected
                                </span>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  {u.status !== "approved" && (
                                    <button
                                      onClick={() => handleUpdateUserStatus(u.id, "approved")}
                                      className="flex items-center gap-1 rounded-lg bg-success/20 px-2 py-1 text-xs font-semibold text-success hover:bg-success/30 transition"
                                    >
                                      Approve
                                    </button>
                                  )}
                                  {u.status === "approved" && (
                                    <button
                                      onClick={() => handleUpdateUserStatus(u.id, "suspended")}
                                      className="flex items-center gap-1 rounded-lg bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/30 transition"
                                    >
                                      Suspend
                                    </button>
                                  )}
                                  {u.status === "suspended" && (
                                    <button
                                      onClick={() => handleUpdateUserStatus(u.id, "approved")}
                                      className="flex items-center gap-1 rounded-lg bg-success/20 px-2 py-1 text-xs font-semibold text-success hover:bg-success/30 transition"
                                    >
                                      Unsuspend
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setSelectedUser(u)}
                                    className="flex items-center justify-center rounded-lg border border-border p-1 hover:border-primary/50 text-muted-foreground hover:text-foreground transition"
                                  >
                                    <Sliders className="size-3.5" />
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

              {/* Selected User Slide-over / Modal Detail View */}
              {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="w-full max-w-md h-full bg-card border-l border-border p-6 shadow-2xl overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-350 relative">
                    <div className="pointer-events-none absolute -left-20 top-0 size-80 rounded-full bg-primary/5 blur-3xl" />

                    <div>
                      <div className="flex items-center justify-between border-b border-border/40 pb-4">
                        <h2 className="font-display text-lg font-bold">User Details</h2>
                        <button
                          onClick={() => setSelectedUser(null)}
                          className="rounded-lg border border-border p-1 text-muted-foreground hover:text-foreground transition"
                        >
                          <XCircle className="size-5" />
                        </button>
                      </div>

                      <div className="mt-6 flex flex-col items-center text-center">
                        <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 text-2xl font-bold text-primary">
                          {selectedUser.full_name?.slice(0, 2).toUpperCase() || "TR"}
                        </div>
                        <h3 className="mt-4 font-display text-lg font-semibold">
                          {selectedUser.full_name || "Trader"}
                        </h3>
                        <p className="text-xs text-muted-foreground">{selectedUser.email}</p>

                        <div className="mt-3 flex gap-2">
                          <Badge
                            tone={
                              selectedUser.status === "approved" || selectedUser.is_owner
                                ? "win"
                                : selectedUser.status === "pending"
                                  ? "primary"
                                  : selectedUser.status === "suspended"
                                    ? "loss"
                                    : "muted"
                            }
                          >
                            {selectedUser.status}
                          </Badge>
                          {selectedUser.is_owner ? (
                            <Badge tone="primary">Owner</Badge>
                          ) : selectedUser.role === "admin" ? (
                            <Badge tone="accent">Admin</Badge>
                          ) : (
                            <Badge tone="muted">User</Badge>
                          )}
                        </div>
                      </div>

                      <div className="mt-8 space-y-4 text-xs">
                        <div className="flex justify-between border-b border-border/40 pb-2.5">
                          <span className="text-muted-foreground">User ID (Supabase):</span>
                          <span className="font-mono text-[10px] select-all">
                            {selectedUser.id}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-border/40 pb-2.5">
                          <span className="text-muted-foreground">Registration Timestamp:</span>
                          <span>{new Date(selectedUser.created_at).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pb-2.5">
                          <span className="text-muted-foreground">Last Profile Update:</span>
                          <span>{new Date(selectedUser.updated_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 border-t border-border/40 pt-4 space-y-3">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Administrative Actions
                      </p>

                      {selectedUser.is_owner || selectedUser.email === "nakulrathi641@gmail.com" ? (
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-[11px] text-primary leading-relaxed">
                          🛡️ This account is flagged as the site Owner. Demoting, suspending, or
                          deleting the primary owner from the UI is locked by core security
                          configurations.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {selectedUser.status !== "approved" && (
                            <button
                              onClick={() => handleUpdateUserStatus(selectedUser.id, "approved")}
                              disabled={isUpdatingUser}
                              className="w-full text-center py-2 bg-success/20 text-success border border-success/30 rounded-xl hover:bg-success/35 transition font-semibold text-xs"
                            >
                              Approve Access
                            </button>
                          )}
                          {selectedUser.status !== "suspended" && (
                            <button
                              onClick={() => handleUpdateUserStatus(selectedUser.id, "suspended")}
                              disabled={isUpdatingUser}
                              className="w-full text-center py-2 bg-red-500/10 text-red-300 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition font-semibold text-xs"
                            >
                              Suspend Access
                            </button>
                          )}
                          {selectedUser.status !== "rejected" &&
                            selectedUser.status !== "approved" && (
                              <button
                                onClick={() => handleUpdateUserStatus(selectedUser.id, "rejected")}
                                disabled={isUpdatingUser}
                                className="w-full text-center py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl hover:bg-destructive/20 transition font-semibold text-xs"
                              >
                                Reject User
                              </button>
                            )}
                          {selectedUser.status === "suspended" && (
                            <button
                              onClick={() => handleUpdateUserStatus(selectedUser.id, "approved")}
                              disabled={isUpdatingUser}
                              className="w-full text-center py-2 bg-success/20 text-success border border-success/30 rounded-xl hover:bg-success/35 transition font-semibold text-xs"
                            >
                              Unsuspend Access
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(selectedUser.id)}
                            disabled={isUpdatingUser}
                            className="col-span-2 w-full text-center py-2 bg-destructive/20 text-red-300 border border-destructive/30 rounded-xl hover:bg-destructive/30 transition font-semibold text-xs flex items-center justify-center gap-1.5"
                          >
                            <Trash2 className="size-3.5" /> Permanently Delete Profile
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PENDING APPROVALS */}
          {activeTab === "approvals" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-250 flex-1 flex flex-col">
              <Panel title="Access Request Pipeline">
                {isFetchingUsers ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    Scanning pipeline...
                  </p>
                ) : usersList.filter((u) => u.status === "pending").length === 0 ? (
                  <div className="py-12 text-center">
                    <CheckCircle2 className="mx-auto size-12 text-emerald-400 animate-pulse mb-3" />
                    <p className="font-display font-bold text-foreground">Pipeline Clear</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      There are no access requests currently waiting in the approval queue.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {usersList
                      .filter((u) => u.status === "pending")
                      .map((u) => (
                        <div
                          key={u.id}
                          className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-border/50 bg-card/40 rounded-2xl gap-3"
                        >
                          <div>
                            <p className="font-semibold text-sm text-foreground">
                              {u.full_name || "New Trader"}
                            </p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                            <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">
                              Requested {new Date(u.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => handleUpdateUserStatus(u.id, "approved")}
                              className="flex-1 sm:flex-initial py-1.5 px-4 bg-success/20 text-success border border-success/30 rounded-xl hover:bg-success/35 transition font-semibold text-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateUserStatus(u.id, "rejected")}
                              className="flex-1 sm:flex-initial py-1.5 px-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl hover:bg-destructive/20 transition font-semibold text-xs"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </Panel>
            </div>
          )}

          {/* TAB 4: PLATFORM CONTROLS */}
          {activeTab === "platform" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-250">
              <Panel title="Platform Control Panel">
                <div className="space-y-5">
                  {/* Announcement Banner */}
                  <div className="border-b border-border/40 pb-4">
                    <label className="flex items-center justify-between text-xs font-semibold">
                      <span>Enable Site Announcement Banner</span>
                      <input
                        type="checkbox"
                        checked={bannerActive}
                        onChange={(e) => setBannerActive(e.target.checked)}
                        className="accent-primary size-4"
                      />
                    </label>
                    <input
                      type="text"
                      value={banner}
                      onChange={(e) => setBanner(e.target.value)}
                      placeholder="Type site banner announcement here..."
                      className="mt-2 w-full rounded-xl border border-border bg-card/60 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {/* Maintenance Mode */}
                  <div className="flex items-center justify-between border-b border-border/40 pb-4">
                    <div>
                      <p className="text-xs font-semibold">Maintenance Mode</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed max-w-sm mt-0.5">
                        Blocks all standard user operations and redirects to upgrades screen. Owner
                        retains bypass privileges.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={maintenance}
                      onChange={(e) => setMaintenance(e.target.checked)}
                      className="accent-destructive size-4 cursor-pointer"
                    />
                  </div>

                  {/* User Registration Toggles */}
                  <div className="flex items-center justify-between border-b border-border/40 pb-4">
                    <div>
                      <p className="text-xs font-semibold">Allow New User Registrations</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed max-w-sm mt-0.5">
                        Toggles registration flow. If turned off, new signup attempts are blocked at
                        authentication fallback.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={registrationEnabled}
                      onChange={(e) => setRegistrationEnabled(e.target.checked)}
                      className="accent-primary size-4 cursor-pointer"
                    />
                  </div>

                  {/* Login Access Control */}
                  <div className="flex items-center justify-between border-b border-border/40 pb-4">
                    <div>
                      <p className="text-xs font-semibold">Allow Site Authentication (Logins)</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed max-w-sm mt-0.5">
                        Blocks logging in for normal accounts. Toggling this off forces active users
                        out immediately.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={loginEnabled}
                      onChange={(e) => setLoginEnabled(e.target.checked)}
                      className="accent-primary size-4 cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={handleSavePlatformSettings}
                    disabled={isSavingSettings}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent py-2.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] glow-primary"
                  >
                    <Save className="size-3.5" />
                    {isSavingSettings ? "Saving system settings…" : "Commit Platform Settings"}
                  </button>
                </div>
              </Panel>
            </div>
          )}

          {/* TAB 5: FEATURE FLAGS */}
          {activeTab === "features" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-250">
              <Panel title="Centralized Feature Flag Controls">
                <div className="space-y-5">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Toggle individual feature blocks system-wide. Disabling a feature removes/hides
                    interface access points in client side routing, preserving all database tables
                    and user rows safely.
                  </p>

                  <div className="flex items-center justify-between border-b border-border/40 pb-4">
                    <div>
                      <p className="text-xs font-semibold flex items-center gap-1.5">
                        <Brain className="size-3.5 text-primary" /> AI Coach Module
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed max-w-sm mt-0.5">
                        Enable the Groq AI trading psychology coach interface.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={aiEnabled}
                      onChange={(e) => setAiEnabled(e.target.checked)}
                      className="accent-primary size-4 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between border-b border-border/40 pb-4">
                    <div>
                      <p className="text-xs font-semibold flex items-center gap-1.5">
                        <SlidersHorizontal className="size-3.5 text-primary" /> MT5 Integration
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed max-w-sm mt-0.5">
                        Enable MetaTrader 5 API synchronization and license keys dashboard.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={mt5Enabled}
                      onChange={(e) => setMt5Enabled(e.target.checked)}
                      className="accent-primary size-4 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between border-b border-border/40 pb-4">
                    <div>
                      <p className="text-xs font-semibold flex items-center gap-1.5">
                        <FileText className="size-3.5 text-primary" /> Trading Journal Features
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed max-w-sm mt-0.5">
                        Enforces write permissions on journals. Disabling locks entries as
                        read-only.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={journalEnabled}
                      onChange={(e) => setJournalEnabled(e.target.checked)}
                      className="accent-primary size-4 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between border-b border-border/40 pb-4">
                    <div>
                      <p className="text-xs font-semibold flex items-center gap-1.5">
                        <Activity className="size-3.5 text-primary" /> Live Market Data feeds
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed max-w-sm mt-0.5">
                        Sync and display active market data feeds and indexes.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={marketDataEnabled}
                      onChange={(e) => setMarketDataEnabled(e.target.checked)}
                      className="accent-primary size-4 cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={handleSavePlatformSettings}
                    disabled={isSavingSettings}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent py-2.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] glow-primary"
                  >
                    <Save className="size-3.5" />
                    {isSavingSettings ? "Committing Flags…" : "Save Feature Flags"}
                  </button>
                </div>
              </Panel>
            </div>
          )}

          {/* TAB 6: SYSTEM DEADLINES */}
          {activeTab === "deadlines" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-250">
              <Panel title="Schedule Rollout & Maintenance Deadlines">
                <form onSubmit={handleSaveDeadline} className="grid gap-4 sm:grid-cols-2 text-xs">
                  <div>
                    <label className="block text-muted-foreground font-semibold">
                      Feature / Rollout Label
                    </label>
                    <input
                      type="text"
                      value={newDeadlineFeature}
                      onChange={(e) => setNewDeadlineFeature(e.target.value)}
                      placeholder="e.g. AI Coach, Database Migrations"
                      className="mt-1.5 w-full rounded-xl border border-border bg-card/60 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-muted-foreground font-semibold">
                      Rollout Status
                    </label>
                    <select
                      value={newDeadlineStatus}
                      onChange={(e) => setNewDeadlineStatus(e.target.value as Deadline["status"])}
                      className="mt-1.5 w-full rounded-xl border border-border bg-card/60 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="active">Active Rollout</option>
                      <option value="disabled">Disabled</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-muted-foreground font-semibold">
                      Start Timestamp
                    </label>
                    <input
                      type="datetime-local"
                      value={newDeadlineStart}
                      onChange={(e) => setNewDeadlineStart(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-border bg-card/60 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-muted-foreground font-semibold">
                      Target Completion Deadline
                    </label>
                    <input
                      type="datetime-local"
                      value={newDeadlineEnd}
                      onChange={(e) => setNewDeadlineEnd(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-border bg-card/60 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingDeadline}
                    className="sm:col-span-2 mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-accent py-2.5 font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] glow-primary"
                  >
                    <Plus className="size-4" />
                    {isSavingDeadline ? "Saving Deadline..." : "Add System Deadline"}
                  </button>
                </form>
              </Panel>

              <Panel title="Active System Deadlines & Rollouts">
                {isFetchingDeadlines ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Scanning database schedules...
                  </p>
                ) : deadlines.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    No active deadlines logged in database.
                  </p>
                ) : (
                  <div className="space-y-3.5">
                    {deadlines.map((dl) => {
                      const hasEnded = dl.deadline ? new Date() > new Date(dl.deadline) : false;
                      return (
                        <div
                          key={dl.id}
                          className="flex justify-between items-center p-4 border border-border/50 bg-card/40 rounded-2xl text-xs"
                        >
                          <div>
                            <p className="font-semibold text-sm text-foreground">
                              {dl.feature_name}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-muted-foreground text-[10px] mt-1">
                              <span>Start: {new Date(dl.start_date).toLocaleString()}</span>
                              {dl.deadline && (
                                <span
                                  className={
                                    hasEnded
                                      ? "text-red-400 font-medium"
                                      : "text-emerald-400 font-medium"
                                  }
                                >
                                  End: {new Date(dl.deadline).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              tone={
                                dl.status === "completed"
                                  ? "win"
                                  : dl.status === "active"
                                    ? "primary"
                                    : dl.status === "maintenance"
                                      ? "loss"
                                      : "muted"
                              }
                            >
                              {dl.status.toUpperCase()}
                            </Badge>
                            <button
                              onClick={() => handleDeleteDeadline(dl.id)}
                              className="rounded-lg p-1.5 border border-border hover:border-destructive text-muted-foreground hover:text-destructive transition"
                              title="Delete deadline"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Panel>
            </div>
          )}

          {/* TAB 7: SYSTEM HEALTH CENTER */}
          {activeTab === "health" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-250">
              <Panel
                title="System Diagnostics & Integrations Status"
                action={
                  <button
                    onClick={runHealthDiagnostic}
                    className="flex items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3.5 py-1.5 text-xs font-semibold hover:border-primary/50 transition"
                  >
                    <RefreshCw className="size-3.5" /> Run System Check
                  </button>
                }
              >
                <div className="space-y-4">
                  {/* Auth System */}
                  <div className="flex items-start justify-between p-4 border border-border/40 bg-card/30 rounded-2xl gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl border ${healthStatus.auth === "ok" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : healthStatus.auth === "checking" ? "bg-primary/10 border-primary/20 text-primary" : "bg-red-500/10 border-red-500/20 text-red-400"}`}
                      >
                        <Key className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold">Supabase Auth System</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Provides OTP verification and JWT session tokens.
                        </p>
                      </div>
                    </div>
                    <Badge
                      tone={
                        healthStatus.auth === "ok"
                          ? "win"
                          : healthStatus.auth === "checking"
                            ? "primary"
                            : "loss"
                      }
                    >
                      {healthStatus.auth.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Database */}
                  <div className="flex items-start justify-between p-4 border border-border/40 bg-card/30 rounded-2xl gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl border ${healthStatus.db === "ok" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : healthStatus.db === "checking" ? "bg-primary/10 border-primary/20 text-primary" : "bg-red-500/10 border-red-500/20 text-red-400"}`}
                      >
                        <FileText className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold">Supabase PostgreSQL DB Connection</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Core persistence storage layer for trades, settings, and profiles.
                        </p>
                      </div>
                    </div>
                    <Badge
                      tone={
                        healthStatus.db === "ok"
                          ? "win"
                          : healthStatus.db === "checking"
                            ? "primary"
                            : "loss"
                      }
                    >
                      {healthStatus.db.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Vercel APIs */}
                  <div className="flex items-start justify-between p-4 border border-border/40 bg-card/30 rounded-2xl gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl border ${healthStatus.api === "ok" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : healthStatus.api === "checking" ? "bg-primary/10 border-primary/20 text-primary" : "bg-red-500/10 border-red-500/20 text-red-400"}`}
                      >
                        <SlidersHorizontal className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold">Vercel API Serverless Functions</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Executes backend routines, notifications, and analytics controllers.
                        </p>
                      </div>
                    </div>
                    <Badge
                      tone={
                        healthStatus.api === "ok"
                          ? "win"
                          : healthStatus.api === "checking"
                            ? "primary"
                            : "loss"
                      }
                    >
                      {healthStatus.api.toUpperCase()}
                    </Badge>
                  </div>

                  {/* AI Inference */}
                  <div className="flex items-start justify-between p-4 border border-border/40 bg-card/30 rounded-2xl gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl border ${healthStatus.ai === "ok" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : healthStatus.ai === "checking" ? "bg-primary/10 border-primary/20 text-primary" : "bg-red-500/10 border-red-500/20 text-red-400"}`}
                      >
                        <Brain className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold">Groq AI Inference Engine</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Calculates emotional grading and provides psychology feedback.
                        </p>
                      </div>
                    </div>
                    <Badge
                      tone={
                        healthStatus.ai === "ok"
                          ? "win"
                          : healthStatus.ai === "checking"
                            ? "primary"
                            : "loss"
                      }
                    >
                      {healthStatus.ai === "ok"
                        ? "READY"
                        : healthStatus.ai === "checking"
                          ? "SCANNING"
                          : "UNCONFIGURED"}
                    </Badge>
                  </div>

                  {/* Mail system */}
                  <div className="flex items-start justify-between p-4 border border-border/40 bg-card/30 rounded-2xl gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl border ${healthStatus.email === "ok" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : healthStatus.email === "checking" ? "bg-primary/10 border-primary/20 text-primary" : "bg-red-500/10 border-red-500/20 text-red-400"}`}
                      >
                        <Mail className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold">SMTP/Resend Mail Dispatcher</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Sends status approval alerts and OTP recovery links.
                        </p>
                      </div>
                    </div>
                    <Badge
                      tone={
                        healthStatus.email === "ok"
                          ? "win"
                          : healthStatus.email === "checking"
                            ? "primary"
                            : "loss"
                      }
                    >
                      {healthStatus.email === "ok"
                        ? "ONLINE"
                        : healthStatus.email === "checking"
                          ? "SCANNING"
                          : "OFFLINE"}
                    </Badge>
                  </div>

                  {healthStatus.lastChecked && (
                    <p className="text-[10px] text-muted-foreground text-center mt-3">
                      Last health scan completed at: {healthStatus.lastChecked}
                    </p>
                  )}
                </div>
              </Panel>

              {healthStatus.rawHealthData && (
                <Panel title="System Diagnostics Detail (Read Only JSON)">
                  <pre className="p-4 bg-muted/40 border border-border/40 rounded-2xl text-[10px] font-mono text-muted-foreground overflow-x-auto whitespace-pre">
                    {JSON.stringify(healthStatus.rawHealthData, null, 2)}
                  </pre>
                </Panel>
              )}
            </div>
          )}

          {/* TAB 8: SECURITY LOGS */}
          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-250 flex-1 flex flex-col">
              <Panel
                title="System Security Auditing Trail"
                className="flex-1 flex flex-col"
                action={
                  <button
                    onClick={() => {
                      fetchAuditLogs();
                      toast.success("Logs list synchronized.");
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3 py-1.5 text-xs font-semibold hover:border-primary/50 transition"
                  >
                    <RefreshCw className="size-3.5" /> Sync Logs
                  </button>
                }
              >
                <p className="text-xs text-muted-foreground mb-4">
                  Immutable administrative log showing target mutation events, states, administrator
                  emails, and execution results. Safe details are presented (secrets and tokens are
                  masked).
                </p>

                {isFetchingLogs ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    Scanning audit log index…
                  </p>
                ) : auditLogs.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    No administrative actions logged in system.
                  </p>
                ) : (
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full min-w-[650px] text-xs">
                      <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border/40 pb-2">
                          <th className="pb-2.5 font-medium">Timestamp</th>
                          <th className="pb-2.5 font-medium">Administrator</th>
                          <th className="pb-2.5 font-medium">Action</th>
                          <th className="pb-2.5 font-medium">Target Component</th>
                          <th className="pb-2.5 font-medium text-right">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((log) => (
                          <tr
                            key={log.id}
                            className="border-t border-border/40 transition hover:bg-muted/20"
                          >
                            <td className="py-2.5 font-mono text-[10px] text-muted-foreground">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="py-2.5 font-medium text-foreground">
                              {log.admin_email}
                            </td>
                            <td className="py-2.5 font-mono text-[10px] text-primary">
                              {log.action}
                            </td>
                            <td className="py-2.5 text-muted-foreground">
                              {log.target_type}{" "}
                              {log.target_id ? `(${log.target_id.slice(0, 8)})` : ""}
                            </td>
                            <td className="py-2.5 text-right">
                              <Badge tone={log.result === "success" ? "win" : "loss"}>
                                {log.result.toUpperCase()}
                              </Badge>
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

          {/* TAB 9: ANNOUNCEMENTS */}
          {activeTab === "announcements" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-250">
              <Panel title="Draft & Publish Targeted Announcement">
                <form onSubmit={handleSaveAnnouncement} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-muted-foreground font-semibold">
                      Announcement Title
                    </label>
                    <input
                      type="text"
                      value={newAnnTitle}
                      onChange={(e) => setNewAnnTitle(e.target.value)}
                      placeholder="e.g. Schedule Maintenance, New AI Update Available"
                      className="mt-1.5 w-full rounded-xl border border-border bg-card/60 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-muted-foreground font-semibold">
                      Notification Content Message
                    </label>
                    <textarea
                      value={newAnnMessage}
                      onChange={(e) => setNewAnnMessage(e.target.value)}
                      placeholder="Write details of the platform news here..."
                      className="mt-1.5 w-full h-24 rounded-xl border border-border bg-card/60 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring resize-none"
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-muted-foreground font-semibold">
                        Audience Scope
                      </label>
                      <select
                        value={newAnnAudience}
                        onChange={(e) =>
                          setNewAnnAudience(e.target.value as Announcement["audience"])
                        }
                        className="mt-1.5 w-full rounded-xl border border-border bg-card/60 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="all">All Users (App-wide Banner)</option>
                        <option value="approved">Approved Members Only</option>
                        <option value="pending">Pending Members Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-muted-foreground font-semibold">
                        Initial Status
                      </label>
                      <select
                        value={newAnnStatus}
                        onChange={(e) => setNewAnnStatus(e.target.value as Announcement["status"])}
                        className="mt-1.5 w-full rounded-xl border border-border bg-card/60 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="published">Publish Immediately</option>
                        <option value="draft">Save to Drafts</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingAnnouncement}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-accent py-2.5 font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] glow-primary"
                  >
                    <Send className="size-4" />
                    {isSavingAnnouncement ? "Publishing..." : "Submit Announcement"}
                  </button>
                </form>
              </Panel>

              <Panel title="Platform News & Announcement History">
                {isFetchingAnnouncements ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Retrieving platform history...
                  </p>
                ) : announcements.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    No announcement entries discovered.
                  </p>
                ) : (
                  <div className="space-y-3.5">
                    {announcements.map((ann) => (
                      <div
                        key={ann.id}
                        className="p-4 border border-border/50 bg-card/40 rounded-2xl text-xs space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-sm text-foreground">{ann.title}</h4>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Created {new Date(ann.created_at).toLocaleDateString()} · Target:{" "}
                              <span className="font-semibold text-primary capitalize">
                                {ann.audience}
                              </span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge tone={ann.status === "published" ? "win" : "muted"}>
                              {ann.status.toUpperCase()}
                            </Badge>
                            <button
                              onClick={() => handleDeleteAnnouncement(ann.id)}
                              className="rounded-lg p-1.5 border border-border hover:border-destructive text-muted-foreground hover:text-destructive transition"
                              title="Delete announcement"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-muted-foreground leading-relaxed text-xs">
                          {ann.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </div>
          )}

          {/* TAB 10: EMAIL CENTER */}
          {activeTab === "email" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-250">
              <Panel title="SMTP & Email Dispatch Diagnostic Center">
                <form onSubmit={handleSendTestEmail} className="space-y-4 text-xs">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Verify connection to SMTP/Resend on-demand. Enter your target email to dispatch
                    a mock Account Approval/Decline template notification. No data records will
                    mutate.
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-muted-foreground font-semibold">
                        Recipient Name
                      </label>
                      <input
                        type="text"
                        value={testEmailName}
                        onChange={(e) => setTestEmailName(e.target.value)}
                        placeholder="e.g. Kamal"
                        className="mt-1.5 w-full rounded-xl border border-border bg-card/60 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-muted-foreground font-semibold">
                        Destination Email
                      </label>
                      <input
                        type="email"
                        value={testEmailAddress}
                        onChange={(e) => setTestEmailAddress(e.target.value)}
                        placeholder="recipient@domain.com"
                        className="mt-1.5 w-full rounded-xl border border-border bg-card/60 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-muted-foreground font-semibold">
                      Mock Access Action Status
                    </label>
                    <div className="mt-2 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setTestEmailStatus("approved")}
                        className={`flex-1 text-center py-2 border rounded-xl font-semibold transition text-xs ${
                          testEmailStatus === "approved"
                            ? "bg-success/10 text-success border-success/30"
                            : "border-border text-muted-foreground hover:bg-card/40"
                        }`}
                      >
                        Approved Access Template
                      </button>
                      <button
                        type="button"
                        onClick={() => setTestEmailStatus("rejected")}
                        className={`flex-1 text-center py-2 border rounded-xl font-semibold transition text-xs ${
                          testEmailStatus === "rejected"
                            ? "bg-destructive/10 text-destructive border-destructive/20"
                            : "border-border text-muted-foreground hover:bg-card/40"
                        }`}
                      >
                        Rejected Access Template
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingTestEmail}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-accent py-2.5 font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] glow-primary"
                  >
                    <Send className="size-4" />
                    {isSendingTestEmail ? "Dispatching..." : "Dispatch Diagnostic Email"}
                  </button>
                </form>
              </Panel>
            </div>
          )}

          {/* TAB 11: EMERGENCY CENTER */}
          {activeTab === "emergency" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-250">
              {/* Emergency Maintenance Mode */}
              <Panel
                title="Emergency Maintenance Mode Lock"
                className="border-red-500/30 bg-red-500/5 relative overflow-hidden"
              >
                <div className="pointer-events-none absolute -left-20 -top-20 size-80 rounded-full bg-red-500/10 blur-3xl" />
                <div className="space-y-4 text-xs">
                  <div className="flex gap-3.5 items-start">
                    <AlertTriangle className="size-10 shrink-0 text-red-400 animate-bounce" />
                    <div>
                      <h3 className="text-sm font-bold text-red-300">
                        Lock Entire Application Under Maintenance
                      </h3>
                      <p className="mt-1 text-muted-foreground leading-relaxed">
                        Redirects all standard traders instantly to upgrades/maintenance screen.
                        Admins and owners bypass this lock automatically.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-red-500/20 pt-4 space-y-3">
                    <label className="block text-red-200">
                      To confirm, type{" "}
                      <span className="font-mono font-bold text-white bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30">
                        MAINTENANCE
                      </span>{" "}
                      below:
                    </label>
                    <input
                      type="text"
                      value={emergencyConfirmMaint}
                      onChange={(e) => setEmergencyConfirmMaint(e.target.value)}
                      placeholder="Type MAINTENANCE to confirm"
                      className="w-full rounded-xl border border-red-500/30 bg-black/40 px-3.5 py-2.5 text-xs outline-none focus:ring-1 focus:ring-red-500/50 text-red-200 placeholder:text-red-500/40"
                    />

                    {maintenance ? (
                      <button
                        type="button"
                        onClick={async () => {
                          if (emergencyConfirmMaint !== "MAINTENANCE") {
                            toast.error("Type confirmation phrase exactly.");
                            return;
                          }
                          setMaintenance(false);
                          setEmergencyConfirmMaint("");
                          toast.info("Toggling Maintenance OFF. Please save below.");
                        }}
                        className="w-full text-center py-2 bg-success/20 text-success border border-success/30 rounded-xl hover:bg-success/35 transition font-semibold"
                      >
                        <Unlock className="inline size-4 mr-1.5" /> Deactivate Maintenance Mode
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          if (emergencyConfirmMaint !== "MAINTENANCE") {
                            toast.error("Type confirmation phrase exactly.");
                            return;
                          }
                          setMaintenance(true);
                          setEmergencyConfirmMaint("");
                          toast.info("Toggling Maintenance ON. Please save below.");
                        }}
                        className="w-full text-center py-2 bg-red-500/20 text-red-200 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition font-semibold"
                      >
                        <Lock className="inline size-4 mr-1.5 animate-pulse" /> Activate Maintenance
                        Mode
                      </button>
                    )}
                  </div>
                </div>
              </Panel>

              {/* Emergency Registration shutdown */}
              <Panel
                title="Emergency Registration Halt"
                className="border-red-500/30 bg-red-500/5 relative overflow-hidden"
              >
                <div className="pointer-events-none absolute -left-20 -top-20 size-80 rounded-full bg-red-500/10 blur-3xl" />
                <div className="space-y-4 text-xs">
                  <div className="flex gap-3.5 items-start">
                    <Ban className="size-10 shrink-0 text-red-400" />
                    <div>
                      <h3 className="text-sm font-bold text-red-300">
                        Disable New Registrations Immediately
                      </h3>
                      <p className="mt-1 text-muted-foreground leading-relaxed">
                        Blocks anyone from submitting OTP signup queries. Prevents spam registry
                        attacks. Active logins are unaffected.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-red-500/20 pt-4 space-y-3">
                    <label className="block text-red-200">
                      To confirm, type{" "}
                      <span className="font-mono font-bold text-white bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30">
                        HALT REGISTRATION
                      </span>{" "}
                      below:
                    </label>
                    <input
                      type="text"
                      value={emergencyConfirmReg}
                      onChange={(e) => setEmergencyConfirmReg(e.target.value)}
                      placeholder="Type HALT REGISTRATION to confirm"
                      className="w-full rounded-xl border border-red-500/30 bg-black/40 px-3.5 py-2.5 text-xs outline-none focus:ring-1 focus:ring-red-500/50 text-red-200 placeholder:text-red-500/40"
                    />

                    {registrationEnabled ? (
                      <button
                        type="button"
                        onClick={async () => {
                          if (emergencyConfirmReg !== "HALT REGISTRATION") {
                            toast.error("Type confirmation phrase exactly.");
                            return;
                          }
                          setRegistrationEnabled(false);
                          setEmergencyConfirmReg("");
                          toast.info("Toggling registrations OFF. Please save below.");
                        }}
                        className="w-full text-center py-2 bg-red-500/20 text-red-200 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition font-semibold"
                      >
                        <Lock className="inline size-4 mr-1.5" /> Disable Registrations
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          if (emergencyConfirmReg !== "HALT REGISTRATION") {
                            toast.error("Type confirmation phrase exactly.");
                            return;
                          }
                          setRegistrationEnabled(true);
                          setEmergencyConfirmReg("");
                          toast.info("Toggling registrations ON. Please save below.");
                        }}
                        className="w-full text-center py-2 bg-success/20 text-success border border-success/30 rounded-xl hover:bg-success/35 transition font-semibold"
                      >
                        <Unlock className="inline size-4 mr-1.5" /> Enable Registrations
                      </button>
                    )}
                  </div>
                </div>
              </Panel>

              {/* Emergency Login Shutdown */}
              <Panel
                title="Emergency Authentication Halt"
                className="border-red-500/30 bg-red-500/5 relative overflow-hidden"
              >
                <div className="pointer-events-none absolute -left-20 -top-20 size-80 rounded-full bg-red-500/10 blur-3xl" />
                <div className="space-y-4 text-xs">
                  <div className="flex gap-3.5 items-start">
                    <ShieldAlert className="size-10 shrink-0 text-red-400" />
                    <div>
                      <h3 className="text-sm font-bold text-red-300">
                        Disable Authentication Services Immediately
                      </h3>
                      <p className="mt-1 text-muted-foreground leading-relaxed">
                        Blocks all standard user authentications. Actively logged in traders are
                        forced out. Owner is protected and retains emergency dashboard access.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-red-500/20 pt-4 space-y-3">
                    <label className="block text-red-200">
                      To confirm, type{" "}
                      <span className="font-mono font-bold text-white bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30">
                        SHUTDOWN
                      </span>{" "}
                      below:
                    </label>
                    <input
                      type="text"
                      value={emergencyConfirmLogin}
                      onChange={(e) => setEmergencyConfirmLogin(e.target.value)}
                      placeholder="Type SHUTDOWN to confirm"
                      className="w-full rounded-xl border border-red-500/30 bg-black/40 px-3.5 py-2.5 text-xs outline-none focus:ring-1 focus:ring-red-500/50 text-red-200 placeholder:text-red-500/40"
                    />

                    {loginEnabled ? (
                      <button
                        type="button"
                        onClick={async () => {
                          if (emergencyConfirmLogin !== "SHUTDOWN") {
                            toast.error("Type confirmation phrase exactly.");
                            return;
                          }
                          setLoginEnabled(false);
                          setEmergencyConfirmLogin("");
                          toast.info("Toggling logins OFF. Please save below.");
                        }}
                        className="w-full text-center py-2 bg-red-500/20 text-red-200 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition font-semibold"
                      >
                        <Lock className="inline size-4 mr-1.5" /> Deactivate Site Logins
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          if (emergencyConfirmLogin !== "SHUTDOWN") {
                            toast.error("Type confirmation phrase exactly.");
                            return;
                          }
                          setLoginEnabled(true);
                          setEmergencyConfirmLogin("");
                          toast.info("Toggling logins ON. Please save below.");
                        }}
                        className="w-full text-center py-2 bg-success/20 text-success border border-success/30 rounded-xl hover:bg-success/35 transition font-semibold"
                      >
                        <Unlock className="inline size-4 mr-1.5" /> Reactivate Site Logins
                      </button>
                    )}
                  </div>
                </div>
              </Panel>

              {/* SAVE SETTINGS TO DB */}
              <Panel title="Commit Emergency Actions">
                <div className="space-y-4 text-xs">
                  <p className="text-muted-foreground leading-relaxed">
                    ⚠️ Emergency actions toggled above will NOT persist or take effect until
                    committed. Confirm setting choices below.
                  </p>
                  <button
                    onClick={handleSavePlatformSettings}
                    disabled={isSavingSettings}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent py-2.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] glow-primary"
                  >
                    <Save className="size-3.5" />
                    {isSavingSettings
                      ? "Saving system settings…"
                      : "Commit Platforms and Save Emergency Configuration"}
                  </button>
                </div>
              </Panel>
            </div>
          )}
        </main>
      </div>
    </AppShell>
  );
}
