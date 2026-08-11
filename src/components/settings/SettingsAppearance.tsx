import { useAuth } from "@/lib/auth-context";
import { Panel } from "@/components/app/ui-kit";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { Toggle } from "./Toggle"; // Wait, I will need a common toggle. I'll just build a Toggle component.

const ACCENTS = [
  { name: "Neon Blue", value: "oklch(0.64 0.21 268)" },
  { name: "Violet", value: "oklch(0.62 0.24 305)" },
  { name: "Emerald", value: "oklch(0.72 0.19 155)" },
  { name: "Amber", value: "oklch(0.78 0.16 85)" },
  { name: "Rose", value: "oklch(0.65 0.23 15)" },
];

export function SettingsAppearance() {
  const { userSettings, updateUserSettings } = useAuth();
  if (!userSettings) return null;

  const isDark =
    userSettings.theme === "dark" ||
    (userSettings.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const setTheme = (dark: boolean) => {
    updateUserSettings({ theme: dark ? "dark" : "light" });
  };

  const applyAccent = (v: string) => {
    updateUserSettings({ accent_color: v });
  };

  const setCompact = (v: boolean) => {
    updateUserSettings({ compact_ui: v });
  };

  return (
    <Panel title="Appearance">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Theme</p>
          <p className="text-xs text-muted-foreground">Switch between dark and light mode</p>
        </div>
        <div className="flex rounded-xl border border-border p-1 bg-background/50">
          <button
            onClick={() => updateUserSettings({ theme: "dark" })}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all",
              userSettings.theme === "dark" ? "bg-primary/20 text-primary" : "hover:bg-muted",
            )}
          >
            <Moon className="size-3.5" /> Dark
          </button>
          <button
            onClick={() => updateUserSettings({ theme: "light" })}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all",
              userSettings.theme === "light" ? "bg-primary/20 text-primary" : "hover:bg-muted",
            )}
          >
            <Sun className="size-3.5" /> Light
          </button>
        </div>
      </div>
      <div className="mt-5">
        <p className="text-sm font-medium">Accent colour</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {ACCENTS.map((a) => (
            <button
              key={a.name}
              aria-label={a.name}
              onClick={() => applyAccent(a.value)}
              className={cn(
                "size-9 rounded-xl ring-offset-2 ring-offset-background transition",
                userSettings.accent_color === a.value && "ring-2 ring-foreground",
              )}
              style={{ background: a.value }}
            />
          ))}
          <button
            aria-label="Special Red Green Theme"
            onClick={() => applyAccent("special")}
            className={cn(
              "size-9 rounded-xl ring-offset-2 ring-offset-background transition relative overflow-hidden",
              userSettings.accent_color === "special" && "ring-2 ring-foreground",
            )}
            style={{
              background:
                "linear-gradient(135deg, oklch(0.62 0.28 25) 0%, oklch(0.75 0.22 150) 100%)",
            }}
          />
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Compact interface</p>
          <p className="text-xs text-muted-foreground">Reduce spacing in user-facing UI</p>
        </div>
        <Toggle on={userSettings.compact_ui} onChange={setCompact} />
      </div>
    </Panel>
  );
}
