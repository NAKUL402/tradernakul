import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { Badge, Panel } from "@/components/app/ui-kit";
import { money, pct, stats } from "@/lib/trades";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Trading Journal AI" },
      { name: "description", content: "Your trader profile: plan, trading style, stats snapshot and account details." },
      { property: "og:title", content: "Profile — Trading Journal AI" },
      { property: "og:description", content: "Trader profile with plan details and lifetime performance snapshot." },
    ],
  }),
  component: Profile,
});

import { useAuth } from "@/lib/auth-context";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { fetchUserTrades, stats as calcStats } from "@/lib/trades";

function Profile() {
  const { user, profile, userSettings, updateUserSettings, isOwner, isAdmin, isApproved, refreshSettings, refreshProfile } = useAuth();
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.full_name || user?.user_metadata?.["full_name"] || user?.user_metadata?.["name"] || "");
  const [userStats, setUserStats] = useState<ReturnType<typeof calcStats> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUserTrades().then(trades => {
      setUserStats(calcStats(trades));
    });
  }, []);

  const name = profile?.full_name || user?.user_metadata?.["full_name"] || user?.user_metadata?.["name"] || "Trader";
  const email = profile?.email || user?.email || "";
  const roleLabel = isOwner ? "Owner Admin" : isAdmin ? "Admin" : "Trader";
  const statusLabel = isOwner || isApproved ? "APPROVED" : profile?.status ? profile.status.toUpperCase() : "PENDING";
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "Unknown";

  const initials = name
    .split(" ")
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0 || !user) return;
      setIsUploading(true);
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile-avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;
      toast.success("Profile photo updated successfully");
      
      await refreshProfile();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload avatar");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAvatarRemove = async () => {
    try {
      if (!user || !profile?.avatar_url) return;
      setIsUploading(true);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (updateError) throw updateError;
      toast.success("Profile photo removed");
      await refreshProfile();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveName = async () => {
    if (!user || nameInput.trim() === name) return;
    setIsSavingName(true);
    try {
      const { error } = await supabase.from('profiles').update({ full_name: nameInput.trim() }).eq('id', user.id);
      if (error) throw error;
      toast.success("Name updated successfully");
      await refreshProfile();
    } catch (error: any) {
      toast.error(error.message || "Failed to update name");
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <AppShell title="Profile" subtitle="Manage your identity and trading profile">
      <div className="mx-auto max-w-4xl space-y-6">
        
        {/* Header Section */}
        <Panel>
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="flex flex-col items-center gap-3">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={name} className="size-24 rounded-3xl object-cover ring-2 ring-primary/40 glow-primary" />
              ) : (
                <div className="grid size-24 place-items-center rounded-3xl bg-gradient-to-br from-primary to-accent font-display text-3xl font-bold text-primary-foreground glow-primary">
                  {initials}
                </div>
              )}
              <div className="flex gap-2">
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleAvatarUpload} />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium hover:bg-muted/80 disabled:opacity-50"
                >
                  {isUploading ? "Uploading..." : "Change"}
                </button>
                {profile?.avatar_url && (
                  <button 
                    onClick={handleAvatarRemove}
                    disabled={isUploading}
                    className="rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h2 className="font-display text-2xl font-bold">{name}</h2>
              <p className="text-muted-foreground">{email}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <Badge tone="primary">{roleLabel}</Badge>
                <Badge tone={isApproved || isOwner ? "win" : "muted"}>{statusLabel}</Badge>
              </div>
            </div>
          </div>
        </Panel>

        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Personal Information */}
          <Panel title="Personal Information">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Email Address</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2.5 text-sm outline-none cursor-not-allowed opacity-70"
                />
                <p className="mt-1 text-xs text-muted-foreground">Email is managed via your secure provider.</p>
              </div>
              
              <div>
                <label className="mb-1.5 block text-sm font-medium">Full Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={isSavingName || nameInput.trim() === name}
                    className="whitespace-nowrap rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {isSavingName ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </Panel>

          {/* Account Status */}
          <Panel title="Account Status">
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <span className="text-muted-foreground">Member Since</span>
                <span className="font-medium">{memberSince}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <span className="text-muted-foreground">Platform Role</span>
                <span className="font-medium">{roleLabel}</span>
              </div>
              <div className="flex items-center justify-between pb-1">
                <span className="text-muted-foreground">Access Status</span>
                <span className="font-medium flex items-center gap-2">
                  <div className={`size-2 rounded-full ${isApproved || isOwner ? "bg-emerald-500" : "bg-yellow-500"}`}></div>
                  {statusLabel}
                </span>
              </div>
            </div>
          </Panel>

          {/* Real Statistics */}
          <Panel title="Trading Statistics" className="md:col-span-2">
            {userStats ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl border border-border/50 bg-card/60 p-4 text-center">
                  <p className="text-sm text-muted-foreground">Total Trades</p>
                  <p className="mt-1 font-display text-2xl font-bold">{userStats.total}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-card/60 p-4 text-center">
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="mt-1 font-display text-2xl font-bold">{userStats.winRate.toFixed(1)}%</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-card/60 p-4 text-center">
                  <p className="text-sm text-muted-foreground">Avg RRR</p>
                  <p className="mt-1 font-display text-2xl font-bold">{userStats.avgRRR.toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-card/60 p-4 text-center">
                  <p className="text-sm text-muted-foreground">Best Setup</p>
                  <p className="mt-1 font-display text-lg font-bold line-clamp-1">{userStats.bestPair?.name || "N/A"}</p>
                </div>
              </div>
            ) : (
              <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                Loading stats...
              </div>
            )}
          </Panel>

          {/* Trading Profile */}
          <Panel title="Trading Profile" className="md:col-span-2">
            <p className="mb-6 text-sm text-muted-foreground">
              Configure your primary trading identity. These settings help customize your journal analytics.
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Trading Style</label>
                <select
                  value={userSettings?.trading_style || ""}
                  onChange={(e) => updateUserSettings({ trading_style: e.target.value || null })}
                  className="w-full rounded-xl border border-border bg-card/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Not specified</option>
                  <option value="Day Trader">Day Trader</option>
                  <option value="Swing Trader">Swing Trader</option>
                  <option value="Scalper">Scalper</option>
                  <option value="Position Trader">Position Trader</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Preferred Timeframe</label>
                <select
                  value={userSettings?.preferred_timeframe || ""}
                  onChange={(e) => updateUserSettings({ preferred_timeframe: e.target.value || null })}
                  className="w-full rounded-xl border border-border bg-card/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Not specified</option>
                  <option value="M1-M5 (Scalp)">M1-M5 (Scalp)</option>
                  <option value="M15-H1 (Intraday)">M15-H1 (Intraday)</option>
                  <option value="H4-D1 (Swing)">H4-D1 (Swing)</option>
                  <option value="W1-MN (Macro)">W1-MN (Macro)</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Primary Markets</label>
                <input
                  type="text"
                  placeholder="e.g. Forex, Crypto, Indices (comma separated)"
                  value={userSettings?.primary_markets?.join(", ") || ""}
                  onChange={(e) => updateUserSettings({ 
                    primary_markets: e.target.value ? e.target.value.split(",").map(s => s.trim()).filter(Boolean) : null 
                  })}
                  className="w-full rounded-xl border border-border bg-card/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Preferred Session</label>
                <select
                  value={userSettings?.default_session || ""}
                  onChange={(e) => updateUserSettings({ default_session: e.target.value ? (e.target.value as any) : null })}
                  className="w-full rounded-xl border border-border bg-card/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">No default</option>
                  <option value="Asian">Asian</option>
                  <option value="London">London</option>
                  <option value="New York">New York</option>
                </select>
              </div>
            </div>
          </Panel>
        </div>

      </div>
    </AppShell>
  );
}

