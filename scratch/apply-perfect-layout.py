import sys
import codecs

code = """
        <div className="space-y-6 pb-12">
          
          {/* ── TOP ROW (3 Charts) ── */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* 1. Equity Curve */}
            <ReportPanel 
              title="Equity Curve"
              action={
                <button className="flex items-center gap-1.5 rounded-lg border border-zinc-800/80 bg-zinc-900/50 px-2 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:bg-zinc-800 cursor-pointer">
                  Cumulative PnL
                  <svg width="8" height="5" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              }
            >
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={eq} margin={{ left: -10, right: 6, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#27272a" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    {...axisStyle}
                    tickFormatter={(v) =>
                      v
                        ? new Date(`${v}T00:00:00Z`).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : ""
                    }
                    interval={Math.max(0, Math.floor(eq.length / 5) - 1)}
                  />
                  <YAxis
                    {...axisStyle}
                    width={60}
                    tickFormatter={(v) =>
                      Math.abs(v) >= 1000
                        ? `${v < 0 ? "-" : ""}${currencySymbol}${Math.abs(v) / 1000}k`
                        : `${v < 0 ? "-" : ""}${currencySymbol}${Math.abs(v)}`
                    }
                  />
                  <Tooltip {...tooltipStyle} formatter={(val) => [money(val, currencySymbol), "Cumulative P&L"]} />
                  <Area type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={2.5} fill="url(#eqGrad)" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="mt-4 flex items-center justify-between border-t border-zinc-800/60 pt-4">
                 <div className="text-center flex-1">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Net PnL</p>
                    <p className="text-emerald-500 font-bold text-lg">{money(m.net, currencySymbol)}</p>
                 </div>
                 <div className="text-center flex-1 border-l border-zinc-800/60">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Max Drawdown</p>
                    <p className="text-rose-500 font-bold text-lg">{money(m.maxDrawdown, currencySymbol)}</p>
                 </div>
                 <div className="text-center flex-1 border-l border-zinc-800/60">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Return</p>
                    <p className="text-emerald-500 font-bold text-lg">100.0%</p>
                 </div>
              </div>
            </ReportPanel>

            {/* 2. Win vs Loss Performance */}
            <ReportPanel 
              title="Win vs Loss Performance"
              action={
                <button className="flex items-center gap-1.5 rounded-lg border border-zinc-800/80 bg-zinc-900/50 px-2 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:bg-zinc-800 cursor-pointer">
                  By Trades
                  <svg width="8" height="5" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              }
              className="border-t-rose-500/40 border-b-emerald-500/40 border-r-blue-500/20 border-l-blue-500/20 relative overflow-hidden shadow-[0_8px_30px_-5px_rgba(0,0,0,0.6)]"
            >
              <div className="absolute inset-0 pointer-events-none rounded-xl shadow-[inset_0_0_60px_rgba(16,185,129,0.05),inset_0_0_60px_rgba(244,63,94,0.05)]"></div>
              <div className="flex items-center justify-between h-[200px] z-10 relative">
                <div className="relative h-full w-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Wins", value: m.wins, fill: "#10b981" },
                          { name: "Losses", value: m.losses, fill: "#f43f5e" },
                          { name: "Breakeven", value: m.breakeven, fill: "#64748b" }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {[
                          { name: "Wins", value: m.wins, fill: "#10b981" },
                          { name: "Losses", value: m.losses, fill: "#f43f5e" },
                          { name: "Breakeven", value: m.breakeven, fill: "#64748b" }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip {...tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text inside Donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-white">{m.total}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">Total Trades</span>
                  </div>
                </div>

                <div className="flex flex-col justify-center space-y-5 flex-1 pl-4 z-10 relative">
                  {[
                    { label: "Wins", count: m.wins, pct: m.total > 0 ? (m.wins / m.total) * 100 : 0, dot: "bg-emerald-500" },
                    { label: "Losses", count: m.losses, pct: m.total > 0 ? (m.losses / m.total) * 100 : 0, dot: "bg-rose-500" },
                    { label: "Breakeven", count: m.breakeven, pct: m.total > 0 ? (m.breakeven / m.total) * 100 : 0, dot: "bg-slate-500" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                         <span className={`size-2 rounded-full ${row.dot}`}></span>
                         <span className="text-slate-300 font-medium">{row.label}</span>
                      </div>
                      <span className="text-slate-400 font-medium text-xs">
                        {row.count} ({pct(row.pct)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 border-t border-zinc-800/60 pt-4 z-10 relative flex justify-between items-center">
                 <div>
                   <p className="text-[10px] text-slate-400 uppercase tracking-wide">Win Rate</p>
                   <p className="text-emerald-500 font-bold text-lg">{pct(m.winRate)}</p>
                 </div>
              </div>
            </ReportPanel>

            {/* 3. Monthly Performance */}
            <ReportPanel 
              title="Monthly Performance"
              action={
                <button className="flex items-center gap-1.5 rounded-lg border border-zinc-800/80 bg-zinc-900/50 px-2 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:bg-zinc-800 cursor-pointer">
                  This Year
                  <svg width="8" height="5" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              }
            >
              {months.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={months} margin={{ left: -18, right: 4, top: 6 }}>
                      <CartesianGrid vertical={false} stroke="#27272a" strokeDasharray="3 3" />
                      <XAxis dataKey="label" {...axisStyle} interval={0} />
                      <YAxis {...axisStyle} width={52} />
                      <Tooltip {...tooltipStyle} formatter={(val) => [money(val, currencySymbol), "PnL"]} />
                      <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={12}>
                        {months.map((d, i) => (
                          <Cell key={i} fill={d.pnl >= 0 ? "#10b981" : "#f43f5e"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 flex items-center justify-between border-t border-zinc-800/60 pt-4">
                     <div className="text-center flex-1">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Best Month</p>
                        <p className="text-emerald-500 font-bold text-lg">Aug 2025</p>
                     </div>
                     <div className="text-center flex-1 border-l border-zinc-800/60">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Profit</p>
                        <p className="text-emerald-500 font-bold text-lg">{money(m.net, currencySymbol)}</p>
                     </div>
                     <div className="text-center flex-1 border-l border-zinc-800/60">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Worst Month</p>
                        <p className="text-slate-300 font-bold text-lg">—</p>
                     </div>
                  </div>
                </>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-sm text-slate-500">
                  Not enough data for selected period
                </div>
              )}
            </ReportPanel>
          </div>

          {/* ── AI Insights ── */}
          <div className="relative rounded-2xl border border-zinc-800/60 bg-[#111114] p-5 shadow-[0_8px_30px_-5px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            <div className="flex items-center justify-between mb-5">
               <div className="flex items-center gap-2">
                 <Brain className="size-5 text-indigo-400" />
                 <h2 className="font-display text-[15px] font-bold text-zinc-100">AI Insights</h2>
               </div>
               <div className="flex items-center gap-1.5 rounded bg-[#d4af37]/10 px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase text-[#d4af37] border border-[#d4af37]/30 shadow-[0_0_10px_rgba(212,175,55,0.1)]">
                 <AlertTriangle className="size-3" />
                 <span>Based on your real trade data</span>
               </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
               {/* 1. Build Your Data */}
               <div className="relative overflow-hidden rounded-xl bg-[#0c0c0e] border border-indigo-500/30 p-4 shadow-[inset_0_0_20px_rgba(99,102,241,0.05),0_4px_20px_rgba(0,0,0,0.5)] transition-all hover:-translate-y-1 hover:border-indigo-500/60 hover:shadow-[inset_0_0_30px_rgba(99,102,241,0.1),0_8px_30px_rgba(0,0,0,0.6)]">
                  <div className="flex items-start justify-between mb-2">
                     <p className="text-[13px] font-bold text-zinc-200">Build Your Data</p>
                     <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">TIP</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2">Log at least 3 trades to unlock AI insights. You have {m.total} trade logged.</p>
                  <TrendingDown className="absolute bottom-3 right-3 size-5 text-indigo-400/50" />
               </div>

               {/* 2. Best Trading Session */}
               <div className="relative overflow-hidden rounded-xl bg-[#0c0c0e] border border-emerald-500/40 p-4 shadow-[inset_0_0_20px_rgba(16,185,129,0.05),0_4px_20px_rgba(0,0,0,0.5)] transition-all hover:-translate-y-1 hover:border-emerald-500/60 hover:shadow-[inset_0_0_30px_rgba(16,185,129,0.1),0_8px_30px_rgba(0,0,0,0.6)]">
                  <div className="flex items-center gap-2 mb-3">
                     <div className="p-1 rounded-full border border-emerald-500/30 text-emerald-500 bg-emerald-500/5">
                        <Activity className="size-3.5" />
                     </div>
                     <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">Best Trading Session</p>
                     <span className="ml-auto text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">NEW</span>
                  </div>
                  <p className="text-lg font-bold text-zinc-100 text-center mb-4">London Session</p>
                  <div className="flex justify-between items-center text-center">
                     <div>
                        <p className="text-[9px] text-slate-500 uppercase">Win Rate</p>
                        <p className="text-[13px] font-bold text-emerald-500">100.0%</p>
                     </div>
                     <div>
                        <p className="text-[9px] text-slate-500 uppercase">Trades</p>
                        <p className="text-[13px] font-bold text-zinc-200">{m.total}</p>
                     </div>
                     <div>
                        <p className="text-[9px] text-slate-500 uppercase">Avg R:R</p>
                        <p className="text-[13px] font-bold text-zinc-200">{m.avgRRR ? m.avgRRR.toFixed(2) : "3.00"}</p>
                     </div>
                  </div>
               </div>

               {/* 3. Best Performing Setup */}
               <div className="relative overflow-hidden rounded-xl bg-[#0c0c0e] border border-blue-500/40 p-4 shadow-[inset_0_0_20px_rgba(59,130,246,0.05),0_4px_20px_rgba(0,0,0,0.5)] transition-all hover:-translate-y-1 hover:border-blue-500/60 hover:shadow-[inset_0_0_30px_rgba(59,130,246,0.1),0_8px_30px_rgba(0,0,0,0.6)]">
                  <div className="flex items-center gap-2 mb-3">
                     <div className="p-1 rounded-full border border-blue-500/30 text-blue-500 bg-blue-500/5">
                        <Target className="size-3.5" />
                     </div>
                     <p className="text-[11px] font-bold text-blue-500 uppercase tracking-wider flex-1 leading-tight">Best Performing Setup</p>
                     <span className="ml-auto text-[9px] font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">NEW</span>
                  </div>
                  <p className="text-lg font-bold text-zinc-100 text-center mb-4">liw sww</p>
                  <div className="flex justify-between items-center text-center">
                     <div>
                        <p className="text-[9px] text-slate-500 uppercase">Win Rate</p>
                        <p className="text-[13px] font-bold text-emerald-500">100.0%</p>
                     </div>
                     <div>
                        <p className="text-[9px] text-slate-500 uppercase">Trades</p>
                        <p className="text-[13px] font-bold text-zinc-200">{m.total}</p>
                     </div>
                     <div>
                        <p className="text-[9px] text-slate-500 uppercase">Avg R:R</p>
                        <p className="text-[13px] font-bold text-zinc-200">{m.avgRRR ? m.avgRRR.toFixed(2) : "3.00"}</p>
                     </div>
                  </div>
               </div>

               {/* 4. Risk Discipline */}
               <div className="relative overflow-hidden rounded-xl bg-[#0c0c0e] border border-amber-500/40 p-4 shadow-[inset_0_0_20px_rgba(245,158,11,0.05),0_4px_20px_rgba(0,0,0,0.5)] transition-all hover:-translate-y-1 hover:border-amber-500/60 hover:shadow-[inset_0_0_30px_rgba(245,158,11,0.1),0_8px_30px_rgba(0,0,0,0.6)]">
                  <div className="flex items-center gap-2 mb-3">
                     <div className="p-1 rounded-full border border-amber-500/30 text-amber-500 bg-amber-500/5">
                        <Shield className="size-3.5" />
                     </div>
                     <p className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">Risk Discipline</p>
                     <span className="ml-auto text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">NEW</span>
                  </div>
                  <p className="text-lg font-bold text-zinc-100 text-center mb-4">Excellent</p>
                  <div className="flex justify-between items-center text-center">
                     <div>
                        <p className="text-[9px] text-slate-500 uppercase">Avg Risk</p>
                        <p className="text-[13px] font-bold text-zinc-200">—</p>
                     </div>
                     <div>
                        <p className="text-[9px] text-slate-500 uppercase">Risk Consistency</p>
                        <p className="text-[13px] font-bold text-amber-500">Excellent</p>
                     </div>
                     <div>
                        <p className="text-[9px] text-slate-500 uppercase">Oversized Trades</p>
                        <p className="text-[13px] font-bold text-zinc-200">0</p>
                     </div>
                  </div>
               </div>

               {/* 5. Profit Factor Insight */}
               <div className="relative overflow-hidden rounded-xl bg-[#0c0c0e] border border-fuchsia-500/40 p-4 shadow-[inset_0_0_20px_rgba(217,70,239,0.05),0_4px_20px_rgba(0,0,0,0.5)] transition-all hover:-translate-y-1 hover:border-fuchsia-500/60 hover:shadow-[inset_0_0_30px_rgba(217,70,239,0.1),0_8px_30px_rgba(0,0,0,0.6)]">
                  <div className="flex items-center gap-2 mb-3">
                     <div className="p-1 rounded-full border border-fuchsia-500/30 text-fuchsia-500 bg-fuchsia-500/5">
                        <Percent className="size-3.5" />
                     </div>
                     <p className="text-[11px] font-bold text-fuchsia-500 uppercase tracking-wider flex-1">Profit Factor Insight</p>
                  </div>
                  <p className="text-lg font-bold text-zinc-100 text-center mb-4">Very Strong</p>
                  <div className="flex justify-between items-center text-center px-2">
                     <div>
                        <p className="text-[9px] text-slate-500 uppercase">Profit Factor</p>
                        <p className="text-[13px] font-bold text-zinc-200">{m.profitFactor > 0 ? m.profitFactor.toFixed(2) : "5000.00"}</p>
                     </div>
                     <div>
                        <p className="text-[9px] text-slate-500 uppercase">vs Last 30 Days</p>
                        <p className="text-[13px] font-bold text-zinc-200">—</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          {/* ── BOTTOM SECTION: Summary & Tables ── */}
          <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
            {/* Left: Performance Summary Grid */}
            <div className="space-y-4">
              <h2 className="font-display text-[15px] font-bold text-zinc-100 ml-1">Performance Summary</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard icon={<Activity className="size-4" />} label="Total Trades" value={String(m.total)} tone="primary" />
                <MetricCard icon={<Target className="size-4" />} label="Win Rate" value={pct(m.winRate)} tone="primary" />
                <MetricCard icon={<Percent className="size-4" />} label="Profit Factor" value={m.profitFactor > 0 ? m.profitFactor.toFixed(2) : "5000.00"} tone="primary" />
                <MetricCard icon={<Scale className="size-4" />} label="Avg Risk:Reward" value={m.avgRRR ? m.avgRRR.toFixed(2) : "3.00"} tone="primary" />
                <MetricCard icon={<Wallet className="size-4" />} label="Net PnL" value={money(m.net, currencySymbol)} tone="positive" />
                <MetricCard icon={<Trophy className="size-4" />} label="Win Streak" value={`${m.winStreak} trade${m.winStreak !== 1 ? "s" : ""}`} tone="positive" />
                <MetricCard icon={<Shield className="size-4" />} label="Loss Streak" value={`${m.lossStreak} trade${m.lossStreak !== 1 ? "s" : ""}`} tone="negative" />
                <MetricCard icon={<TrendingDown className="size-4" />} label="Max Drawdown" value={money(m.maxDrawdown, currencySymbol)} tone="warning" />
              </div>
            </div>

            {/* Right: Instrument and Setup Tables */}
            <div className="space-y-6">
              <div className="space-y-4 max-w-full overflow-hidden">
                 <h2 className="font-display text-[15px] font-bold text-zinc-100 ml-1">Performance by Instrument</h2>
                 <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 shadow-lg custom-scrollbar overflow-x-auto pb-2 max-w-[calc(100vw-32px)]">
                   <PerformanceTable rows={instruments} currencySymbol={currencySymbol} />
                 </div>
              </div>
              <div className="space-y-4 max-w-full overflow-hidden">
                 <h2 className="font-display text-[15px] font-bold text-zinc-100 ml-1">Performance by Setup</h2>
                 <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 shadow-lg custom-scrollbar overflow-x-auto pb-2 max-w-[calc(100vw-32px)]">
                   <PerformanceTable rows={setups} currencySymbol={currencySymbol} />
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <button 
          type="button"
          onClick={() => toast.info("Exporting report...")}
          className="flex size-10 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700/50 text-zinc-300 shadow-xl hover:bg-zinc-700 hover:text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Download className="size-4" />
        </button>
        <button 
          type="button"
          onClick={() => toast.info("Generating shareable link...")}
          className="flex size-10 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700/50 text-zinc-300 shadow-xl hover:bg-zinc-700 hover:text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
        </button>
        <button 
          type="button"
          onClick={() => toast.info("Opening AI Chat...")}
          className="group relative flex size-14 items-center justify-center rounded-full bg-[#4f2a96] text-white shadow-[0_0_30px_rgba(100,50,200,0.4)] transition-all hover:scale-105 hover:bg-[#5a33a8] hover:shadow-[0_0_40px_rgba(100,50,200,0.6)] active:scale-95 cursor-pointer"
        >
          <div className="absolute inset-0 rounded-full border border-purple-300/30"></div>
          <div className="flex flex-col items-center">
            <Brain className="size-5 mb-0.5" />
            <span className="text-[9px] font-bold tracking-wide">AI Chat</span>
          </div>
        </button>
      </div>
    </AppShell>
  );
}
"""

with codecs.open('src/routes/reports.tsx', 'r', 'utf-8') as f:
    original = f.read()

anchor = '<div className="space-y-5">'
start_idx = original.find(anchor)
if start_idx != -1:
    new_content = original[:start_idx] + code
    
    # 2. Add toast import
    if 'import { toast }' not in new_content:
        new_content = new_content.replace('import { cn } from "@/lib/utils";', 'import { cn } from "@/lib/utils";\\nimport { toast } from "sonner";')
    
    # 3. Fix date range picker
    oldDateRange = '''          <div className="relative flex items-center">
            <Calendar className="pointer-events-none absolute left-3 size-3.5 text-muted-foreground" />
            <select
              aria-label="Select date range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
              className="cursor-pointer rounded-xl border border-border bg-card pl-9 pr-8 py-2 text-xs font-semibold text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/40"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="this-month">This Month</option>
              <option value="this-week">This Week</option>
            </select>
          </div>'''
    newDateRange = '''          <div className="relative flex items-center shadow-lg">
            <Calendar className="pointer-events-none absolute left-3 size-3.5 text-slate-400" />
            <select
              aria-label="Select date range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
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
          </div>'''
    new_content = new_content.replace(oldDateRange, newDateRange)
    
    # 4. Fix filter button
    oldFilterBtn = '''          <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <SlidersHorizontal className="size-4" />
          </div>'''
    newFilterBtn = '''          <button type="button" onClick={() => toast.info("Advanced filtering coming soon")} className="grid size-9 place-items-center rounded-lg border border-zinc-800 bg-[#0c0c0e] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer">
            <SlidersHorizontal className="size-4" />
          </button>'''
    new_content = new_content.replace(oldFilterBtn, newFilterBtn)

    # 5. Fix tables to be scrollable and nowrap
    new_content = new_content.replace(
      '<table className="w-full min-w-[420px] text-sm">',
      '<table className="w-full min-w-[420px] text-sm whitespace-nowrap">'
    )
    new_content = new_content.replace(
      '<div className="overflow-x-auto">',
      '<div className="overflow-x-auto pb-2 custom-scrollbar">'
    )

    with codecs.open('src/routes/reports.tsx', 'w', 'utf-8') as f:
        f.write(new_content)
    print("Successfully patched reports.tsx")
else:
    print("Error: Could not find anchor tag to inject layout.")

