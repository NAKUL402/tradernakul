const fs = require('fs');
let code = fs.readFileSync('src/routes/reports.tsx', 'utf8');

if (!code.includes('PieChart')) {
  code = code.replace(/} from "recharts";/, '  PieChart,\n  Pie,\n} from "recharts";');
}

// Replace generateInsights logic
const generateInsightsOld = `function generateInsights(
  list: Trade[],
  m: ReturnType<typeof reportMetrics>,
): { type: "strength" | "opportunity" | "warning" | "tip"; title: string; body: string }[] {
  if (list.length < 3) {
    return [
      {
        type: "tip",
        title: "Build Your Data",
        body: \`Log at least 3 trades to unlock AI insights. You have \${list.length} trade\${list.length === 1 ? "" : "s"} logged.\`,
      },
    ];
  }
  const out: { type: "strength" | "opportunity" | "warning" | "tip"; title: string; body: string }[] = [];
  const patterns = aggregateTradePatterns(list);

  if (m.winRate >= 60)
    out.push({
      type: "strength",
      title: "Strong Win Rate",
      body: \`Your win rate of \${pct(m.winRate)} is above 60%. Combined with consistent RRR, this is a reliable edge.\`,
    });
  else if (m.winRate < 40)
    out.push({
      type: "warning",
      title: "Win Rate Below 40%",
      body: \`Your current win rate is \${pct(m.winRate)}. Review trade entry criteria and reduce low-probability setups.\`,
    });

  if (m.profitFactor >= 2)
    out.push({
      type: "strength",
      title: "Excellent Profit Factor",
      body: \`A profit factor of \${m.profitFactor.toFixed(2)} means you earn \${m.profitFactor.toFixed(2)}x for every $1 lost. Protect this edge.\`,
    });
  else if (m.profitFactor > 0 && m.profitFactor < 1.2)
    out.push({
      type: "warning",
      title: "Low Profit Factor",
      body: \`Your profit factor of \${m.profitFactor.toFixed(2)} is close to breakeven. Tighten stops or improve RRR.\`,
    });

  if (m.maxDrawdown < 0)
    out.push({
      type: "warning",
      title: "Significant Drawdown",
      body: \`You have experienced a drawdown of \${money(m.maxDrawdown, "$")}. Consider reducing position size during losing streaks.\`,
    });

  if (m.avgRRR >= 2)
    out.push({
      type: "strength",
      title: "Disciplined Risk:Reward",
      body: \`Average RRR of 1:\${m.avgRRR.toFixed(2)} shows asymmetric setups. This compounds well over time.\`,
    });
  else if (m.avgRRR > 0 && m.avgRRR < 1.5)
    out.push({
      type: "opportunity",
      title: "Improve Your RRR",
      body: \`Average RRR of 1:\${m.avgRRR.toFixed(2)} leaves room for improvement. Focus on wider TPs or tighter stops.\`,
    });

  if (patterns?.bestSetup)
    out.push({
      type: "strength",
      title: \`Best Setup: \${patterns.bestSetup.name}\`,
      body: \`\${patterns.bestSetup.name} wins \${patterns.bestSetup.winRate}% of the time across \${patterns.bestSetup.trades} trades. Prioritize this setup.\`,
    });
  if (patterns?.worstSetup && patterns.worstSetup.name !== patterns.bestSetup?.name)
    out.push({
      type: "opportunity",
      title: \`Review: \${patterns.worstSetup.name}\`,
      body: \`\${patterns.worstSetup.name} shows only \${patterns.worstSetup.winRate}% win rate. Refine execution criteria.\`,
    });
  if (patterns?.topMistakes?.[0]) {
    const m0 = patterns.topMistakes[0]!;
    out.push({
      type: "warning",
      title: \`Recurring Mistake: "\${m0.name}"\`,
      body: \`This mistake appears in \${m0.count} trade\${m0.count > 1 ? "s" : ""}. Addressing it directly could improve results.\`,
    });
  }
  if (patterns?.trend === "Improving")
    out.push({
      type: "tip",
      title: "Improving Form",
      body: \`Last 10 trades show \${patterns.recent10WinRate}% WR vs overall \${patterns.overallWinRate}%. Stay consistent.\`,
    });
  else if (patterns?.trend === "Deteriorating")
    out.push({
      type: "warning",
      title: "Declining Recent Form",
      body: \`Last 10 trades show \${patterns.recent10WinRate}% WR vs overall \${patterns.overallWinRate}%. Review recent setups carefully.\`,
    });

  return out.length > 0
    ? out.slice(0, 6)
    : [
        {
          type: "tip",
          title: "Keep Building",
          body: "Your data is looking good, but we need a few more trades to identify statistically significant patterns.",
        },
      ];
}`;

const generateInsightsNew = `function generateInsights(
  list: Trade[],
  m: ReturnType<typeof reportMetrics>,
): { type: "strength" | "opportunity" | "warning" | "tip" | "neutral"; title: string; body: string }[] {
  if (list.length < 3) {
    return [
      {
        type: "tip",
        title: "Build Your Data",
        body: \`Log at least 3 trades to unlock AI insights. You have \${list.length} trade\${list.length === 1 ? "" : "s"} logged.\`,
      },
    ];
  }
  const out: { type: "strength" | "opportunity" | "warning" | "tip" | "neutral"; title: string; body: string }[] = [];
  const patterns = aggregateTradePatterns(list);

  if (m.winRate >= 60)
    out.push({
      type: "strength",
      title: "Strong Win Rate",
      body: \`Your win rate of \${pct(m.winRate)} is above 60%. Combined with consistent RRR, this is a reliable edge.\`,
    });
  else if (m.winRate < 40)
    out.push({
      type: "warning",
      title: "Win Rate Below 40%",
      body: \`Your current win rate is \${pct(m.winRate)}. Review trade entry criteria and reduce low-probability setups.\`,
    });

  if (m.profitFactor >= 2)
    out.push({
      type: "strength",
      title: "Excellent Profit Factor",
      body: \`A profit factor of \${m.profitFactor.toFixed(2)} means you earn \${m.profitFactor.toFixed(2)}x for every $1 lost. Protect this edge.\`,
    });
  else if (m.profitFactor > 0 && m.profitFactor < 1.2)
    out.push({
      type: "warning",
      title: "Low Profit Factor",
      body: \`Your profit factor of \${m.profitFactor.toFixed(2)} is close to breakeven. Tighten stops or improve RRR.\`,
    });

  if (m.maxDrawdown < 0)
    out.push({
      type: "warning",
      title: "Significant Drawdown",
      body: \`You have experienced a drawdown of \${money(m.maxDrawdown, "$")}. Consider reducing position size during losing streaks.\`,
    });

  if (m.avgRRR >= 2)
    out.push({
      type: "strength",
      title: "Disciplined Risk:Reward",
      body: \`Average RRR of 1:\${m.avgRRR.toFixed(2)} shows asymmetric setups. This compounds well over time.\`,
    });
  else if (m.avgRRR > 0 && m.avgRRR < 1.5)
    out.push({
      type: "opportunity",
      title: "Improve Your RRR",
      body: \`Average RRR of 1:\${m.avgRRR.toFixed(2)} leaves room for improvement. Focus on wider TPs or tighter stops.\`,
    });

  if (patterns?.worstSetup && patterns.worstSetup.name !== patterns.bestSetup?.name)
    out.push({
      type: "opportunity",
      title: \`Review: \${patterns.worstSetup.name}\`,
      body: \`\${patterns.worstSetup.name} shows only \${patterns.worstSetup.winRate}% win rate. Refine execution criteria.\`,
    });
  if (patterns?.topMistakes?.[0]) {
    const m0 = patterns.topMistakes[0]!;
    out.push({
      type: "warning",
      title: \`Recurring Mistake: "\${m0.name}"\`,
      body: \`This mistake appears in \${m0.count} trade\${m0.count > 1 ? "s" : ""}. Addressing it directly could improve results.\`,
    });
  }
  if (patterns?.trend === "Improving")
    out.push({
      type: "tip",
      title: "Improving Form",
      body: \`Last 10 trades show \${patterns.recent10WinRate}% WR vs overall \${patterns.overallWinRate}%. Stay consistent.\`,
    });
  else if (patterns?.trend === "Deteriorating")
    out.push({
      type: "warning",
      title: "Declining Recent Form",
      body: \`Last 10 trades show \${patterns.recent10WinRate}% WR vs overall \${patterns.overallWinRate}%. Review recent setups carefully.\`,
    });

  // NEW AI INSIGHT #2 - BEST SETUP
  if (patterns?.bestSetup) {
    out.push({
      type: "strength",
      title: "Best Performing Setup",
      body: \`\${patterns.bestSetup.name}\\nWin Rate: \${patterns.bestSetup.winRate}% | Trades: \${patterns.bestSetup.trades}\`,
    });
  } else {
    out.push({
      type: "neutral",
      title: "Best Performing Setup",
      body: "Not enough data yet",
    });
  }

  // NEW AI INSIGHT #1 - BEST TRADING SESSION
  const sessionStats = list.reduce((acc, t) => {
    if (t.session) {
      if (!acc[t.session]) acc[t.session] = { wins: 0, trades: 0 };
      acc[t.session].trades += 1;
      if (t.result === 'Win') acc[t.session].wins += 1;
    }
    return acc;
  }, {} as Record<string, { wins: number; trades: number }>);
  const bestSession = Object.entries(sessionStats)
    .map(([name, s]) => ({ name, winRate: Math.round((s.wins / s.trades) * 100), trades: s.trades }))
    .filter(s => s.trades >= 2)
    .sort((a, b) => b.winRate - a.winRate)[0];

  if (bestSession) {
    out.push({
      type: "strength",
      title: "Best Trading Session",
      body: \`\${bestSession.name}\\nWin Rate: \${bestSession.winRate}% | Trades: \${bestSession.trades}\`,
    });
  } else {
    out.push({
      type: "neutral",
      title: "Best Trading Session",
      body: "Not enough data yet",
    });
  }

  // NEW AI INSIGHT #3 - RISK DISCIPLINE
  const risks = list.map(t => t.riskAmount || 0).filter(r => r > 0);
  if (risks.length >= 3) {
    const avgRisk = risks.reduce((a, b) => a + b, 0) / risks.length;
    const outliers = risks.filter(r => r > avgRisk * 1.5).length;
    if (outliers === 0) {
      out.push({
        type: "strength",
        title: "Risk Discipline",
        body: "Consistent\\nExcellent risk management with no oversized trades detected.",
      });
    } else {
      out.push({
        type: "warning",
        title: "Risk Discipline",
        body: \`Inconsistent\\nDetected \${outliers} oversized trades above average risk.\`,
      });
    }
  } else {
      out.push({
      type: "neutral",
      title: "Risk Discipline",
      body: "Not enough data yet",
    });
  }

  return out.length > 0
    ? out.slice(0, 9)
    : [
        {
          type: "tip",
          title: "Keep Building",
          body: "Your data is looking good, but we need a few more trades to identify statistically significant patterns.",
        },
      ];
}`;

// Use string replacement instead of regex to avoid whitespace issues
if (code.includes('function generateInsights(')) {
  const parts = code.split('function generateInsights(');
  const before = parts[0];
  const afterGenerateInsightsOld = parts[1].split('return out.length > 0')[1].split(';')[0] + ';\n}';
  const restOfCode = parts[1].substring(parts[1].indexOf('return out.length > 0') + afterGenerateInsightsOld.length);

  // We actually will just replace by searching the old implementation exactly or using regex with multiline
  code = code.replace(generateInsightsOld, generateInsightsNew);
  if(!code.includes('Best Performing Setup')) {
    // try removing whitespace
    const normalizedOld = generateInsightsOld.replace(/\\s+/g, ' ');
    const normalizedCode = code.replace(/\\s+/g, ' ');
    if (normalizedCode.includes(normalizedOld)) {
      console.log('Found it with normalized space! Replacing manually...');
      // just replace everything from "function generateInsights" to the ending "}" before the component
      const startIdx = code.indexOf('function generateInsights(');
      const endIdx = code.indexOf('export const Route = ');
      if(startIdx !== -1 && endIdx !== -1) {
         code = code.substring(0, startIdx) + generateInsightsNew + '\\n\\n' + code.substring(endIdx);
      }
    }
  }
}

// Replace P&L Distribution with Win vs Loss
const panelRegex = /<ReportPanel\\s+title="P&L Distribution"[\\s\\S]*?<\\/ReportPanel>/;
const replacementPanel = \`<ReportPanel
              title="Win vs Loss Performance"
              action={<PieChartIcon className="size-4 text-zinc-600" />}
            >
              <div className="h-[260px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Wins", value: m.wins, fill: "#10b981" },
                        { name: "Losses", value: m.losses, fill: "#f43f5e" },
                        { name: "Breakeven", value: m.breakeven, fill: "#52525b" }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="#09090b"
                      strokeWidth={2}
                    >
                      <Cell key="cell-0" fill="#10b981" />
                      <Cell key="cell-1" fill="#f43f5e" />
                      <Cell key="cell-2" fill="#52525b" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#09090b",
                        borderColor: "#27272a",
                        borderRadius: "0.5rem",
                        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.8)",
                        color: "#f4f4f5",
                      }}
                      itemStyle={{ color: "#e4e4e7", fontWeight: 600 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ReportPanel>\`;

code = code.replace(panelRegex, replacementPanel);
fs.writeFileSync('src/routes/reports.tsx', code);
console.log('Update complete!');
