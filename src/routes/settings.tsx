import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { SettingsAppearance } from "@/components/settings/SettingsAppearance";
import { SettingsTradingPreferences } from "@/components/settings/SettingsTradingPreferences";
import { SettingsNotifications } from "@/components/settings/SettingsNotifications";
import { SettingsAI } from "@/components/settings/SettingsAI";
import { SettingsData } from "@/components/settings/SettingsData";
import { SettingsAccount } from "@/components/settings/SettingsAccount";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Edge Journal" },
      { name: "description", content: "Manage your Edge Journal experience." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { userSettings, isLoading } = useAuth();

  return (
    <AppShell title="Settings" subtitle="Manage your Edge Journal experience">
      {isLoading || !userSettings ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </div>
      ) : (
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-6">
              <SettingsAppearance />
              <SettingsTradingPreferences />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <SettingsData />
              <SettingsAccount />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
