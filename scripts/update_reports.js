import * as fs from "fs";

const file = "src/routes/reports.tsx";
let code = fs.readFileSync(file, "utf8");

// 1. Tooltip and Axis Styles
code = code.replace(
  /const tooltipStyle = \{([\s\S]*?)\} as const;/,
  `const tooltipStyle = {
  contentStyle: {
    background: "#09090b",
    border: "1px solid #27272a",
    borderRadius: 8,
    fontSize: 12,
    color: "#f4f4f5",
    boxShadow: "0 10px 30px -10px rgba(0,0,0,0.8)",
  },
  labelStyle: { color: "#a1a1aa", marginBottom: 4 },
  itemStyle: { color: "#f4f4f5" },
} as const;`
);

code = code.replace(
  /const axisStyle = \{([\s\S]*?)\} as const;/,
  `const axisStyle = {
  stroke: "#71717a",
  fill: "#71717a",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;`
);

// 2. Add ReportPanel
const reportPanelCode = `
function ReportPanel({ title, action, children, className }: any) {
  return (
    <div className={cn("rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-zinc-700", className)}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-zinc-100">{title}</h2>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}

function MetricCard({`;
code = code.replace("function MetricCard({", reportPanelCode);

// 3. MetricCard
code = code.replace(
  /function MetricCard\(\{([\s\S]*?)\}\) \{([\s\S]*?)return \([\s\S]*?<\p>[\s\S]*?<\/div>\s*\);\s*\}/,
  `function MetricCard({
  icon,
  label,
  value,
  sub,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string | undefined;
  tone?: "positive" | "negative" | "neutral" | "primary" | "warning" | undefined;
}) {
  const toneText = {
    positive: "text-emerald-500",
    negative: "text-rose-500",
    neutral: "text-zinc-200",
    primary: "text-blue-500",
    warning: "text-amber-500",
  }[tone];

  const iconBg = {
    positive: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    negative: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    neutral: "bg-zinc-800 text-slate-400 border-zinc-700",
    primary: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  }[tone];

  return (
    <div className="group relative overflow-hidden rounded-xl bg-zinc-950 border border-zinc-800 p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-zinc-700">
      <div className="pointer-events-none absolute -right-8 -top-8 size-20 rounded-full bg-blue-500/0 blur-2xl transition-all duration-700 group-hover:bg-blue-500/5" />
      <div className="relative z-10 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <div className={cn("grid size-8 shrink-0 place-items-center rounded-lg border", iconBg)}>{icon}</div>
      </div>
      <p className={cn("relative z-10 mt-4 font-display text-2xl font-bold tracking-tight", toneText)}>{value}</p>
      {sub && <p className="relative z-10 mt-1 text-[11px] font-medium text-slate-500">{sub}</p>}
    </div>
  );
}`
);

// 4. PerformanceTable
code = code.replace(
  /function PerformanceTable\(\{([\s\S]*?)\}\) \{([\s\S]*?)return \([\s\S]*?<\/div>\s*\);\s*\}/,
  `function PerformanceTable({
  rows,
  currencySymbol,
}: {
  rows: { name: string; trades: number; winRate: number; pnl: number; avgRRR: number }[];
  currencySymbol: string;
}) {
  if (rows.length === 0)
    return (
      <div className="flex h-32 items-center justify-center text-sm font-medium text-slate-500">
        Not enough data available
      </div>
    );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <th className="pb-3 pl-1 font-semibold">Name</th>
            <th className="pb-3 font-semibold">Trades</th>
            <th className="pb-3 font-semibold">Win Rate</th>
            <th className="pb-3 font-semibold">Avg RRR</th>
            <th className="pb-3 pr-1 text-right font-semibold">Net PnL</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60">
          {rows.map((row) => (
            <tr key={row.name} className="group transition-colors hover:bg-zinc-900">
              <td className="py-3 pl-1 font-semibold text-zinc-200">{row.name}</td>
              <td className="py-3 text-slate-400">{row.trades}</td>
              <td className="py-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold",
                    row.winRate >= 60
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : row.winRate >= 40
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        : "bg-rose-500/10 text-rose-500 border border-rose-500/20",
                  )}
                >
                  {pct(row.winRate)}
                </span>
              </td>
              <td className="py-3 text-slate-400 font-medium">1:{row.avgRRR.toFixed(2)}</td>
              <td
                className={cn(
                  "py-3 pr-1 text-right font-bold",
                  row.pnl >= 0 ? "text-emerald-500" : "text-rose-500",
                )}
              >
                {money(row.pnl, currencySymbol)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}`
);

// 5. insightConfig
code = code.replace(
  /const insightConfig = \{([\s\S]*?)\};/,
  `const insightConfig = {
  strength: {
    icon: <CheckCircle2 className="size-4" />,
    bg: "bg-zinc-900 border-emerald-500/20",
    iconColor: "text-emerald-500",
    label: "Strength",
    labelColor: "text-emerald-500",
  },
  opportunity: {
    icon: <Lightbulb className="size-4" />,
    bg: "bg-zinc-900 border-blue-500/20",
    iconColor: "text-blue-500",
    label: "Opportunity",
    labelColor: "text-blue-500",
  },
  warning: {
    icon: <AlertTriangle className="size-4" />,
    bg: "bg-zinc-900 border-amber-500/20",
    iconColor: "text-amber-500",
    label: "Watch Out",
    labelColor: "text-amber-500",
  },
  tip: {
    icon: <Zap className="size-4" />,
    bg: "bg-zinc-900 border-indigo-500/20",
    iconColor: "text-indigo-400",
    label: "Tip",
    labelColor: "text-indigo-400",
  },
};`
);

// 6. Skeleton
code = code.replace(
  /function Skeleton\(\{ className \}: \{ className\?: string \}\) \{\s*return <div className=\{cn\("animate-pulse rounded-2xl bg-muted\/30", className\)\} \/>;\s*\}/,
  `function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-zinc-900 border border-zinc-800", className)} />;
}`
);

// 7. Panel to ReportPanel globally in the JSX section
// Only replace Panel components (not the import yet)
code = code.replace(/<Panel/g, "<ReportPanel");
code = code.replace(/<\/Panel>/g, "</ReportPanel>");

// 8. Replace empty states / loading states
code = code.replace(
  /className="grid size-16 place-items-center rounded-2xl border border-border bg-card\/60 shadow-lg"/,
  `className="grid size-16 place-items-center rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl"`
);
code = code.replace(/text-muted-foreground\/60/, "text-zinc-600");
code = code.replace(/text-muted-foreground\/30/, "text-zinc-700");
code = code.replace(/text-lg font-semibold/g, "text-lg font-bold text-zinc-100");

// 9. Top Bar: Date Filter & Export
code = code.replace(
  /className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border\/60 bg-card\/80 px-4 py-3 shadow-sm backdrop-blur-md"/,
  `className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-4 shadow-lg transition-all"`
);
code = code.replace(
  /className="grid size-8 place-items-center rounded-xl bg-primary\/10 text-primary border border-primary\/20"/,
  `className="grid size-9 place-items-center rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20"`
);
code = code.replace(
  /className="text-xs font-bold text-foreground"/,
  `className="text-xs font-bold text-zinc-100 uppercase tracking-wide"`
);
code = code.replace(
  /className="text-\[11px\] font-medium text-muted-foreground"/,
  `className="text-[11px] font-medium text-slate-400 mt-0.5"`
);
code = code.replace(/text-muted-foreground"/g, `text-slate-400"`); // broad replacement for text-muted-foreground
code = code.replace(/text-foreground"/g, `text-zinc-200"`); 

// The select tag
code = code.replace(
  /className="cursor-pointer rounded-xl border border-border bg-card pl-9 pr-8 py-2 text-xs font-semibold text-zinc-200 outline-none transition focus:border-primary focus:ring-1 focus:ring-primary\/40"/,
  `className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 pl-9 pr-8 py-2 text-xs font-semibold text-zinc-200 outline-none transition-all hover:border-zinc-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"`
);

// The export button
code = code.replace(
  /className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3\.5 py-2 text-xs font-semibold text-zinc-200 transition hover:border-primary\/50 hover:bg-muted\/30 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"/,
  `className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-200 shadow-sm transition-all hover:border-zinc-600 hover:bg-zinc-800 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"`
);
code = code.replace(/text-primary"/g, 'text-blue-500"'); // export icon and others

// 10. Recharts components inside Panels
// Equity Curve
code = code.replace(
  /stroke="var\(--color-primary\)"/g,
  `stroke="#3b82f6"`
);
code = code.replace(
  /stopColor="var\(--color-primary\)"/g,
  `stopColor="#3b82f6"`
);
code = code.replace(
  /strokeWidth=\{2\.6\}/,
  `strokeWidth={2.5}`
);
code = code.replace(/var\(--color-border\)/g, "#27272a");
code = code.replace(/var\(--color-success\)/g, "#10b981");
code = code.replace(/var\(--color-destructive\)/g, "#f43f5e");

// 11. P&L distribution
code = code.replace(
  /bar: "bg-muted-foreground\/60",\s*text: "text-slate-400",/g,
  `bar: "bg-slate-600",
                    text: "text-slate-400",`
);
code = code.replace(
  /className="h-2 w-full overflow-hidden rounded-full bg-muted\/40"/,
  `className="h-2 w-full overflow-hidden rounded-full bg-zinc-800"`
);

// PnL items loop
code = code.replace(/border-border\/50/g, "border-zinc-800");
code = code.replace(/border-border\/40/g, "border-zinc-800");
code = code.replace(/bg-muted\/20/g, "bg-zinc-900/40");
code = code.replace(/border-border\/30/g, "border-zinc-800");

// Performance Summary icons mapped properly. They had text-primary, which is now text-blue-500 due to earlier regex.
// Let's refine Performance Summary items background
code = code.replace(
  /className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900\/40 px-3\.5 py-3 transition hover:bg-muted\/30"/g,
  \`className="group flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3.5 transition-all hover:bg-zinc-800 hover:border-zinc-700"\`
);

// AI insights
code = code.replace(
  /className="flex items-center gap-1\.5 rounded-full border border-primary\/30 bg-primary\/10 px-3 py-1 text-\[11px\] font-semibold text-blue-500"/,
  \`className="flex items-center gap-1.5 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-3 py-1 text-[11px] font-bold tracking-wide uppercase text-[#d4af37]"\`
);

// We need to re-replace some string fragments safely
fs.writeFileSync(file, code);
console.log("Done");
