import { useAuth } from "@/lib/auth-context";
import { Panel } from "@/components/app/ui-kit";

export function SettingsAI() {
  const { userSettings, updateUserSettings } = useAuth();
  if (!userSettings) return null;

  return (
    <Panel title="AI & Experience">
      <div>
        <label className="text-sm font-medium">AI Response Style</label>
        <p className="mb-2 text-xs text-muted-foreground">
          Adjust how the AI Coach responds to your queries.
        </p>
        <select
          value={userSettings.ai_response_style}
          onChange={(e) => updateUserSettings({ ai_response_style: e.target.value as any })}
          className="w-full rounded-xl border border-border bg-card/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          {["Concise", "Balanced", "Detailed"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </Panel>
  );
}
