import fs from 'fs';

const cssPath = 'src/styles.css';
let content = fs.readFileSync(cssPath, 'utf8');

// The new configuration and tokens
const newRootAndTheme = `
@theme inline {
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 24px;
  --radius-3xl: 32px;
  --radius-4xl: 40px;
  --color-background: var(--bg-base);
  --color-foreground: var(--text-primary);
  --color-card: var(--surface);
  --color-card-foreground: var(--text-primary);
  --color-popover: var(--surface);
  --color-popover-foreground: var(--text-primary);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--bg-secondary);
  --color-secondary-foreground: var(--text-primary);
  --color-muted: var(--bg-muted);
  --color-muted-foreground: var(--text-secondary);
  --color-accent: var(--bg-accent);
  --color-accent-foreground: var(--text-primary);
  --color-destructive: var(--danger);
  --color-destructive-foreground: #FFFFFF;
  --color-border: var(--border-subtle);
  --color-input: var(--border-subtle);
  --color-ring: var(--primary);
  
  /* Semantic */
  --color-success: var(--success);
  --color-success-bg: var(--success-bg);
  --color-danger: var(--danger);
  --color-danger-bg: var(--danger-bg);
  --color-ai: var(--ai);
  --color-ai-bg: var(--ai-bg);
  --color-info: var(--info);
  --color-info-bg: var(--info-bg);
  --color-warning: var(--warning);
  --color-warning-bg: var(--warning-bg);

  --color-chart-1: #0F1115;
  --color-chart-2: #6B7280;
  --color-chart-3: #9CA3AF;
  --color-chart-4: #D1D5DB;
  --color-chart-5: #E5E7EB;

  --color-sidebar: var(--surface-glass);
  --color-sidebar-foreground: var(--text-primary);
  --color-sidebar-primary: var(--primary);
  --color-sidebar-primary-foreground: var(--primary-foreground);
  --color-sidebar-accent: var(--bg-accent);
  --color-sidebar-accent-foreground: var(--text-primary);
  --color-sidebar-border: var(--border-subtle);
  --color-sidebar-ring: var(--primary);

  --font-display: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
}

:root {
  /* Core Design Tokens */
  --bg-base: #F7F8FA;
  --surface: #FFFFFF;
  --surface-glass: rgba(255,255,255,0.72);
  --border-subtle: rgba(15,17,21,0.06);
  --text-primary: #0F1115;
  --text-secondary: #6B7280;
  --text-tertiary: #9CA3AF;
  
  --bg-muted: #F3F4F6;
  --bg-secondary: #F9FAFB;
  --bg-accent: #F3F4F6;

  --primary: #0F1115;
  --primary-foreground: #FFFFFF;
  
  /* Semantic Tokens */
  --success: #16A34A;
  --success-bg: #F0FDF4;
  --danger: #DC2626;
  --danger-bg: #FEF2F2;
  --ai: #7C3AED;
  --ai-bg: #F5F3FF;
  --info: #2563EB;
  --info-bg: #EFF6FF;
  --warning: #D97706;
  --warning-bg: #FFFBEB;
}

@utility elevation-1 {
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 2px rgba(15,17,21,0.04), 0 2px 8px rgba(15,17,21,0.04);
}

@utility elevation-2 {
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 2px 4px rgba(15,17,21,0.05), 0 12px 24px rgba(15,17,21,0.08);
}

@utility elevation-glow-success {
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 2px 4px rgba(15,17,21,0.05), 0 12px 24px rgba(15,17,21,0.08), 0 0 32px rgba(22,163,74,0.12);
}

@utility elevation-glow-danger {
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 2px 4px rgba(15,17,21,0.05), 0 12px 24px rgba(15,17,21,0.08), 0 0 32px rgba(220,38,38,0.12);
}

@utility elevation-glow-ai {
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 2px 4px rgba(15,17,21,0.05), 0 12px 24px rgba(15,17,21,0.08), 0 0 32px rgba(124,58,237,0.15);
}

@utility elevation-modal {
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 16px rgba(15,17,21,0.08), 0 24px 48px rgba(15,17,21,0.14);
}

@utility surface-glass {
  background-color: var(--surface-glass);
  backdrop-filter: blur(24px);
}
`;

const themeMatch = content.match(/@theme inline \{[\s\S]*?\}/);
const rootMatch = content.match(/:root \{[\s\S]*?\}/);

if (themeMatch && rootMatch) {
  // Replace the old @theme inline and :root with the new ones.
  // We'll replace everything from @theme inline up to the end of :root.
  content = content.replace(/@theme inline \{[\s\S]*?\}/, "");
  content = content.replace(/:root \{[\s\S]*?\}/, newRootAndTheme);
  
  // Also we should ensure body gradient is set properly. Let's find body rule.
  const bodyRuleRegex = /body \{[\s\S]*?background-image:[\s\S]*?\}/g;
  content = content.replace(bodyRuleRegex, \`body {
    background-color: var(--bg-base);
    background-image: radial-gradient(circle at top left, #FFFFFF 0%, transparent 40%), radial-gradient(circle at bottom right, #F1F3F6 0%, transparent 40%);
    background-attachment: fixed;
    color: var(--text-primary);
  }\`);
  
  fs.writeFileSync(cssPath, content);
  console.log("Successfully updated styles.css");
} else {
  console.log("Failed to find @theme inline or :root");
}
