import { useAuth } from "@/lib/auth-context";
import { Panel } from "@/components/app/ui-kit";

export function SettingsTradingPreferences() {
  const { userSettings, updateUserSettings } = useAuth();
  if (!userSettings) return null;

  return (
    <Panel title="Trading Preferences">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Currency</label>
          <select
            value={userSettings.currency}
            onChange={(e) => updateUserSettings({ currency: e.target.value })}
            className="mt-2 w-full rounded-xl border border-border bg-card/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {["USD ($)", "EUR (€)", "GBP (£)"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="text-sm font-medium">Default Trading Session</label>
          <select
            value={userSettings.default_session || ""}
            onChange={(e) => updateUserSettings({ default_session: e.target.value ? (e.target.value as any) : null })}
            className="mt-2 w-full rounded-xl border border-border bg-card/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">No default</option>
            {["Asian", "London", "New York"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-muted-foreground">Pre-fills new trades.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Default Risk %</label>
            <input
              type="number"
              step="0.1"
              value={userSettings.default_risk_pct || ""}
              onChange={(e) => updateUserSettings({ default_risk_pct: e.target.value ? parseFloat(e.target.value) : null })}
              placeholder="e.g. 1.0"
              className="mt-2 w-full rounded-xl border border-border bg-card/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Default R:R</label>
            <input
              type="text"
              value={userSettings.default_rrr || ""}
              onChange={(e) => updateUserSettings({ default_rrr: e.target.value || null })}
              placeholder="e.g. 1:2"
              className="mt-2 w-full rounded-xl border border-border bg-card/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>
    </Panel>
  );
}
