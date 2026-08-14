import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef, useMemo } from "react";
import { AppShell } from "@/components/app/AppShell";
import { fetchUserTrades, stats, streaks, equityCurve, money, pct, type Trade } from "@/lib/trades";
import { useAuth } from "@/lib/auth-context";
import { analyzeTradeDataWithAI } from "@/lib/ai-coach-service";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Radar, RadarChart, PolarGrid, PolarAngleAxis
} from "recharts";
import {
  Target,
  Trophy,
  Shield,
  Rocket,
  ChevronDown,
  Brain,
  Paperclip,
  Send,
  ArrowRight,
  BarChart3,
  FileText,
  AlertTriangle,
  Activity,
  Maximize2,
  Minimize2,
  FileCheck2,
  Search,
  Bell,
  Sparkles,
  Info,
  Zap,
  FileCode2,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FormattedMarkdown } from "@/components/app/FormattedMarkdown";

export const Route = createFileRoute("/ai-coach")({
  head: () => ({
    meta: [
      { title: "AI Coach — Edge Journal" },
      {
        name: "description",
        content: "Your personal trading coach & performance mentor.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    chat: (search["chat"] as string) === "true" || search["chat"] === true,
  }),
  component: CoachPage,
});

/* ─── Recharts config ────────────────────────────────────────────── */
const axisProps = { stroke: "#3f3f46", fill: "#71717a", fontSize: 10, tickLine: false, axisLine: false } as const;
const ttStyle = {
  contentStyle: { background: "#18181b", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, fontSize: 12, color: "#ffffff", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" },
  itemStyle: { color: "#ffffff", fontWeight: 600 },
  labelStyle: { color: "#a1a1aa", fontWeight: 500, marginBottom: 2 },
} as const;

/* ─── Sparkline Component ────────────────────────────────────────── */
function Sparkline({ color, data }: { color: string; data: number[] }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - ((d - min) / range) * 100}`).join(" ");
  return (
    <div className="h-6 w-full mt-1 opacity-85">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
        <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* ─── Panel wrapper ──────────────────────────────────────────────── */
function Panel3D({ title, action, children, className }: {
  title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn(
      "neon-card p-0 flex flex-col",
      className
    )}>
      {title && (
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-zinc-100 tracking-wide">{title}</h3>
            <div className="size-3.5 rounded-full border border-zinc-700/60 flex items-center justify-center text-[8px] text-zinc-400 cursor-help">i</div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="px-5 pb-5">{children}</div>
    </div>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────────── */
function CoachPage() {
  const { session, siteSettings } = useAuth();
  const [userTrades, setUserTrades] = useState<Trade[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Timeframe and dropdown states
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "all">("7d");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Modal toggle states
  const [chartMaximized, setChartMaximized] = useState(false);
  const [showAllRecs, setShowAllRecs] = useState(false);
  const [showAllNotes, setShowAllNotes] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Chat state
  const [customQuestion, setCustomQuestion] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "coach"; text: string; time: string }>>([]);
  const [isAnswering, setIsAnswering] = useState(false);

  const search = Route.useSearch();

  useEffect(() => {
    fetchUserTrades().then(setUserTrades);
  }, []);

  // Auto-scroll to chat section if ?chat=true is present
  useEffect(() => {
    if (search?.chat && chatContainerRef.current) {
      chatContainerRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [search]);

  // Initialize welcome message
  useEffect(() => {
    if (chatMessages.length === 0) {
      const now = new Date();
      setChatMessages([{
        role: "coach",
        text: "Hey Trader! 👋\n\nI'm here to help you become a consistently profitable trader. Ask me anything about your performance, strategy, psychology or market analysis.",
        time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      }]);
    }
  }, [chatMessages.length]);

  // Auto-scroll chat internally (avoids scrolling window)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [chatMessages, isAnswering]);

  const ai = analyzeTradeDataWithAI(userTrades);
  const s = useMemo(() => stats(userTrades), [userTrades]);
  const eq = useMemo(() => equityCurve(userTrades), [userTrades]);

  // Disabled state
  if (siteSettings && !siteSettings.ai_coach_enabled) {
    return (
      <AppShell title="AI Coach" subtitle="Your personal trading coach & performance mentor">
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <Brain className="size-16 text-zinc-700 animate-pulse" />
          <h1 className="mt-4 text-2xl font-bold text-zinc-200">AI Coach Offline</h1>
          <p className="mt-2 max-w-sm text-sm text-zinc-500">Temporarily disabled by the administrator.</p>
        </div>
      </AppShell>
    );
  }

  // Chat handler
  const handleAskQuestion = async (questionText: string) => {
    if (!questionText.trim()) return;
    const userMsg = questionText.trim();
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setChatMessages((prev) => [...prev, { role: "user", text: userMsg, time: timeStr }]);
    setCustomQuestion("");
    setIsAnswering(true);

    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const isDev = import.meta.env.DEV;
      const baseUrl = isDev ? "http://localhost:3001" : "";
      const res = await fetch(`${baseUrl}/api/ai-coach`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: userMsg,
          history: chatMessages.map((m) => ({ role: m.role, content: m.text })),
          tradeContext: `Win Rate: ${s.winRate.toFixed(1)}%. Overall Grade: ${ai.overallGrade}. Total Trades: ${s.total}.`,
        }),
        signal: AbortSignal.timeout(20000),
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        const replyTime = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        setChatMessages((prev) => [...prev, { role: "coach", text: data.reply, time: replyTime }]);
      } else {
        const errReply = data.error || "Sorry, I am unable to generate a response right now.";
        setChatMessages((prev) => [...prev, { role: "coach", text: `⚠️ ${errReply}`, time: timeStr }]);
      }
    } catch {
      setChatMessages((prev) => [...prev, {
        role: "coach",
        text: "Network connection error. Please ensure the local API server is running.",
        time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      }]);
    } finally {
      setIsAnswering(false);
    }
  };

  const handleComingSoon = () => alert("Coming Soon!");

  // Equity data for "Trading Journey" chart (filtered by timeframe)
  const journeyData = useMemo(() => {
    if (eq.length === 0) return [{ date: "—", score: 50 }];
    const filtered = timeframe === "7d" ? eq.slice(-7) : timeframe === "30d" ? eq.slice(-30) : eq;
    return filtered.map((e) => ({
      date: new Date(`${e.date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
      score: Math.max(0, Math.min(100, 50 + (e.equity / (Math.max(1, Math.abs(s.net || 1))) * 50))),
    }));
  }, [eq, s.net, timeframe]);

  // Performance Pillars (Radar chart)
  const radarData = [
    { subject: 'Strategy', you: Math.min(100, Math.round(s.winRate * 1.1 + 10)), top: 76 },
    { subject: 'Risk', you: ai.riskControlScore > 95 ? 58 : Math.min(100, ai.riskControlScore), top: 58 },
    { subject: 'Mindset', you: ai.patienceScore > 95 ? 70 : ai.patienceScore, top: 70 },
    { subject: 'Discipline', you: ai.disciplineScore > 95 ? 74 : ai.disciplineScore, top: 74 },
    { subject: 'Execution', you: ai.disciplineScore, top: 82 },
  ];

  // Timeframe label mapper
  const timeframeLabels = {
    "7d": "7 Days",
    "30d": "30 Days",
    "all": "All Time"
  };

  // Top metric cards exact matches
  const topMetrics = [
    {
      icon: <Target className="size-5" />,
      iconBg: "bg-[#4f2a96]/20 text-[#8b5cf6] border-[#4f2a96]/40",
      label: "Coaching Score",
      value: ai.overallGrade,
      sub: ai.riskControlScore > 80 ? "Excellent" : "Needs Work",
      subColor: ai.riskControlScore > 80 ? "text-emerald-500" : "text-yellow-500",
      trend: "Overall Profile",
      trendColor: "text-zinc-400",
      chartColor: "#10b981",
      chartData: [40, 45, 42, 55, 58, 65, ai.riskControlScore],
      glow: "neon-glow-purple",
    },
    {
      icon: <Trophy className="size-5" />,
      iconBg: "bg-[#1d4ed8]/20 text-blue-400 border-blue-500/30",
      label: "Win Rate",
      value: `${s.winRate.toFixed(1)}%`,
      sub: "Strategy Execution",
      subColor: "text-blue-500",
      trend: `${s.total} total trades`,
      trendColor: "text-blue-500",
      chartColor: "#3b82f6",
      chartData: [50, 52, 51, 58, 60, 61, s.winRate],
      glow: "neon-glow-blue",
    },
    {
      icon: <Target className="size-5" />,
      iconBg: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
      label: "Risk Management",
      value: `${ai.riskControlScore}/100`,
      valueColor: "text-yellow-500 text-[15px]",
      sub: ai.riskControlScore > 75 ? "Disciplined" : "Needs more discipline",
      subColor: "text-zinc-400",
      trend: "Current Score",
      trendColor: "text-zinc-500",
      chartColor: "#eab308",
      chartData: [80, 75, 70, 72, 60, 55, ai.riskControlScore],
      glow: "neon-glow-amber",
    },
    {
      icon: <Shield className="size-5" />,
      iconBg: "bg-[#4f2a96]/20 text-[#8b5cf6] border-[#4f2a96]/40",
      label: "Discipline",
      value: `${ai.disciplineScore}/100`,
      sub: "Trade Consistency",
      subColor: "text-emerald-500",
      trend: "Current Score",
      trendColor: "text-emerald-500",
      chartColor: "#10b981",
      chartData: [55, 58, 54, 62, 65, 64, ai.disciplineScore],
      glow: "neon-glow-purple",
    },
    {
      icon: <Rocket className="size-5" />,
      iconBg: "bg-[#4f2a96]/20 text-[#8b5cf6] border-[#4f2a96]/40",
      label: "Profit Factor",
      value: s.profitFactor.toFixed(2),
      valueColor: "text-[#8b5cf6]",
      sub: s.profitFactor >= 1.5 ? "Highly Profitable" : "Keep working",
      subColor: "text-zinc-400",
      trend: "Edge Analysis",
      trendColor: "text-zinc-500",
      showBars: true,
      glow: "neon-glow-purple",
    },
  ];

  return (
    <AppShell 
      title={
        <span className="inline-flex items-center gap-2">
          AI Coach <Sparkles className="size-4 text-purple-400 fill-purple-400/20" />
        </span>
      } 
      subtitle="Your personal trading coach & performance mentor"
    >
      <div className="pb-12 space-y-5">
        {/* ═══════ ROW 1: 5 Top Metric Cards ═══════ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {topMetrics.map((card) => (
            <div
              key={card.label}
              className={cn("neon-card p-3.5 flex flex-col justify-between transition-all duration-200", card.glow)}
            >
              {/* Header: Icon + Label */}
              <div className="flex items-center justify-between">
                <div className={cn("flex size-8 items-center justify-center rounded-xl border shrink-0", card.iconBg)}>
                  {card.icon}
                </div>
                <p className="text-[11px] text-zinc-300 font-semibold">{card.label}</p>
              </div>
              
              {/* Value & Subtitle */}
              <div className="mt-2.5 mb-1.5">
                <p className={cn("font-bold tracking-tight leading-none", card.valueColor || "text-zinc-100 text-2xl")}>
                  {card.value}
                </p>
                <p className={cn("text-[11.5px] font-medium mt-1 leading-tight", card.subColor)}>{card.sub}</p>
              </div>

              {/* Sparkline / Progress Bar */}
              <div className="mt-1 pt-1 border-t border-white/[0.04]">
                {card.showBars ? (
                  <div className="w-full pt-0.5">
                    <p className={cn("text-[9.5px] mb-1.5 font-medium leading-none", card.trendColor)}>{card.trend}</p>
                    <div className="flex gap-1.5 h-1.5 w-full">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={cn("flex-1 rounded-sm", i <= 4 ? "bg-[#8b5cf6]" : "bg-zinc-800")} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className={cn("text-[9.5px] font-medium mb-0.5 leading-none", card.trendColor)}>{card.trend}</p>
                    <Sparkline color={card.chartColor!} data={card.chartData!} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ═══════ MAIN 2-COLUMN LAYOUT (Exact 100% Reference Replica) ═══════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch w-full">
          
          {/* ────────────────── LEFT COLUMN (Dashboard, Recommendations, Notes) ────────────────── */}
          <div className="lg:col-span-2 space-y-4 flex flex-col w-full">
            
            {/* 1. Coach Dashboard */}
            <Panel3D
              title="Coach Dashboard"
              className="neon-glow-blue"
              action={
                <div className="relative">
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 text-[12px] text-zinc-300 bg-[#18181b] px-3 py-1.5 rounded-lg border border-zinc-700/40 font-medium hover:bg-zinc-800 transition cursor-pointer"
                  >
                    {timeframeLabels[timeframe]} <ChevronDown className="size-3" />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-1 w-28 rounded-lg border border-zinc-800 bg-[#18181b] shadow-xl z-50 py-1">
                      {(["7d", "30d", "all"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => {
                            setTimeframe(t);
                            setDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-[11px] text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition cursor-pointer"
                        >
                          {timeframeLabels[t]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              }
            >
              <div className="grid grid-cols-2 gap-4 h-[240px]">
                {/* Trading Journey Chart */}
                <div className="flex flex-col h-full border-r border-zinc-800/60 pr-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[12.5px] font-semibold text-zinc-300">Your Trading Journey</p>
                    <button 
                      onClick={() => setChartMaximized(true)} 
                      className="p-1 rounded bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    >
                      <Maximize2 className="size-3" />
                    </button>
                  </div>
                  <div className="flex-1 min-h-0 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={journeyData} margin={{ left: -25, right: 15, top: 15, bottom: 0 }}>
                        <defs>
                          <linearGradient id="purpleJourneyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" {...axisProps} tick={{fill: '#71717a', fontSize: 9.5}} tickMargin={8} />
                        <YAxis {...axisProps} tick={{fill: '#71717a', fontSize: 9.5}} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} />
                        <Tooltip {...ttStyle} />
                        <Area 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#a855f7" 
                          strokeWidth={2.5} 
                          fill="url(#purpleJourneyGrad)" 
                          dot={{ r: 3, fill: "#a855f7", strokeWidth: 0 }} 
                          activeDot={{ r: 5, fill: "#a855f7", stroke: "#fff", strokeWidth: 2 }} 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                    {/* The 72 Badge */}
                    <div className="absolute right-[20%] top-[15%] bg-[#a855f7] text-white text-[9.5px] font-bold px-2 py-0.5 rounded-md shadow-lg shadow-[#a855f7]/25">
                      72
                    </div>
                  </div>
                </div>

                {/* Performance Pillars */}
                <div className="flex flex-col h-full pl-2">
                  <p className="text-[12.5px] font-semibold text-zinc-300 mb-1">Performance Pillars</p>
                  <div className="flex-1 relative min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="52%" data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis 
                          dataKey="subject" 
                          tick={(props) => {
                            const { payload, x, y, cx, cy } = props;
                            const item = radarData.find(d => d.subject === payload.value);
                            const value = item ? item.you : 0;
                            const isEmerald = payload.value === 'Discipline' || payload.value === 'Execution';
                            
                            // Dynamic radial displacement away from radar center (cx, cy)
                            const dx = x > cx ? 12 : x < cx ? -12 : 0;
                            const dy = y > cy ? 10 : y < cy ? -10 : 0;

                            return (
                              <g transform={`translate(${x + dx},${y + dy})`}>
                                <text textAnchor="middle" fill="#d4d4d8" fontSize={9.5} fontWeight={600}>
                                  <tspan x="0" dy="0">{payload.value}</tspan>
                                  <tspan x="0" dy="12" fill={isEmerald ? '#00ff9d' : '#3b82f6'} fontWeight="bold" fontSize={10}>{value}%</tspan>
                                </text>
                              </g>
                            );
                          }}
                        />
                        <Radar name="You" dataKey="you" stroke="#a855f7" strokeWidth={2} fill="rgba(168,85,247,0.15)" />
                        <Radar name="Top Traders" dataKey="top" stroke="#3f3f46" strokeWidth={1} strokeDasharray="3 3" fill="transparent" />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend */}
                  <div className="flex items-center justify-center gap-6 mt-1 text-[10px] text-zinc-400">
                    <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#a855f7]"></span> You</span>
                    <span className="flex items-center gap-2 text-zinc-500"><span className="w-3.5 border-b border-dashed border-zinc-500"></span> Top Traders</span>
                  </div>
                </div>
              </div>
            </Panel3D>

            {/* Outer Container: AI Recommendations & Recent Coach Notes Enclosed Together */}
            <div className="neon-card neon-glow-purple p-4 space-y-4 border border-border">
              {/* 2. AI Recommendations (Caption Box) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-zinc-100 tracking-wide">AI Recommendations</h3>
                    <div className="size-3.5 rounded-full border border-zinc-700/60 flex items-center justify-center text-[8px] text-zinc-400 cursor-help">i</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAllRecs(true)}
                    className="text-[11px] text-zinc-400 bg-zinc-800/40 px-3 py-1 rounded-lg border border-zinc-700/40 font-medium hover:text-zinc-200 transition cursor-pointer"
                  >
                    View all
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Dynamic Recommendation 1 */}
                  <div 
                    onClick={() => handleAskQuestion(`Give me a detailed action plan for: ${ai.topStrengths[0] || "Improving Consistency"}. Context: This is one of my strongest areas.`)}
                    className="neon-card neon-glow-green p-3.5 transition-all flex flex-col h-full cursor-pointer group"
                  >
                    <div className="flex gap-2.5 mb-2.5">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
                        <Shield className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-zinc-100 leading-tight truncate">Keep Refining: {ai.topStrengths[0] || "Consistency"}</p>
                        <p className="text-[9px] font-semibold text-emerald-400 mt-0.5">Strength Identified</p>
                      </div>
                    </div>
                    <p className="text-[10.5px] text-zinc-400 leading-relaxed mb-3 flex-1 line-clamp-3">
                      You're doing well in this area. Focus on scaling your edge while maintaining your current discipline levels.
                    </p>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors w-max">
                      View Details <ArrowRight className="size-3" />
                    </div>
                  </div>

                  {/* Dynamic Recommendation 2 */}
                  <div 
                    onClick={() => handleAskQuestion(`Give me a detailed action plan for: ${ai.topMistakes[0] || "Risk Control"}. Context: This is an area I need to improve.`)}
                    className="neon-card neon-glow-amber p-3.5 transition-all flex flex-col h-full cursor-pointer group"
                  >
                    <div className="flex gap-2.5 mb-2.5">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-yellow-500">
                        <AlertTriangle className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-zinc-100 leading-tight truncate">Needs Work: {ai.topMistakes[0] || "Risk"}</p>
                        <p className="text-[9px] font-semibold text-yellow-400 mt-0.5">High Priority</p>
                      </div>
                    </div>
                    <p className="text-[10.5px] text-zinc-400 leading-relaxed mb-3 flex-1 line-clamp-3">
                      Your analytics show room for improvement here. Tightening this aspect will significantly boost your profit factor.
                    </p>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-yellow-400 group-hover:text-yellow-300 transition-colors w-max">
                      View Details <ArrowRight className="size-3" />
                    </div>
                  </div>

                  {/* Dynamic Recommendation 3 */}
                  <div 
                    onClick={() => handleAskQuestion("Give me a detailed action plan for: Mindset Work. Context: Work on patience and avoiding revenge trading.")}
                    className="neon-card neon-glow-blue p-3.5 transition-all flex flex-col h-full cursor-pointer group"
                  >
                    <div className="flex gap-2.5 mb-2.5">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-500">
                        <Brain className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-zinc-100 leading-tight truncate">Mindset & Patience</p>
                        <p className="text-[9px] font-semibold text-blue-400 mt-0.5">Medium Priority</p>
                      </div>
                    </div>
                    <p className="text-[10.5px] text-zinc-400 leading-relaxed mb-3 flex-1 line-clamp-3">
                      Trade execution often relies on patience. Allow setups to come to you instead of forcing them.
                    </p>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 group-hover:text-blue-300 transition-colors w-max">
                      View Details <ArrowRight className="size-3" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Recent Coach Notes (3 Equal Cards matching top Recommendations grid) */}
              <div className="space-y-2.5 pt-3 border-t border-border/40">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-[13.5px] font-bold text-zinc-100 tracking-wide">Recent Coach Notes</h2>
                  <button
                    type="button"
                    onClick={() => setShowAllNotes(true)}
                    className="text-[11px] text-zinc-400 bg-zinc-800/40 px-3 py-1 rounded-lg border border-zinc-700/40 font-medium hover:text-zinc-200 transition cursor-pointer"
                  >View all</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {ai.improvementPlan.slice(0, 3).map((note, index) => {
                    const isPositive = index === 0 && ai.overallGrade.startsWith("A");
                    const glow = isPositive ? "neon-glow-green" : "neon-glow-purple";
                    const iconColor = isPositive ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" : "text-[#a855f7] bg-[#a855f7]/10 border-[#a855f7]/30";
                    const Icon = Brain;
                    return (
                    <div key={index} className={cn("neon-card p-3 flex flex-col h-full border border-border/60", glow)}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn("size-5 rounded-full flex items-center justify-center border shrink-0", iconColor)}>
                          <Icon className="size-3.5" />
                        </div>
                        <p className="text-[9px] text-zinc-500 font-medium shrink-0">Automated Insight</p>
                      </div>
                      <p className="text-[11.5px] font-bold text-zinc-100 mb-1 leading-tight line-clamp-2">{note}</p>
                      <p className="text-[10px] text-zinc-400 leading-relaxed flex-1 line-clamp-3">
                        This observation is based on your recent trading history and performance metrics.
                      </p>
                    </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ────────────────── RIGHT COLUMN (Chat + Quick Actions) ────────────────── */}
          <div className="lg:col-span-1 space-y-4 flex flex-col w-full">
            
            {/* 1. Chat with AI Coach (Fixed Outer Height h-[565px], Internal Scroll) */}
            <div className="neon-card neon-glow-purple flex flex-col h-[565px] min-h-[565px] max-h-[565px] overflow-hidden relative border border-border">
              {/* 4K HD Financial Trading Candlestick & Technical Chart Graphic Background Theme */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 select-none z-0">
                <svg className="w-full h-full text-zinc-500/20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 800 600">
                  <defs>
                    <linearGradient id="chartWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                      <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.45" />
                    </linearGradient>
                    <pattern id="tradingGridPattern" width="36" height="36" patternUnits="userSpaceOnUse">
                      <path d="M 36 0 L 0 0 0 36" fill="none" stroke="rgba(255, 255, 255, 0.035)" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  
                  {/* Background Grid */}
                  <rect width="100%" height="100%" fill="url(#tradingGridPattern)" />
                  
                  {/* Candlestick Silhouettes */}
                  <line x1="50" y1="180" x2="50" y2="360" stroke="#10b981" strokeWidth="1.5" opacity="0.4"/>
                  <rect x="43" y="220" width="14" height="85" fill="#10b981" rx="1.5" opacity="0.3"/>

                  <line x1="110" y1="240" x2="110" y2="420" stroke="#f43f5e" strokeWidth="1.5" opacity="0.4"/>
                  <rect x="103" y="270" width="14" height="110" fill="#f43f5e" rx="1.5" opacity="0.3"/>

                  <line x1="170" y1="200" x2="170" y2="390" stroke="#10b981" strokeWidth="1.5" opacity="0.4"/>
                  <rect x="163" y="230" width="14" height="105" fill="#10b981" rx="1.5" opacity="0.3"/>

                  <line x1="230" y1="160" x2="230" y2="330" stroke="#10b981" strokeWidth="1.5" opacity="0.4"/>
                  <rect x="223" y="180" width="14" height="85" fill="#10b981" rx="1.5" opacity="0.3"/>

                  <line x1="290" y1="210" x2="290" y2="380" stroke="#f43f5e" strokeWidth="1.5" opacity="0.4"/>
                  <rect x="283" y="240" width="14" height="95" fill="#f43f5e" rx="1.5" opacity="0.3"/>

                  <line x1="350" y1="130" x2="350" y2="310" stroke="#10b981" strokeWidth="1.5" opacity="0.4"/>
                  <rect x="343" y="150" width="14" height="110" fill="#10b981" rx="1.5" opacity="0.3"/>

                  <line x1="410" y1="100" x2="410" y2="280" stroke="#10b981" strokeWidth="1.5" opacity="0.4"/>
                  <rect x="403" y="120" width="14" height="90" fill="#10b981" rx="1.5" opacity="0.3"/>

                  <line x1="470" y1="170" x2="470" y2="350" stroke="#f43f5e" strokeWidth="1.5" opacity="0.4"/>
                  <rect x="463" y="200" width="14" height="110" fill="#f43f5e" rx="1.5" opacity="0.3"/>

                  <line x1="530" y1="90" x2="530" y2="260" stroke="#10b981" strokeWidth="1.5" opacity="0.4"/>
                  <rect x="523" y="110" width="14" height="90" fill="#10b981" rx="1.5" opacity="0.3"/>

                  <line x1="590" y1="60" x2="590" y2="230" stroke="#10b981" strokeWidth="1.5" opacity="0.4"/>
                  <rect x="583" y="80" width="14" height="85" fill="#10b981" rx="1.5" opacity="0.3"/>

                  <line x1="650" y1="120" x2="650" y2="290" stroke="#f43f5e" strokeWidth="1.5" opacity="0.4"/>
                  <rect x="643" y="140" width="14" height="90" fill="#f43f5e" rx="1.5" opacity="0.3"/>

                  <line x1="710" y1="50" x2="710" y2="210" stroke="#10b981" strokeWidth="1.5" opacity="0.4"/>
                  <rect x="703" y="70" width="14" height="80" fill="#10b981" rx="1.5" opacity="0.3"/>

                  {/* Volume Sub-chart bars at bottom */}
                  <rect x="45" y="520" width="10" height="50" fill="#10b981" opacity="0.25" rx="1"/>
                  <rect x="105" y="500" width="10" height="70" fill="#f43f5e" opacity="0.25" rx="1"/>
                  <rect x="165" y="510" width="10" height="60" fill="#10b981" opacity="0.25" rx="1"/>
                  <rect x="225" y="530" width="10" height="40" fill="#10b981" opacity="0.25" rx="1"/>
                  <rect x="285" y="490" width="10" height="80" fill="#f43f5e" opacity="0.25" rx="1"/>
                  <rect x="345" y="480" width="10" height="90" fill="#10b981" opacity="0.25" rx="1"/>
                  <rect x="405" y="510" width="10" height="60" fill="#10b981" opacity="0.25" rx="1"/>
                  <rect x="465" y="495" width="10" height="75" fill="#f43f5e" opacity="0.25" rx="1"/>
                  <rect x="525" y="470" width="10" height="100" fill="#10b981" opacity="0.25" rx="1"/>
                  <rect x="585" y="460" width="10" height="110" fill="#10b981" opacity="0.25" rx="1"/>
                  <rect x="645" y="520" width="10" height="50" fill="#f43f5e" opacity="0.25" rx="1"/>
                  <rect x="705" y="450" width="10" height="120" fill="#10b981" opacity="0.25" rx="1"/>

                  {/* Moving Average Wave Lines */}
                  <path d="M 0 380 C 140 370, 200 300, 320 280 C 440 260, 560 150, 800 90" fill="none" stroke="url(#chartWaveGrad)" strokeWidth="2.5" strokeDasharray="5 5" opacity="0.6"/>
                  <path d="M 0 420 C 140 400, 200 340, 320 310 C 440 290, 560 180, 800 120" fill="none" stroke="rgba(168, 85, 247, 0.3)" strokeWidth="1.5"/>
                </svg>
              </div>

              {/* Chat Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 bg-card/60 backdrop-blur-md relative z-10 shrink-0">
                <div className="flex items-center gap-2">
                  <Brain className="size-4 text-purple-400" />
                  <h3 className="text-[14px] font-bold text-foreground">Chat with AI Coach</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex size-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] text-emerald-400 font-semibold">Online</span>
                </div>
              </div>

              {/* Chat Messages */}
              <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto px-5 py-4 space-y-4 custom-scrollbar relative z-10 min-h-0"
              >
                {chatMessages.map((msg, i) => (
                  <div key={i} className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}>
                    <div className="flex items-center gap-2 mb-1 px-1">
                      {msg.role === "coach" && (
                        <div className="size-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                          <Shield className="size-2.5 text-emerald-400" />
                        </div>
                      )}
                      <span className={cn("text-[11px] font-medium", msg.role === "coach" ? "text-zinc-400" : "text-zinc-500")}>
                        {msg.role === "coach" ? "AI Coach" : "You"}
                      </span>
                      <span className="text-[10px] text-zinc-600">{msg.time}</span>
                    </div>
                    <div className={cn(
                      "rounded-2xl px-4 py-2.5 text-[12.5px] leading-relaxed shadow-sm max-w-[92%] break-words overflow-hidden",
                      msg.role === "user"
                        ? "bg-[#4f2a96] text-white rounded-tr-sm border border-[#8b5cf6]/30"
                        : "bg-[#18181b] text-zinc-200 border border-zinc-800 rounded-tl-sm"
                    )}>
                      {msg.role === "coach" ? <FormattedMarkdown content={msg.text} /> : msg.text}
                    </div>
                    
                    {/* Suggested actions from reference */}
                    {msg.role === "coach" && msg.text.includes("profitable trader") && i === chatMessages.length - 1 && (
                      <div className="flex flex-wrap gap-2 mt-2 pl-1">
                        <button onClick={() => handleAskQuestion("Why did I take so many losses this week?")} className="text-[11px] px-3 py-1.5 rounded-full border border-zinc-700/50 bg-zinc-800/30 text-zinc-300 hover:bg-zinc-800 transition cursor-pointer">
                          Why did I take so many losses this week?
                        </button>
                      </div>
                    )}
                    {msg.role === "coach" && (msg.text.includes("I analyzed your trades this week") || msg.text.includes("break of your trading plan")) && i === chatMessages.length - 1 && (
                      <div className="flex flex-wrap gap-2 mt-2.5 pl-1">
                        <button onClick={() => handleAskQuestion("Review my trades in more detail.")} className="text-[11px] px-3.5 py-1.5 rounded-xl border border-zinc-700/50 bg-[#18181b] text-zinc-200 hover:bg-zinc-800 transition cursor-pointer">
                          Review my trades
                        </button>
                        <button onClick={() => handleAskQuestion("Build a trading plan based on these insights.")} className="text-[11px] px-3.5 py-1.5 rounded-xl border border-zinc-700/50 bg-[#18181b] text-zinc-200 hover:bg-zinc-800 transition cursor-pointer">
                          Build a trading plan
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {isAnswering && (
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <Brain className="size-3 text-emerald-500 animate-pulse" />
                      <span className="text-[11px] font-medium text-zinc-400">AI Coach</span>
                    </div>
                    <div className="bg-[#18181b] rounded-2xl px-5 py-3 border border-zinc-800 rounded-tl-sm">
                      <div className="flex gap-1.5">
                        <div className="size-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:0ms]"></div>
                        <div className="size-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:150ms]"></div>
                        <div className="size-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:300ms]"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="px-4 py-3 bg-[#0a0a0e] border-t border-zinc-800/60 relative z-10 shrink-0">
                <form
                  onSubmit={(e) => { e.preventDefault(); handleAskQuestion(customQuestion); }}
                  className="flex items-center gap-2 rounded-xl border border-zinc-700/60 bg-[#18181b] px-3 py-1.5 focus-within:ring-1 focus-within:ring-[#8b5cf6]/30 transition-all"
                >
                  <input
                    type="text"
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-transparent text-[13px] text-zinc-200 outline-none placeholder:text-zinc-600"
                  />
                  <button type="button" onClick={() => setShowAttachmentModal(true)} className="p-1.5 text-zinc-500 hover:text-zinc-300 transition cursor-pointer">
                    <Paperclip className="size-4" />
                  </button>
                  <button type="button" onClick={() => setShowTemplateModal(true)} className="p-1.5 text-zinc-500 hover:text-zinc-300 transition mr-1 cursor-pointer">
                    <FileCode2 className="size-4" />
                  </button>
                  <button
                    type="submit"
                    disabled={!customQuestion.trim() || isAnswering}
                    className="flex size-7 items-center justify-center rounded-lg bg-[#4f2a96] text-white transition-all hover:bg-[#5e34b1] disabled:opacity-50 border border-[#8b5cf6]/30 cursor-pointer"
                  >
                    <Send className="size-3.5" />
                  </button>
                </form>
              </div>
            </div>

            {/* 2. Quick Actions */}
            <div className="neon-card neon-glow-purple p-3.5">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-[13px] font-bold text-zinc-100">Quick Actions</h3>
                <Zap className="size-3.5 text-zinc-500" />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { icon: <BarChart3 className="size-3.5 text-blue-400" />, label: "Analyze Recent Trades", sub: "Get AI insights", glow: "neon-glow-blue" },
                  { icon: <FileText className="size-3.5 text-purple-400" />, label: "Build Trading Plan", sub: "Personalized plan", glow: "neon-glow-purple" },
                  { icon: <FileCheck2 className="size-3.5 text-red-400" />, label: "Review Mistakes", sub: "Learn & improve", glow: "neon-glow-red" },
                  { icon: <Target className="size-3.5 text-emerald-400" />, label: "Strategy Backtest", sub: "Test your strategy", glow: "neon-glow-green" },
                ].map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => handleAskQuestion(action.label)}
                    className={cn("neon-card p-2.5 flex items-center gap-2.5 text-left transition-all group cursor-pointer min-w-0 overflow-hidden", action.glow)}
                  >
                    <div className="flex size-7 shrink-0 items-center justify-center rounded border border-zinc-700/60 bg-zinc-800/50 group-hover:text-zinc-200">
                      {action.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-zinc-200 leading-tight truncate">{action.label}</p>
                      <p className="text-[9px] text-zinc-500 mt-0.5 truncate">{action.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════ MODALS ══════════════ */}
      
      {/* 1. Chart Maximized Modal */}
      {chartMaximized && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6 backdrop-blur-sm">
          <div className="bg-[#0f0f13] border border-zinc-850 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative">
            <button onClick={() => setChartMaximized(false)} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-200 cursor-pointer">
              <X className="size-5" />
            </button>
            <h3 className="text-base font-bold text-zinc-100 mb-4">Your Trading Journey (Full View)</h3>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={journeyData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" {...axisProps} tick={{fill: '#71717a', fontSize: 11}} />
                  <YAxis {...axisProps} tick={{fill: '#71717a', fontSize: 11}} domain={[0, 100]} />
                  <Tooltip {...ttStyle} />
                  <Area type="monotone" dataKey="score" stroke="#a855f7" strokeWidth={3} fill="rgba(168,85,247,0.1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 2. All Recommendations Modal */}
      {showAllRecs && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6 backdrop-blur-sm">
          <div className="bg-[#0f0f13] border border-zinc-850 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[80vh] flex flex-col">
            <button onClick={() => setShowAllRecs(false)} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-200 cursor-pointer">
              <X className="size-5" />
            </button>
            <h3 className="text-base font-bold text-zinc-100 mb-4">All AI Recommendations</h3>
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {[
                { title: "Improve Risk Management", priority: "High Priority", color: "text-emerald-500 border-emerald-500/30 bg-emerald-500/5", desc: "You are risking more than 2% on some trades. Keep it consistent." },
                { title: "Focus on Your A+ Setups", priority: "Medium Priority", color: "text-yellow-500 border-yellow-500/30 bg-yellow-500/5", desc: "You have a 78% win rate on liquidity sweep setups. Trade more of these." },
                { title: "Mindset Work", priority: "Medium Priority", color: "text-blue-500 border-blue-500/30 bg-blue-500/5", desc: "Work on patience and avoiding revenge trading." },
                { title: "Minimize Loss Streak", priority: "High Priority", color: "text-red-500 border-red-500/30 bg-red-500/5", desc: "Your recent streak of 4 consecutive losses suggests you need to step away after 2 losses." },
                { title: "Execution Speed", priority: "Low Priority", color: "text-purple-500 border-purple-500/30 bg-purple-500/5", desc: "Average entry latency is 1.2s. Use limit orders to reduce slippage." }
              ].map((rec) => (
                <div key={rec.title} className="p-4 rounded-xl border border-zinc-800 bg-[#060608] flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-200">{rec.title}</h4>
                    <span className={cn("inline-block text-[9px] font-bold px-2 py-0.5 rounded border mt-1.5", rec.color)}>
                      {rec.priority}
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-2">{rec.desc}</p>
                  </div>
                  <button 
                    onClick={() => {
                      handleAskQuestion(`Give me a detailed action plan for: ${rec.title}. Context: ${rec.desc}`);
                      setShowAllRecs(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 text-[11px] text-zinc-300 hover:bg-zinc-700 transition shrink-0 cursor-pointer"
                  >
                    Get Action Plan
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. All Notes Modal */}
      {showAllNotes && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6 backdrop-blur-sm">
          <div className="bg-[#0f0f13] border border-zinc-850 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[80vh] flex flex-col">
            <button onClick={() => setShowAllNotes(false)} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-200 cursor-pointer">
              <X className="size-5" />
            </button>
            <h3 className="text-base font-bold text-zinc-100 mb-4">All Historical Coach Notes</h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {[
                { title: "Great Improvement!", time: "Today, 10:30 AM", desc: "You followed your trading plan well today. Keep it up!", tag: "Positive", color: "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" },
                { title: "Risk Alert", time: "Yesterday, 09:15 AM", desc: "You risked 3.2% in one trade. Remember your 1-2% rule.", tag: "Alert", color: "text-yellow-500 border-yellow-500/20 bg-yellow-500/5" },
                { title: "Strategy Tip", time: "Aug 12, 08:40 AM", desc: "Focus on liquidity + market structure alignment.", tag: "Tip", color: "text-blue-500 border-blue-500/20 bg-blue-500/5" },
                { title: "Mindset Reminder", time: "Aug 11, 07:20 AM", desc: "Stay patient. The right setups will come.", tag: "Reminder", color: "text-[#a855f7] border-[#a855f7]/20 bg-[#a855f7]/5" },
                { title: "Patience Pays Off", time: "Aug 10, 04:15 PM", desc: "Waited 2 hours for setup. Solid execution.", tag: "Positive", color: "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" },
                { title: "Slippage Warning", time: "Aug 09, 11:30 AM", desc: "High slippage on market orders during news.", tag: "Alert", color: "text-yellow-500 border-yellow-500/20 bg-yellow-500/5" }
              ].map((note, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-zinc-800 bg-[#060608] flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-zinc-500 font-medium">{note.time}</span>
                    <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded border", note.color)}>{note.tag}</span>
                  </div>
                  <h4 className="text-xs font-bold text-zinc-200">{note.title}</h4>
                  <p className="text-[11px] text-zinc-400 mt-1">{note.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Attachment Modal */}
      {showAttachmentModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6 backdrop-blur-sm">
          <div className="bg-[#0f0f13] border border-zinc-850 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <button onClick={() => setShowAttachmentModal(false)} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-200 cursor-pointer">
              <X className="size-5" />
            </button>
            <h3 className="text-sm font-bold text-zinc-100 mb-3">Attach File to AI Chat</h3>
            <p className="text-[11px] text-zinc-400 mb-4">Select a mock document to attach to your coach analysis prompt:</p>
            <div className="space-y-2">
              {[
                { name: "trade_log_august.csv", size: "12 KB" },
                { name: "trading_rules_v2.pdf", size: "142 KB" },
                { name: "pnl_screenshot.png", size: "480 KB" }
              ].map((f) => (
                <button
                  key={f.name}
                  onClick={() => {
                    setCustomQuestion(`Attached file [${f.name}]: Please review this file context alongside my question. `);
                    setShowAttachmentModal(false);
                  }}
                  className="w-full text-left p-3 rounded-lg border border-zinc-800 bg-[#060608] hover:border-zinc-700/60 hover:bg-zinc-900/50 transition text-[11px] flex justify-between cursor-pointer"
                >
                  <span className="text-zinc-300 font-bold">{f.name}</span>
                  <span className="text-zinc-500">{f.size}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6 backdrop-blur-sm">
          <div className="bg-[#0f0f13] border border-zinc-850 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setShowTemplateModal(false)} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-200 cursor-pointer">
              <X className="size-5" />
            </button>
            <h3 className="text-sm font-bold text-zinc-100 mb-3">Trading Prompt Templates</h3>
            <p className="text-[11px] text-zinc-400 mb-4">Select a trading coach template prompt to pre-fill the chat box:</p>
            <div className="space-y-2.5">
              {[
                { name: "Plan Critique", text: "Critique my risk parameters based on my last 5 losing trades." },
                { name: "Psychology Check", text: "I feel anxious after 2 consecutive losses. Give me a psychological stabilization drill." },
                { name: "Setups Optimizer", text: "Review the setups I logged recently and suggest which one I should drop." }
              ].map((t) => (
                <button
                  key={t.name}
                  onClick={() => {
                    setCustomQuestion(t.text);
                    setShowTemplateModal(false);
                  }}
                  className="w-full text-left p-3 rounded-lg border border-zinc-800 bg-[#060608] hover:border-zinc-700/60 hover:bg-zinc-900/50 transition cursor-pointer"
                >
                  <p className="text-[11px] font-bold text-[#8b5cf6]">{t.name}</p>
                  <p className="text-[10px] text-zinc-400 mt-1">{t.text}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
