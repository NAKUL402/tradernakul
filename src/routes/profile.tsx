import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth-context";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { fetchUserTrades, stats as calcStats, money, pct } from "@/lib/trades";
import {
  User,
  Mail,
  Calendar,
  Globe,
  Clock,
  Camera,
  Pencil,
  Activity,
  Target,
  Percent,
  Wallet,
  X,
} from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Edge Journal" },
      { name: "description", content: "Manage your personal information and account details." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { user, profile, userSettings, updateUserSettings, isOwner, isAdmin, isApproved, refreshProfile } = useAuth();

  const [isUploading, setIsUploading] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [nameInput, setNameInput] = useState(
    profile?.full_name || user?.user_metadata?.["full_name"] || user?.user_metadata?.["name"] || ""
  );
  const [userStats, setUserStats] = useState<ReturnType<typeof calcStats> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUserTrades().then((trades) => setUserStats(calcStats(trades)));
  }, []);

  const name = profile?.full_name || user?.user_metadata?.["full_name"] || user?.user_metadata?.["name"] || "Trader";
  const email = profile?.email || user?.email || "";
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    : "—";
  const roleLabel = isOwner ? "Owner Admin" : isAdmin ? "Admin" : "Trader";

  const initials = name
    .split(" ")
    .map((p: string) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const currencySymbol = userSettings?.currency?.split(" ")[1]?.replace(/[()]/g, "") || "$";

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !user) return;
    setIsUploading(true);
    try {
      const file = e.target.files[0];
      if (!file) return;
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("profile-avatars").upload(fileName, file as File, { upsert: true }) as any;
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("profile-avatars").getPublicUrl(fileName);
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
      if (updateError) throw updateError;
      toast.success("Profile photo updated!");
      await refreshProfile();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveName = async () => {
    if (!user || nameInput.trim() === name) return;
    setIsSavingName(true);
    try {
      const { error } = await supabase.from("profiles").update({ full_name: nameInput.trim() }).eq("id", user.id);
      if (error) throw error;
      toast.success("Name updated!");
      await refreshProfile();
      setEditOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    } finally {
      setIsSavingName(false);
    }
  };

  const infoRows = [
    { icon: <User className="size-[18px] text-zinc-500" />, label: "Full Name", value: name },
    { icon: <Mail className="size-[18px] text-zinc-500" />, label: "Email Address", value: email },
    { icon: <Calendar className="size-[18px] text-zinc-500" />, label: "Date Joined", value: memberSince },
    { icon: <Globe className="size-[18px] text-zinc-500" />, label: "Country", value: (userSettings as any)?.country || "Not set" },
    { icon: <Clock className="size-[18px] text-zinc-500" />, label: "Time Zone", value: Intl.DateTimeFormat().resolvedOptions().timeZone || "—" },
  ];

  const statCards = userStats
    ? [
        { icon: <Activity className="size-[18px] text-blue-400" />, label: "Total Trades", value: String(userStats.total) },
        { icon: <Target className="size-[18px] text-emerald-400" />, label: "Win Rate", value: `${userStats.winRate.toFixed(1)}%` },
        { icon: <Percent className="size-[18px] text-violet-400" />, label: "Profit Factor", value: userStats.profitFactor > 0 ? userStats.profitFactor.toFixed(2) : "0.00" },
        { icon: <Wallet className="size-[18px] text-emerald-400" />, label: "Net PnL", value: money(userStats.net, currencySymbol) },
        { icon: <Calendar className="size-[18px] text-amber-400" />, label: "Member Since", value: memberSince },
      ]
    : null;

  return (
    <AppShell title="Profile" subtitle="Manage your personal information and account details.">
      <div className="w-full max-w-3xl mx-auto space-y-3 pb-12">

        {/* ── Hero Card ── */}
        <div className="neon-card neon-glow-purple overflow-hidden">
          {/* Subtle top gradient strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500/40 via-violet-500/40 to-fuchsia-500/40" />

          <div className="flex flex-col items-center py-5 px-5">
            {/* Avatar */}
            <div className="relative mb-3">
              <img src={profile?.avatar_url || "/avatar.png"} alt={name} className="size-24 rounded-full object-cover ring-4 ring-indigo-500/20" />
              {/* Camera overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full bg-zinc-800 border-2 border-[#0d0d14] text-zinc-300 hover:bg-zinc-700 transition cursor-pointer"
              >
                <Camera className="size-3.5" />
              </button>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleAvatarUpload} />
            </div>

            {/* Name & Email */}
            <h2 className="text-[20px] font-bold text-foreground leading-tight">{name}</h2>
            <p className="text-[13px] text-muted-foreground mt-0.5">{email}</p>

            {/* Edit Profile Button */}
            <button
              onClick={() => setEditOpen(true)}
              className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-5 py-2 text-[13px] font-semibold text-foreground hover:bg-muted transition cursor-pointer"
            >
              <Pencil className="size-3.5" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* ── Profile Information ── */}
        <div className="neon-card neon-glow-blue overflow-hidden">
          <div className="px-5 py-4">
            <h3 className="text-[16px] font-bold text-foreground mb-4">Profile Information</h3>
            <div className="space-y-0">
              {infoRows.map((row, i) => (
                <div key={row.label} className={`flex items-center justify-between py-4 ${i < infoRows.length - 1 ? "border-b border-border" : ""}`}>
                  <div className="flex items-center gap-3">
                    {row.icon}
                    <span className="text-[14px] text-muted-foreground">{row.label}</span>
                  </div>
                  <span className="text-[14px] text-foreground font-medium text-right">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Account Summary ── */}
        <div className="neon-card neon-glow-green overflow-hidden">
          <div className="px-5 py-4">
            <h3 className="text-[16px] font-bold text-foreground mb-5">Account Summary</h3>
            {statCards ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {statCards.map((s) => (
                  <div key={s.label} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-4 text-center transition-all hover:border-emerald-500/50 hover:shadow-[0_0_14px_rgba(16,185,129,0.2)]">
                    <div className="flex items-center gap-1.5">
                      {s.icon}
                      <span className="text-[11px] text-zinc-500 font-medium leading-tight">{s.label}</span>
                    </div>
                    <span className="text-[18px] font-bold text-foreground leading-none">{s.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-20 flex items-center justify-center text-[13px] text-zinc-600">Loading stats…</div>
            )}
          </div>
        </div>

      </div>

      {/* ── Edit Profile Modal ── */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h3 className="text-[16px] font-bold text-foreground">Edit Profile</h3>
              <button onClick={() => setEditOpen(false)} className="text-zinc-500 hover:text-zinc-300 transition cursor-pointer">
                <X className="size-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-[13px] font-semibold text-muted-foreground block mb-2">Full Name</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-[14px] text-foreground outline-none focus:border-indigo-500/50 transition"
                />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-muted-foreground block mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-[14px] text-zinc-500 outline-none cursor-not-allowed"
                />
                <p className="text-[11px] text-zinc-600 mt-1.5">Email is managed via your secure provider.</p>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-muted-foreground block mb-2">Trading Style</label>
                <select
                  value={userSettings?.trading_style || ""}
                  onChange={(e) => updateUserSettings({ trading_style: e.target.value || null })}
                  className="w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-[14px] text-foreground outline-none focus:border-indigo-500/50 transition cursor-pointer"
                >
                  <option value="">Not specified</option>
                  {["Day Trader", "Swing Trader", "Scalper", "Position Trader"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-muted-foreground block mb-2">Preferred Timeframe</label>
                <select
                  value={userSettings?.preferred_timeframe || ""}
                  onChange={(e) => updateUserSettings({ preferred_timeframe: e.target.value || null })}
                  className="w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-[14px] text-foreground outline-none focus:border-indigo-500/50 transition cursor-pointer"
                >
                  <option value="">Not specified</option>
                  {["M1-M5 (Scalp)", "M15-H1 (Intraday)", "H4-D1 (Swing)", "W1-MN (Macro)"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-muted-foreground block mb-2">Country</label>
                <input
                  type="text"
                  value={(userSettings as any)?.country || ""}
                  onChange={(e) => updateUserSettings({ country: e.target.value || null } as any)}
                  placeholder="e.g. India, USA, UK"
                  className="w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-[14px] text-foreground outline-none focus:border-indigo-500/50 transition"
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-5 border-t border-border">
              <button onClick={() => setEditOpen(false)} className="flex-1 rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-[14px] font-medium text-muted-foreground hover:bg-muted transition cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleSaveName}
                disabled={isSavingName || nameInput.trim() === name}
                className="flex-1 rounded-xl bg-indigo-500 px-4 py-2.5 text-[14px] font-semibold text-foreground hover:bg-indigo-600 disabled:opacity-50 transition cursor-pointer"
              >
                {isSavingName ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
