import { useAuth } from "@/lib/auth-context";
import { Panel } from "@/components/app/ui-kit";
import { Toggle } from "./Toggle";

export function SettingsNotifications() {
  const { userSettings, updateUserSettings } = useAuth();
  if (!userSettings) return null;

  return (
    <Panel title="Notifications">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Daily Summary</p>
            <p className="text-xs text-muted-foreground">
              Receive a daily summary of your trading activity.
            </p>
          </div>
          <Toggle
            on={userSettings.daily_summary}
            onChange={(v) => updateUserSettings({ daily_summary: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Weekly Report</p>
            <p className="text-xs text-muted-foreground">
              Comprehensive Sunday performance report.
            </p>
          </div>
          <Toggle
            on={userSettings.weekly_report}
            onChange={(v) => updateUserSettings({ weekly_report: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">AI Coach Alerts</p>
            <p className="text-xs text-muted-foreground">
              Instant alerts when you break your rules.
            </p>
          </div>
          <Toggle
            on={userSettings.ai_coach_alerts}
            onChange={(v) => updateUserSettings({ ai_coach_alerts: v })}
          />
        </div>
      </div>
    </Panel>
  );
}
