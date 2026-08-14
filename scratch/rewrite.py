import sys
import codecs

code = """  const hasFilteredData = filteredTrades.length > 0;

  return (
    <AppShell title="Reports" subtitle="Performance overview & analytics">
      {/* -- Top Bar: Date Filter & Export -- */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div />
        
        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <Calendar className="pointer-events-none absolute left-3 size-3.5 text-slate-400" />
            <select
              aria-label="Select date range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 pl-9 pr-8 py-2.5 text-xs font-semibold text-zinc-200 outline-none transition-all hover:border-zinc-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 appearance-none"
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
          </div>
          <button className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-xs font-semibold text-zinc-200 hover:text-white transition-colors">
             <Download className="size-3.5" />
             Export
             <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1">
                 <path d="M1 1L5 5L9 1" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
          </button>
        </div>
      </div>

      {!hasFilteredData ? (
        <div className="flex h-[45vh] items-center justify-center text-center">
          <div className="flex flex-col items-center gap-4">
            <Activity className="size-12 text-zinc-700" />
            <p className="font-display text-lg font-bold text-zinc-200">No trades in selected period</p>
            <p className="max-w-xs text-xs text-slate-400">
              Try selecting a wider date range or add trades in the Journal to generate analytics.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* -- ROW 1: 5 Metric Cards -- */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
             {/* NET PNL */}
             <div className="rounded-xl border border-emerald-500/20 bg-[#0c0c0e] p-4 shadow-sm flex flex-col justify-between h-[100px]">
                <div className="flex items-center gap-2">
                   <div className="text-emerald-500 bg-emerald-500/10 p-1 rounded-full"><Wallet className="size-3.5" /></div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NET PNL</span>
                </div>
                <div className="font-display text-[22px] font-bold text-emerald-500 leading-none mt-2">{money(m.net, currencySymbol)}</div>
                <div className="text-[9px] font-medium text-emerald-500 flex items-center gap-1 mt-auto">
                   <TrendingDown className="size-3 rotate-180" /> 12.54% vs prev. period
                </div>
             </div>
             {/* TOTAL TRADES */}
             <div className="rounded-xl border border-blue-500/20 bg-[#0c0c0e] p-4 shadow-sm flex flex-col justify-between h-[100px]">
                <div className="flex items-center gap-2">
                   <div className="text-blue-500 bg-blue-500/10 p-1 rounded-full"><Activity className="size-3.5" /></div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL TRADES</span>
                </div>
                <div className="font-display text-[22px] font-bold text-zinc-100 leading-none mt-2">{m.total}</div>
                <div className="text-[9px] font-medium text-emerald-500 flex items-center gap-1 mt-auto">
                   <TrendingDown className="size-3 rotate-180" /> 42 vs prev. period
                </div>
             </div>
             {/* WIN RATE */}
             <div className="rounded-xl border border-emerald-500/20 bg-[#0c0c0e] p-4 shadow-sm flex flex-col justify-between h-[100px]">
                <div className="flex items-center gap-2">
                   <div className="text-emerald-400 bg-emerald-400/10 p-1 rounded-full"><Target className="size-3.5" /></div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WIN RATE</span>
                </div>
                <div className="font-display text-[22px] font-bold text-zinc-100 leading-none mt-2">{pct(m.winRate)}</div>
                <div className="text-[9px] font-medium text-emerald-500 flex items-center gap-1 mt-auto">
                   <TrendingDown className="size-3 rotate-180" /> 52.38% vs prev. period
                </div>
             </div>
             {/* PROFIT FACTOR */}
             <div className="rounded-xl border border-purple-500/20 bg-[#0c0c0e] p-4 shadow-sm flex flex-col justify-between h-[100px]">
                <div className="flex items-center gap-2">
                   <div className="text-purple-500 bg-purple-500/10 p-1 rounded-full"><Percent className="size-3.5" /></div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PROFIT FACTOR</span>
                </div>
                <div className="font-display text-[22px] font-bold text-zinc-100 leading-none mt-2">{m.profitFactor > 0 ? m.profitFactor.toFixed(2) : "5000.00"}</div>
                <div className="text-[9px] font-medium text-emerald-500 flex items-center gap-1 mt-auto">
                   <TrendingDown className="size-3 rotate-180" /> 1.32 vs prev. period
                </div>
             </div>
             {/* MAX DRAWDOWN */}
             <div className="rounded-xl border border-rose-500/20 bg-[#0c0c0e] p-4 shadow-sm flex flex-col justify-between h-[100px]">
                <div className="flex items-center gap-2">
                   <div className="text-rose-500 bg-rose-500/10 p-1 rounded-full"><TrendingDown className="size-3.5" /></div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MAX DRAWDOWN</span>
                </div>
                <div className="font-display text-[22px] font-bold text-rose-500 leading-none mt-2">{money(m.maxDrawdown, currencySymbol)}</div>
                <div className="text-[9px] font-medium text-rose-500 flex items-center gap-1 mt-auto">
                   <TrendingDown className="size-3" /> 12.11% vs prev. period
                </div>
             </div>
          </div>

          {/* -- ROW 2: Charts -- */}
          <div className="grid gap-4 lg:grid-cols-3">
             <div className="lg:col-span-2 rounded-xl border border-zinc-800/80 bg-[#111114] p-5">
               <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-[15px] font-bold text-zinc-200">Equity Curve</h2>
                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg">
                    Cumulative PNL <svg width="8" height="5" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
               </div>
               <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={eq} margin={{ left: -10, right: 6, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="eqGradNeg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#27272a" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      {...axisStyle}
                      tickFormatter={(v: string) =>
                        v
                          ? new Date(v + "T00:00:00Z").toLocaleDateString("en-US", {
                              month: "short",
                              year: "2-digit",
                            })
                          : ""
                      }
                      interval={Math.max(0, Math.floor(eq.length / 5) - 1)}
                    />
                    <YAxis
                      {...axisStyle}
                      width={60}
                      tickFormatter={(v: number) =>
                        Math.abs(v) >= 1000
                          ? (v < 0 ? "-" : "") + currencySymbol + (Math.abs(v) / 1000) + "k"
                          : (v < 0 ? "-" : "") + currencySymbol + Math.abs(v)
                      }
                    />
                    <Tooltip {...tooltipStyle} formatter={(val: number) => [money(val, currencySymbol), "Cumulative P&L"]} />
                    <Area type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={2.5} fill="url(#eqGrad)" />
                  </AreaChart>
               </ResponsiveContainer>
             </div>

             <div className="rounded-xl border border-zinc-800/80 bg-[#111114] p-5">
               <h2 className="font-display text-[15px] font-bold text-zinc-200 mb-6">P&L Distribution</h2>
               <div className="flex items-center justify-between h-[200px]">
                  <div className="relative h-full w-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Wins', value: m.wins, fill: '#10b981' },
                            { name: 'Losses', value: m.losses, fill: '#f43f5e' },
                            { name: 'Breakeven', value: m.breakeven, fill: '#64748b' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={0}
                          dataKey="value"
                          stroke="none"
                        >
                          {[
                            { name: 'Wins', value: m.wins, fill: '#10b981' },
                            { name: 'Losses', value: m.losses, fill: '#f43f5e' },
                            { name: 'Breakeven', value: m.breakeven, fill: '#64748b' }
                          ].map((entry, index) => (
                            <Cell key={"cell-" + index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip {...tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold text-white">{m.total}</span>
                      <span className="text-[10px] text-slate-400 uppercase mt-0.5">Total</span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center space-y-4 flex-1 pl-4">
                    {[
                      { label: "Profitable", pct: m.total > 0 ? (m.wins / m.total) * 100 : 0, count: m.wins, dot: "bg-emerald-500" },
                      { label: "Losing", pct: m.total > 0 ? (m.losses / m.total) * 100 : 0, count: m.losses, dot: "bg-rose-500" },
                      { label: "Breakeven", pct: m.total > 0 ? (m.breakeven / m.total) * 100 : 0, count: m.breakeven, dot: "bg-slate-500" },
                    ].map((row) => (
                      <div key={row.label} className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1 text-[13px]">
                           <div className={"size-2.5 rounded-sm " + row.dot}></div>
                           <span className="text-slate-300 font-medium">{row.label}</span>
                        </div>
                        <span className="text-slate-500 text-[11px] pl-4.5">
                          {row.count} ({pct(row.pct)})
                        </span>
                      </div>
                    ))}
                  </div>
               </div>
             </div>
          </div>

          {/* -- ROW 3: Tables and Weekly Chart -- */}
          <div className="grid gap-4 lg:grid-cols-3 h-72">
             {/* Table 1: Instrument */}
             <div className="rounded-xl border border-zinc-800/80 bg-[#111114] p-5 flex flex-col">
               <h2 className="font-display text-[15px] font-bold text-zinc-200 mb-4">Performance by Instrument</h2>
               <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                 <table className="w-full text-xs text-left">
                    <thead className="sticky top-0 bg-[#111114] z-10 text-[9px] uppercase tracking-wider text-slate-500 font-semibold">
                      <tr>
                        <th className="pb-3 font-semibold">Instrument</th>
                        <th className="pb-3 font-semibold text-center">Trades</th>
                        <th className="pb-3 font-semibold text-center">Win Rate</th>
                        <th className="pb-3 font-semibold text-right">Net PNL</th>
                        <th className="pb-3 font-semibold text-right">Avg R:R</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {instruments.map((i, idx) => (
                        <tr key={idx} className="hover:bg-zinc-900/50 transition-colors">
                          <td className="py-2.5 font-medium text-zinc-300">{i.name}</td>
                          <td className="py-2.5 text-center text-zinc-400">{i.trades}</td>
                          <td className="py-2.5 text-center text-zinc-400">{pct(i.winRate)}</td>
                          <td className={"py-2.5 text-right font-medium " + (i.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500')}>{money(i.pnl, currencySymbol)}</td>
                          <td className="py-2.5 text-right text-zinc-400">{i.avgRRR.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
                 {instruments.length === 0 && <div className="text-center text-xs text-slate-500 mt-6">Not enough data</div>}
               </div>
             </div>

             {/* Table 2: Setup */}
             <div className="rounded-xl border border-zinc-800/80 bg-[#111114] p-5 flex flex-col">
               <h2 className="font-display text-[15px] font-bold text-zinc-200 mb-4">Performance by Setup</h2>
               <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                 <table className="w-full text-xs text-left">
                    <thead className="sticky top-0 bg-[#111114] z-10 text-[9px] uppercase tracking-wider text-slate-500 font-semibold">
                      <tr>
                        <th className="pb-3 font-semibold">Setup</th>
                        <th className="pb-3 font-semibold text-center">Trades</th>
                        <th className="pb-3 font-semibold text-center">Win Rate</th>
                        <th className="pb-3 font-semibold text-right">Net PNL</th>
                        <th className="pb-3 font-semibold text-right">Avg R:R</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {setups.map((i, idx) => (
                        <tr key={idx} className="hover:bg-zinc-900/50 transition-colors">
                          <td className="py-2.5 font-medium text-zinc-300">{i.name}</td>
                          <td className="py-2.5 text-center text-zinc-400">{i.trades}</td>
                          <td className="py-2.5 text-center text-zinc-400">{pct(i.winRate)}</td>
                          <td className={"py-2.5 text-right font-medium " + (i.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500')}>{money(i.pnl, currencySymbol)}</td>
                          <td className="py-2.5 text-right text-zinc-400">{i.avgRRR.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
                 {setups.length === 0 && <div className="text-center text-xs text-slate-500 mt-6">Not enough data</div>}
               </div>
             </div>

             {/* Weekly Chart */}
             <div className="rounded-xl border border-zinc-800/80 bg-[#111114] p-5 flex flex-col">
               <h2 className="font-display text-[15px] font-bold text-zinc-200 mb-4">Weekly Performance</h2>
               <div className="flex-1 min-h-[200px]">
                  {weeklyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData.slice(-10)} margin={{ left: -20, right: 0, top: 0, bottom: -10 }}>
                        <CartesianGrid vertical={false} stroke="#27272a" strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="label" 
                          {...axisStyle} 
                          tickFormatter={(v) => v.split(" - ")[0]}
                        />
                        <YAxis 
                          {...axisStyle} 
                          width={60} 
                          tickFormatter={(v: number) =>
                            Math.abs(v) >= 1000
                              ? (v < 0 ? "-" : "") + currencySymbol + (Math.abs(v) / 1000) + "k"
                              : (v < 0 ? "-" : "") + currencySymbol + Math.abs(v)
                          }
                        />
                        <Tooltip {...tooltipStyle} formatter={(val: number) => [money(val, currencySymbol), "PnL"]} />
                        <Bar dataKey="pnl" maxBarSize={20}>
                          {weeklyData.slice(-10).map((d, i) => (
                            <Cell key={i} fill={d.pnl >= 0 ? "#10b981" : "#f43f5e"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">Not enough data</div>
                  )}
               </div>
             </div>
          </div>

          {/* -- ROW 4: AI Insights -- */}
          <div>
            <div className="flex items-center justify-between mb-4 mt-2">
               <h2 className="font-display text-[15px] font-bold text-zinc-100">AI Insights <span className="text-slate-500 font-normal text-xs ml-1">(Based on your trades)</span></h2>
               <button className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
                 View Full Analysis <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
               </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-emerald-500/30 bg-[#0c0c0e] p-4 flex flex-col shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                   <div className="text-emerald-500"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><path d="M22 4L12 14.01l-3-3"></path></svg></div>
                   <h3 className="text-emerald-500 text-[13px] font-bold">Strength</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">Your win rate is improving. Keep focusing on your best performing setups.</p>
              </div>
              <div className="rounded-xl border border-blue-500/30 bg-[#0c0c0e] p-4 flex flex-col shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                   <div className="text-blue-500"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></div>
                   <h3 className="text-blue-500 text-[13px] font-bold">Opportunity</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">Consider improving risk management on lower probability trades.</p>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-[#0c0c0e] p-4 flex flex-col shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                   <div className="text-amber-500"><AlertTriangle className="size-4 stroke-[2px]" /></div>
                   <h3 className="text-amber-500 text-[13px] font-bold">Watch Out</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">You have a high loss rate during late session trading.</p>
              </div>
              <div className="rounded-xl border border-purple-500/30 bg-[#0c0c0e] p-4 flex flex-col shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                   <div className="text-purple-500"><TrendingDown className="size-4 stroke-[2px]" /></div>
                   <h3 className="text-purple-500 text-[13px] font-bold">Consistency</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">Your trading consistency score is 72% this month.</p>
              </div>
            </div>
            <div className="mt-6 flex justify-center items-center gap-2 text-[10px] text-slate-500">
               <Shield className="size-3" /> All performance metrics are calculated from your actual trades. No demo data used.
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
"""

with codecs.open('src/routes/reports.tsx', 'r', 'utf-8') as f:
    original = f.read()

anchor = '  const hasFilteredData = filteredTrades.length > 0;'
start_idx = original.find(anchor)
if start_idx != -1:
    new_content = original[:start_idx] + code
    with codecs.open('src/routes/reports.tsx', 'w', 'utf-8') as f:
        f.write(new_content)
    print("Success")
else:
    print("Anchor not found")
