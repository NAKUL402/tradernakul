const fs = require('fs');
let code = fs.readFileSync('src/routes/reports.tsx', 'utf-8');

// 0. Fix dead Filter button
code = code.replace(
  '<button className="grid size-9 place-items-center rounded-lg border border-zinc-800 bg-[#0c0c0e] text-zinc-400 hover:text-zinc-200 transition-colors">',
  '<button type="button" onClick={() => { if(typeof window !== "undefined" && window.toast) window.toast.info("Advanced filtering coming soon"); }} className="grid size-9 place-items-center rounded-lg border border-zinc-800 bg-[#0c0c0e] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer">'
);

// 1. Change grid-cols-2 to grid-cols-4 in Performance Summary
code = code.replace(
  '<div className="grid grid-cols-2 gap-3">',
  '<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">'
);

// 2. Add floating buttons
if (!code.includes('fixed bottom-6 right-6')) {
  const floatingButtons = `
      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <button 
          type="button"
          onClick={() => { if(typeof window !== "undefined" && window.toast) window.toast.info("Exporting report..."); }}
          className="flex size-10 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700/50 text-zinc-300 shadow-xl hover:bg-zinc-700 hover:text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Download className="size-4" />
        </button>
        <button 
          type="button"
          onClick={() => { if(typeof window !== "undefined" && window.toast) window.toast.info("Generating shareable link..."); }}
          className="flex size-10 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700/50 text-zinc-300 shadow-xl hover:bg-zinc-700 hover:text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
        </button>
        <button 
          type="button"
          onClick={() => { if(typeof window !== "undefined" && window.toast) window.toast.info("Opening AI Chat..."); }}
          className="group relative flex size-14 items-center justify-center rounded-full bg-[#4f2a96] text-white shadow-[0_0_30px_rgba(100,50,200,0.4)] transition-all hover:scale-105 hover:bg-[#5a33a8] hover:shadow-[0_0_40px_rgba(100,50,200,0.6)] active:scale-95 cursor-pointer"
        >
          <div className="absolute inset-0 rounded-full border border-purple-300/30"></div>
          <div className="flex flex-col items-center">
            <Brain className="size-5 mb-0.5" />
            <span className="text-[9px] font-bold tracking-wide">AI Chat</span>
          </div>
        </button>
      </div>
  `;
  code = code.replace(
    '    </AppShell>',
    floatingButtons + '\n    </AppShell>'
  );
}

// 3. Add dropdowns to ReportPanels
const eqDropdown = `action={
              <button className="flex items-center gap-1.5 rounded-lg border border-zinc-800/80 bg-zinc-900/50 px-2 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:bg-zinc-800 cursor-pointer">
                Cumulative PnL
                <svg width="8" height="5" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            }`;
code = code.replace('<ReportPanel title="Equity Curve">', \`<ReportPanel title="Equity Curve" \${eqDropdown}>\`);

const winLossDropdown = `action={
              <button className="flex items-center gap-1.5 rounded-lg border border-zinc-800/80 bg-zinc-900/50 px-2 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:bg-zinc-800 cursor-pointer">
                By Trades
                <svg width="8" height="5" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            }`;
code = code.replace(
  'title="Win vs Loss Performance"\\n              className="',
  \`title="Win vs Loss Performance"\\n              \${winLossDropdown}\\n              className="\`
);

const monthlyDropdown = `action={
              <button className="flex items-center gap-1.5 rounded-lg border border-zinc-800/80 bg-zinc-900/50 px-2 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:bg-zinc-800 cursor-pointer">
                This Year
                <svg width="8" height="5" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            }`;
code = code.replace('<ReportPanel title="Monthly Performance">', \`<ReportPanel title="Monthly Performance" \${monthlyDropdown}>\`);

// 4. Improve top bar date range styling to match reference image (dark pill, left icon, right chevron, etc.)
const oldDateRange = \`<div className="relative flex items-center">
            <Calendar className="pointer-events-none absolute left-3 size-3.5 text-slate-400" />
            <select
              aria-label="Select date range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="cursor-pointer rounded-lg border border-zinc-800 bg-[#0c0c0e] pl-9 pr-8 py-2.5 text-xs font-semibold text-zinc-200 outline-none transition-all hover:border-zinc-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 appearance-none"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="this-month">This Month</option>
              <option value="this-week">This Week</option>
            </select>
            <div className="pointer-events-none absolute right-3">
               <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M1 1L5 5L9 1" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
            </div>
          </div>\`;

const newDateRange = \`<div className="relative flex items-center shadow-lg">
            <Calendar className="pointer-events-none absolute left-3 size-3.5 text-slate-400" />
            <select
              aria-label="Select date range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="cursor-pointer rounded-full border border-zinc-700/80 bg-[#15151a] pl-9 pr-8 py-2 text-xs font-semibold text-zinc-200 outline-none transition-all hover:border-zinc-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 appearance-none shadow-md"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="this-month">This Month</option>
              <option value="this-week">This Week</option>
            </select>
            <div className="pointer-events-none absolute right-3">
               <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M1 1L5 5L9 1" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
            </div>
          </div>\`;

code = code.replace(oldDateRange, newDateRange);

// Add scrollbars styling to tables
const oldTable1 = \`<div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 shadow-lg overflow-hidden">
                   <PerformanceTable rows={instruments} currencySymbol={currencySymbol} />
                 </div>\`;
const newTable1 = \`<div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 shadow-lg overflow-hidden custom-scrollbar max-w-[calc(100vw-32px)]">
                   <PerformanceTable rows={instruments} currencySymbol={currencySymbol} />
                 </div>\`;
code = code.replace(oldTable1, newTable1);

const oldTable2 = \`<div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 shadow-lg overflow-hidden">
                   <PerformanceTable rows={setups} currencySymbol={currencySymbol} />
                 </div>\`;
const newTable2 = \`<div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 shadow-lg overflow-hidden custom-scrollbar max-w-[calc(100vw-32px)]">
                   <PerformanceTable rows={setups} currencySymbol={currencySymbol} />
                 </div>\`;
code = code.replace(oldTable2, newTable2);

// Add toast import if missing
if (!code.includes('import { toast }')) {
  code = code.replace('import { cn } from "@/lib/utils";', 'import { cn } from "@/lib/utils";\\nimport { toast } from "sonner";');
}
// Fix the window.toast hack by assigning it inside useEffect or just using toast directly since we imported it.
code = code.replace(/if\\(typeof window !== "undefined" && window\\.toast\\) window\\.toast/g, 'toast');

// Fix table nowrap
code = code.replace(
  '<table className="w-full min-w-[420px] text-sm">',
  '<table className="w-full min-w-[420px] text-sm whitespace-nowrap">'
);
code = code.replace(
  '<div className="overflow-x-auto">',
  '<div className="overflow-x-auto pb-2 custom-scrollbar">'
);

fs.writeFileSync('src/routes/reports.tsx', code);
console.log('Successfully updated reports.tsx');
