import { useAuth } from "@/lib/auth-context";
import { Panel } from "@/components/app/ui-kit";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { Toggle } from "./Toggle"; // Wait, I will need a common toggle. I'll just build a Toggle component.

const ACCENTS = [
  { name: "Navy Blue", value: "oklch(0.45 0.14 260)" },
  { name: "Premium Pink", value: "oklch(0.65 0.15 340)" },
  { name: "Deep Emerald", value: "oklch(0.60 0.12 150)" },
  { name: "Champagne Gold", value: "oklch(0.75 0.08 85)" },
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
        <div className="flex rounded-lg border border-border/50 p-1 bg-card/45">
          <button
            onClick={() => updateUserSettings({ theme: "dark" })}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150",
              userSettings.theme === "dark"
                ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                : "text-muted-foreground hover:bg-muted/30 border border-transparent",
            )}
          >
            <Moon className="size-3.5" /> Dark
          </button>
          <button
            onClick={() => updateUserSettings({ theme: "light" })}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150",
              userSettings.theme === "light"
                ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                : "text-muted-foreground hover:bg-muted/30 border border-transparent",
            )}
          >
            <Sun className="size-3.5" /> Light
          </button>
        </div>
      </div>
      <div className="mt-5 border-t border-border/40 pt-5">
        <p className="text-sm font-medium">Accent colour</p>
        <div className="mt-3 flex flex-wrap gap-4">
          {ACCENTS.map((a) => {
            const isSelected = userSettings.accent_color === a.value;
            return (
              <div key={a.name} className="relative group" style={{ perspective: "800px" }}>
                {/* Ambient Light from Back/Bottom */}
                <div 
                  className={cn(
                    "absolute inset-0 top-2 rounded-xl blur-[14px] transition-all duration-300 pointer-events-none",
                    isSelected 
                      ? "opacity-50 scale-110" 
                      : "opacity-0 scale-90 group-hover:opacity-60 group-hover:scale-110 group-hover:translate-y-2"
                  )}
                  style={{ background: a.value }}
                />
                
                {/* Base Surface / Physical Swatch */}
                <button
                  aria-label={a.name}
                  title={a.name}
                  onClick={() => applyAccent(a.value)}
                  className={cn(
                    "relative flex items-center justify-center size-12 rounded-[14px] transition-all duration-300 ease-out cursor-pointer",
                    isSelected 
                      ? "ring-2 ring-primary ring-offset-4 ring-offset-background scale-105 -translate-y-1 shadow-[0_8px_16px_rgba(0,0,0,0.4)] border-primary/50" 
                      : "shadow-[0_4px_8px_rgba(0,0,0,0.15)] border-border/40 hover:scale-[1.08] hover:-translate-y-1.5 hover:[transform:rotateX(10deg)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.35)] hover:border-white/30",
                    "border border-solid active:scale-95 active:translate-y-0 active:shadow-sm"
                  )}
                  style={{ 
                    background: a.value,
                    transformStyle: "preserve-3d"
                  }}
                >
                  {/* Inner Highlight / Glass Curve */}
                  <div className="absolute inset-0 rounded-[14px] bg-gradient-to-b from-white/15 to-transparent opacity-50 mix-blend-overlay pointer-events-none" />
                  
                  {/* Subtle Inner Shadow for Depth */}
                  <div className="absolute inset-0 rounded-[14px] shadow-[inset_0_2px_4px_rgba(255,255,255,0.15),inset_0_-2px_6px_rgba(0,0,0,0.25)] pointer-events-none" />

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="size-2.5 rounded-full bg-background shadow-[0_1px_3px_rgba(0,0,0,0.3)] animate-in zoom-in duration-300" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-5">
        <div>
          <p className="text-sm font-medium">Compact interface</p>
          <p className="text-xs text-muted-foreground">Reduce spacing in user-facing UI</p>
        </div>
        <Toggle on={userSettings.compact_ui} onChange={setCompact} />
      </div>
    </Panel>
  );
}
