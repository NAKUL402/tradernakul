import re

with open('src/routes/reports.tsx', 'r') as f:
    code = f.read()

# 1. Imports
if 'PieChart' not in code:
    code = re.sub(r'\} from "recharts";', '  PieChart,\n  Pie,\n  Cell,\n} from "recharts";', code)

# 2. Insights
old_insights = '''    if (patterns?.bestSetup)
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
    }'''

new_insights = '''    // NEW AI INSIGHT #2 - BEST SETUP
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
    }, {});
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
    }'''

code = code.replace(old_insights, new_insights)

# 3. P&L distribution
dist_regex = re.compile(r'<ReportPanel\s+title="P&L Distribution"[\s\S]*?</ReportPanel>')
replacement = '''<ReportPanel
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
            </ReportPanel>'''

code = dist_regex.sub(replacement, code)

with open('src/routes/reports.tsx', 'w') as f:
    f.write(code)
print('Done!')
