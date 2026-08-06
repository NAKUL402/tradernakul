// Dynamic Multi-Theme Engine for TraderNakul AI Ecosystem

export type ThemePreset = {
  id: string;
  name: string;
  description: string;
  primary: string; // OKLCH color string
  accent: string;
  background: string;
  card: string;
  border: string;
  previewGradient: string;
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "cyberpunk-purple",
    name: "🌌 Cyberpunk Purple (Default)",
    description: "Vibrant neon purple and electric magenta dark theme",
    primary: "0.55 0.25 285",
    accent: "0.68 0.24 330",
    background: "0.1 0.03 270",
    card: "0.15 0.04 270",
    border: "0.22 0.05 270",
    previewGradient: "from-[#6366f1] to-[#ec4899]",
  },
  {
    id: "midnight-emerald",
    name: "🟢 Midnight Emerald",
    description: "Sleek dark emerald green and gold trader aesthetic",
    primary: "0.62 0.22 155",
    accent: "0.75 0.18 85",
    background: "0.1 0.03 160",
    card: "0.15 0.04 160",
    border: "0.22 0.05 160",
    previewGradient: "from-[#10b981] to-[#f59e0b]",
  },
  {
    id: "ocean-sapphire",
    name: "🌊 Ocean Sapphire",
    description: "Deep sapphire blue and luminous cyan analytical layout",
    primary: "0.58 0.22 245",
    accent: "0.72 0.2 195",
    background: "0.1 0.03 240",
    card: "0.15 0.04 240",
    border: "0.22 0.05 240",
    previewGradient: "from-[#3b82f6] to-[#06b6d4]",
  },
  {
    id: "sunset-neon",
    name: "🌅 Sunset Neon",
    description: "Fiery orange and crimson high-energy trading theme",
    primary: "0.65 0.24 35",
    accent: "0.7 0.25 350",
    background: "0.1 0.04 30",
    card: "0.15 0.05 30",
    border: "0.22 0.06 30",
    previewGradient: "from-[#f97316] to-[#f43f5e]",
  },
  {
    id: "imperial-gold",
    name: "👑 Imperial Gold",
    description: "Luxury black and rich gold premium trader suite",
    primary: "0.75 0.2 85",
    accent: "0.8 0.18 75",
    background: "0.08 0.02 80",
    card: "0.14 0.03 80",
    border: "0.22 0.05 80",
    previewGradient: "from-[#eab308] to-[#d97706]",
  },
  {
    id: "obsidian-matrix",
    name: "⚡ Obsidian Matrix",
    description: "Deep dark obsidian black with matrix green glowing accents",
    primary: "0.68 0.25 140",
    accent: "0.8 0.2 130",
    background: "0.07 0.01 140",
    card: "0.12 0.02 140",
    border: "0.2 0.04 140",
    previewGradient: "from-[#22c55e] to-[#84cc16]",
  },
  {
    id: "ice-platinum",
    name: "🧊 Ice Platinum",
    description: "Cool silver slate and icy blue crystal aesthetic",
    primary: "0.7 0.18 220",
    accent: "0.8 0.15 200",
    background: "0.12 0.02 220",
    card: "0.18 0.03 220",
    border: "0.25 0.04 220",
    previewGradient: "from-[#38bdf8] to-[#94a3b8]",
  },
];

export function applyThemePreset(themeId: string) {
  if (typeof window === "undefined") return;

  const preset = THEME_PRESETS.find((t) => t.id === themeId) || THEME_PRESETS[0]!;
  const root = document.documentElement;

  root.style.setProperty("--primary", `oklch(${preset.primary})`);
  root.style.setProperty("--accent", `oklch(${preset.accent})`);
  root.style.setProperty("--background", `oklch(${preset.background})`);
  root.style.setProperty("--card", `oklch(${preset.card})`);
  root.style.setProperty("--border", `oklch(${preset.border})`);

  localStorage.setItem("tradernakul_active_theme", preset.id);
}

export function initThemeEngine() {
  if (typeof window === "undefined") return;
  const savedTheme = localStorage.getItem("tradernakul_active_theme");
  if (savedTheme) {
    applyThemePreset(savedTheme);
  }
}
