import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Badge, Panel } from "@/components/app/ui-kit";
import { fetchUserTrades, type Trade } from "@/lib/trades";
import { useAuth } from "@/lib/auth-context";
import { analyzeTradeDataWithAI } from "@/lib/ai-coach-service";
import { DAILY_QUOTES, getDailyQuoteIndex } from "@/lib/daily-quotes";
import { TraderEdgeIntelligence } from "@/components/app/TraderEdgeIntelligence";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Crown,
  MessageSquare,
  RefreshCw,
  Send,
  Shield,
  Sparkles,
  Target,
  Zap,
  Flame,
  Award,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/ai-coach")({
  head: () => ({
    meta: [
      { title: "AI Coach — Edge Journal" },
      {
        name: "description",
        content:
          "World-class AI trading mentor: weekly golden rules, institutional performance grades, psychology analysis, and risk reviews.",
      },
      { property: "og:title", content: "AI Coach — Edge Journal" },
      { property: "og:description", content: "World-class AI trading mentor & performance lab." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => {
    return {
      chat: (search["chat"] as string) === 'true' || search["chat"] === true,
    }
  },
  component: CoachPage,
});

// ── 3D Circular Progress Score Gauge ─────────────────────────────────────────
function Gauge3D({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "primary" | "accent" | "win";
}) {
  const colorStr =
    tone === "win"
      ? "oklch(0.72 0.19 155)"
      : tone === "accent"
        ? "var(--color-accent)"
        : "var(--color-primary)";

  return (
    <div className="flex flex-col items-center gap-2.5 group">
      <div
        className="relative grid size-32 place-items-center rounded-full transition-transform duration-500 hover:scale-105"
        style={{
          background: `conic-gradient(${colorStr} ${value * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
          boxShadow: `0 0 25px -5px ${colorStr}40`,
        }}
      >
        <div className="grid size-24 place-items-center rounded-full bg-card/90 backdrop-blur-xl border border-border/60 shadow-inner">
          <span className="font-display text-3xl font-bold tracking-tight text-foreground">
            {value}
          </span>
        </div>
      </div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

// ── List Component for Strengths / Mistakes ──────────────────────────────────
function List3D({ items, tone }: { items: string[]; tone: "good" | "bad" }) {
  return (
    <ul className="space-y-3 text-sm">
      {items.map((item, idx) => (
        <li
          key={idx}
          className="flex items-start gap-3 rounded-xl border border-border/40 bg-card/40 p-3 backdrop-blur-sm transition hover:bg-card/70"
        >
          {tone === "good" ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
          ) : (
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          )}
          <span className="leading-relaxed text-muted-foreground">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function CoachPage() {
  const { session, siteSettings } = useAuth();
  const [userTrades, setUserTrades] = useState<Trade[]>([]);
  const [activeQuoteIdx, setActiveQuoteIdx] = useState<number>(getDailyQuoteIndex());
  const { chat } = Route.useSearch();

  // Interactive AI Assistant Chat State
  const [customQuestion, setCustomQuestion] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "coach"; text: string }>>(
    [],
  );
  const [isAnswering, setIsAnswering] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  // Initialize welcome message
  useEffect(() => {
    if (isChatModalOpen && chatMessages.length === 0) {
      setChatMessages([
        {
          role: "coach",
          text: "Ready to analyze your trade?\n\nShare your trade details, setup, reasoning, result, or mistakes and I'll help you review the trade.",
        },
      ]);
    }
  }, [isChatModalOpen, chatMessages.length]);

  if (siteSettings && !siteSettings.ai_coach_enabled) {
    return (
      <AppShell title="AI Coach" subtitle="Institutional Trading Psychology & Risk Grading">
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="rounded-full bg-primary/10 p-6 text-primary">
            <Brain className="size-16 animate-pulse" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-foreground">AI Coach Offline</h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            The AI Trading Coach is temporarily disabled by the administrator. Please check back
            later.
          </p>
        </div>
      </AppShell>
    );
  }

  // Auto-open chat if URL parameter specifies it
  useEffect(() => {
    if (chat) {
      setIsChatModalOpen(true);
    }
  }, [chat]);

  // Pre-Trading Readiness State
  const [readinessState, setReadinessState] = useState({
    emotion: "Calm",
    prep: "Prepared",
    risk: "Strict 1%",
  });

  useEffect(() => {
    fetchUserTrades().then((data) => setUserTrades(data));
  }, []);

  const ai = analyzeTradeDataWithAI(userTrades);
  const selectedQuote = DAILY_QUOTES[activeQuoteIdx] || DAILY_QUOTES[0];
  const isCurrentDay = activeQuoteIdx === getDailyQuoteIndex();

  // Handle Interactive Chat Prompt Selection / Submit
  const handleAskQuestion = async (questionText: string) => {
    if (!questionText.trim()) return;

    const userMsg = questionText.trim();
    setChatMessages((prev) => [...prev, { role: "user", text: userMsg }]);
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
          tradeContext: `Current Daily Quote: "${selectedQuote}". Win Rate: ${ai.qualityScore}%. Overall Grade: ${ai.overallGrade}.`,
        }),
        signal: AbortSignal.timeout(20000),
      });

      const data = await res.json();

      console.log(`[Diagnostic] Request: POST /api/ai-coach`);
      console.log(`[Diagnostic] HTTP Status: ${res.status}`);
      console.log(`[Diagnostic] JSON Keys: ${Object.keys(data).join(", ")}`);

      if (res.ok && data.reply) {
        setChatMessages((prev) => [...prev, { role: "coach", text: data.reply }]);
        if (data.modelUsed) {
          console.log(`[Groq AI] Responded via ${data.modelUsed}`);
        }
      } else {
        const errReply =
          data.error || "Sorry, I am unable to generate a response right now. Please try again.";
        setChatMessages((prev) => [...prev, { role: "coach", text: `⚠️ ${errReply}` }]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "coach",
          text: "Network connection error. Please check your connection and try again.",
        },
      ]);
    } finally {
      setIsAnswering(false);
    }
  };

  // Readiness Score Calculation
  const readinessScore =
    (readinessState.emotion === "Calm" ? 35 : readinessState.emotion === "Focused" ? 30 : 15) +
    (readinessState.prep === "Prepared" ? 35 : readinessState.prep === "Neutral" ? 20 : 10) +
    (readinessState.risk === "Strict 1%" ? 30 : readinessState.risk === "Flexible" ? 20 : 10);

  return (
    <AppShell title="AI Coach" subtitle="World-Class AI Trading Mentor & Performance Lab">
      {/* ── Top Hero Header Card ───────────────────────────────────────────── */}
      <section className="glass relative overflow-hidden rounded-[2.5rem] border border-border/80 p-6 sm:p-8 shadow-2xl">
        <div className="pointer-events-none absolute -left-20 -top-20 size-80 rounded-full bg-primary/20 blur-3xl animate-float-slow" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 size-80 rounded-full bg-accent/20 blur-3xl animate-float-slow [animation-delay:2s]" />

        <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="relative grid size-16 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg glow-primary">
              <Brain className="size-8 animate-pulse" />
              <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-emerald-500 text-[10px] font-bold text-black ring-2 ring-background">
                ✓
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl text-gradient">
                  AI Performance Lab
                </h1>
                <Badge tone="primary">
                  <Sparkles className="mr-1 size-3" /> LIVE MENTOR ONLINE
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Institutional execution grading, weekly trading psychology rules &amp; risk
                management.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-center backdrop-blur-md">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                Pre-Trade Readiness
              </p>
              <p className="font-display text-lg font-bold text-foreground">{readinessScore}%</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main 3D Grid ─────────────────────────────────────────────────── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* ── 1. Daily Golden Rules Showcase ────────────────────── */}
        <Panel
          className="lg:col-span-3 border-primary/40 bg-gradient-to-br from-card/80 via-card/50 to-primary/5 shadow-2xl relative overflow-hidden"
          action={
            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setActiveQuoteIdx((prev) => (prev > 0 ? prev - 1 : DAILY_QUOTES.length - 1))
                }
                title="Previous Quote"
                className="grid size-8 place-items-center rounded-lg border border-border/60 bg-card/60 text-muted-foreground transition hover:border-primary/50 hover:text-foreground active:scale-95"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setActiveQuoteIdx(getDailyQuoteIndex())}
                title="Current Day"
                className="flex items-center gap-1 rounded-lg border border-border/60 bg-card/60 px-2.5 py-1 text-xs font-semibold text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
              >
                <RefreshCw className="size-3" />
                {isCurrentDay ? "Current" : "Reset"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveQuoteIdx((prev) => (prev < DAILY_QUOTES.length - 1 ? prev + 1 : 0))
                }
                title="Next Quote"
                className="grid size-8 place-items-center rounded-lg border border-border/60 bg-card/60 text-muted-foreground transition hover:border-primary/50 hover:text-foreground active:scale-95"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          }
        >
          <div className="relative grid gap-6 md:grid-cols-[auto_1fr] md:items-center p-2">
            <div className="grid size-20 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-primary/30 via-accent/20 to-card border border-primary/40 text-primary shadow-xl glow-primary">
              <Crown className="size-10 text-primary animate-bounce-subtle" />
            </div>
            <div>
              <blockquote className="text-xl leading-relaxed text-foreground font-medium italic border-l-2 border-primary/50 pl-4 py-2">
                "{selectedQuote}"
              </blockquote>
            </div>
          </div>
        </Panel>

        {/* ── 2. Performance Grade 3D Gauges ──────────────────────────────── */}
        <Panel
          className="lg:col-span-2 shadow-xl"
          title="Institutional Execution Grade"
          action={
            <Badge tone="primary">
              <Award className="mr-1 size-3" /> AI GRADED
            </Badge>
          }
        >
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around py-4">
            <Gauge3D value={ai.qualityScore} label="Trade Quality Score" tone="primary" />
            <Gauge3D value={ai.institutionalScore} label="Institutional Score" tone="accent" />
            <div className="text-center">
              <div className="relative grid size-32 place-items-center rounded-3xl bg-gradient-to-br from-primary via-accent to-primary text-primary-foreground shadow-2xl glow-primary transition-transform duration-500 hover:scale-105">
                <span className="font-display text-5xl font-extrabold tracking-tight">
                  {ai.overallGrade}
                </span>
              </div>
              <p className="mt-2.5 text-xs font-medium text-muted-foreground">
                Overall Performance Grade
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-border/50 bg-card/40 p-3 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Discipline
              </p>
              <p className="mt-1 font-display text-lg font-bold text-emerald-400">
                {ai.disciplineScore} / 100
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/40 p-3 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Patience
              </p>
              <p className="mt-1 font-display text-lg font-bold text-primary">
                {ai.patienceScore} / 100
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/40 p-3 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Risk Control
              </p>
              <p className="mt-1 font-display text-lg font-bold text-accent">
                {ai.riskControlScore} / 100
              </p>
            </div>
          </div>
        </Panel>

        {/* ── 3. Pre-Trading Psychological Readiness Assessor ─────────────── */}
        <Panel title="Pre-Trading Readiness Assessor" className="shadow-xl">
          <p className="text-xs text-muted-foreground mb-4">
            Assess your psychological state before taking any trade entries today:
          </p>
          <div className="space-y-4 text-xs">
            <div>
              <p className="font-medium text-foreground mb-1.5 flex justify-between">
                <span>Emotional State</span>
                <span className="text-primary font-bold">{readinessState.emotion}</span>
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {["Calm", "Focused", "Anxious"].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setReadinessState((p) => ({ ...p, emotion: val }))}
                    className={`rounded-lg py-1.5 font-medium transition ${
                      readinessState.emotion === val
                        ? "bg-primary text-primary-foreground shadow"
                        : "bg-card/50 text-muted-foreground hover:bg-card"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="font-medium text-foreground mb-1.5 flex justify-between">
                <span>Market Preparation</span>
                <span className="text-accent font-bold">{readinessState.prep}</span>
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {["Prepared", "Neutral", "Unprepared"].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setReadinessState((p) => ({ ...p, prep: val }))}
                    className={`rounded-lg py-1.5 font-medium transition ${
                      readinessState.prep === val
                        ? "bg-accent text-accent-foreground shadow"
                        : "bg-card/50 text-muted-foreground hover:bg-card"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="font-medium text-foreground mb-1.5 flex justify-between">
                <span>Risk Management Plan</span>
                <span className="text-emerald-400 font-bold">{readinessState.risk}</span>
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {["Strict 1%", "Flexible", "High Risk"].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setReadinessState((p) => ({ ...p, risk: val }))}
                    className={`rounded-lg py-1.5 font-medium transition ${
                      readinessState.risk === val
                        ? "bg-emerald-500 text-black shadow"
                        : "bg-card/50 text-muted-foreground hover:bg-card"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-border/50 bg-background/50 p-3 text-center">
            <p className="text-[11px] text-muted-foreground">Readiness Assessment:</p>
            <p
              className={`font-display text-sm font-bold mt-0.5 ${
                readinessScore >= 80
                  ? "text-emerald-400"
                  : readinessScore >= 60
                    ? "text-amber-400"
                    : "text-destructive"
              }`}
            >
              {readinessScore}% —{" "}
              {readinessScore >= 80
                ? "Optimal Trading State"
                : readinessScore >= 60
                  ? "Proceed With Caution"
                  : "Do Not Trade — Risk High"}
            </p>
          </div>
        </Panel>

        {/* ── 4. Interactive AI Mentor Chat Trigger Card ───────────── */}
        <div
          onClick={() => setIsChatModalOpen(true)}
          className="lg:col-span-3 group relative cursor-pointer overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-6 shadow-xl backdrop-blur-md transition-all hover:border-primary/50 hover:bg-card/80 hover:shadow-[0_0_40px_-10px_var(--color-primary)]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg glow-primary transition-transform duration-500 group-hover:scale-110">
                <Brain className="size-7" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  AI Trading Mentor
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Personal AI guidance for your trading journey.
                </p>
              </div>
            </div>
            <button className="hidden sm:flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              Open AI Mentor
            </button>
          </div>
        </div>

        {/* ── Chat Modal/Drawer ────────────────────────────────────────────── */}
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-[60] bg-background/60 backdrop-blur-sm transition-opacity duration-300 ${
              isChatModalOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setIsChatModalOpen(false)}
          />

          {/* Drawer */}
          <div
            className={`fixed inset-y-0 right-0 z-[70] flex w-full flex-col border-l border-primary/20 bg-card/95 shadow-[0_0_50px_-12px_var(--color-primary)] backdrop-blur-2xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:w-[500px] lg:w-[600px] ${
              isChatModalOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Header */}
            <div className="relative flex items-center justify-between border-b border-primary/10 bg-gradient-to-r from-primary/5 to-transparent px-6 py-5">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <div className="flex items-center gap-4">
                <div className="grid size-10 place-items-center rounded-xl bg-primary shadow-lg shadow-primary/30 text-primary-foreground">
                  <Brain className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-foreground leading-none">
                    Edge AI
                  </h3>
                  <p className="mt-1 text-xs font-medium tracking-wide text-muted-foreground">
                    Analyze your trade. Understand your decisions. Improve your process.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsChatModalOpen(false)}
                className="grid size-8 place-items-center rounded-full hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
              >
                ✕
              </button>
            </div>

            {/* Chat Content */}
            <div className="flex flex-col flex-1 overflow-hidden p-6 space-y-6">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Zap className="size-3 text-primary" /> Suggested Prompts
                </span>
                <div className="flex flex-wrap gap-2">
                  {ai.suggestedPrompts.map((promptText) => (
                    <button
                      key={promptText}
                      type="button"
                      onClick={() => handleAskQuestion(promptText)}
                      className="rounded-xl border border-border/60 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/60 hover:text-foreground hover:bg-primary/5 active:scale-95"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 rounded-2xl border border-border/60 bg-background/40 p-4 shadow-inner">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 text-sm ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "coach" && (
                      <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-sm">
                        <Brain className="size-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 leading-relaxed shadow-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground font-medium rounded-tr-sm"
                          : "border border-border/50 bg-card/90 text-foreground rounded-tl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isAnswering && (
                  <div className="flex gap-2 items-center text-xs text-muted-foreground italic px-2">
                    <Brain className="size-4 animate-spin text-primary" /> AI Coach is thinking...
                  </div>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAskQuestion(customQuestion);
                }}
                className="flex items-center gap-3 pt-2"
              >
                <input
                  type="text"
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder="Discuss setups, psychology, risk..."
                  className="w-full flex-1 rounded-xl border border-border/60 bg-card/50 px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/60 focus:bg-card focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="submit"
                  disabled={!customQuestion.trim() || isAnswering}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-tr from-primary to-accent h-11 w-12 text-primary-foreground transition hover:opacity-90 active:scale-95 disabled:opacity-50 shadow-lg glow-primary"
                >
                  <Send className="size-4 ml-1" />
                </button>
              </form>
            </div>
          </div>
        </>

        {/* ── 5. Top Execution Mistakes & Strengths ────────────────────────── */}
        <Panel title="Top Execution Mistakes">
          <List3D tone="bad" items={ai.topMistakes} />
        </Panel>

        <Panel title="Top Strengths">
          <List3D tone="good" items={ai.topStrengths} />
        </Panel>

        <Panel title="30-Day Improvement Plan">
          <ol className="space-y-3 text-sm text-muted-foreground">
            {ai.improvementPlan.map((step, idx) => (
              <li
                key={step}
                className="flex items-start gap-3 rounded-xl border border-border/40 bg-card/40 p-3 backdrop-blur-sm"
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </Panel>

        {/* ── 6. Psychology & Risk Reviews ─────────────────────────────────── */}
        <Panel title="Psychology Analysis" className="flex flex-col">
          <p className="text-sm leading-relaxed text-muted-foreground">{ai.psychologyText}</p>
          <div className="mt-auto pt-4 grid grid-cols-3 gap-2 sm:gap-3">
            {[
              ["FOMO Trading", "Low"],
              ["Revenge Trading", "Controlled"],
              ["Overconfidence", "Low"],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex flex-col items-center justify-center text-center rounded-xl border border-border/40 bg-muted/30 p-2 sm:p-3 min-h-[72px] sm:min-h-[84px] gap-1"
              >
                <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-muted-foreground w-full break-words">
                  {k}
                </p>
                <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm font-bold text-foreground">{v}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Risk Management Review" className="flex flex-col">
          <div className="space-y-4 text-sm text-muted-foreground my-auto">
            <p className="flex items-start gap-3">
              <Shield className="mt-0.5 size-5 shrink-0 text-primary" />
              <span className="leading-relaxed">{ai.riskReviewText}</span>
            </p>
            <p className="flex items-start gap-3">
              <Target className="mt-0.5 size-5 shrink-0 text-accent" />
              <span className="leading-relaxed">
                Target minimum 1:2.0 Risk:Reward ratio on all high-conviction entries.
              </span>
            </p>
          </div>
        </Panel>

        {/* ── Trader Edge Intelligence (Fills empty 3rd column) ──────────── */}
        <TraderEdgeIntelligence trades={userTrades} />

        {/* ── 7. Final Coach Verdict ───────────────────────────────────────── */}
        <Panel className="lg:col-span-3 border-primary/30 bg-gradient-to-r from-card via-card/80 to-primary/5 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg glow-primary">
              <Sparkles className="size-6" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                Final Coach Verdict
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground font-medium">
                {ai.finalVerdict}
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
