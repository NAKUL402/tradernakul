import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Badge, Panel } from "@/components/app/ui-kit";
import { fetchUserTrades, type Trade } from "@/lib/trades";
import {
  analyzeTradeDataWithAI,
  sendChatMessageToAI,
  type ChatMessage,
} from "@/lib/ai-coach-service";
import {
  AlertCircle,
  AlertTriangle,
  Brain,
  CheckCircle2,
  Crown,
  Loader2,
  MessageSquare,
  Send,
  Shield,
  Sparkles,
  Target,
  User,
} from "lucide-react";

export const Route = createFileRoute("/ai-coach")({
  head: () => ({
    meta: [
      { title: "AI Coach — Trading Journal AI" },
      {
        name: "description",
        content:
          "Your live Gemini AI trading coach: interactive chat, trade analysis, risk management, and psychology reviews.",
      },
      { property: "og:title", content: "AI Coach — Trading Journal AI" },
      {
        property: "og:description",
        content: "Chat with live Gemini AI trading mentor for instant answers and analysis.",
      },
    ],
  }),
  component: Coach,
});

function Ring({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="grid size-32 place-items-center rounded-full"
        style={{
          background: `conic-gradient(var(--color-primary) ${value * 3.6}deg, var(--color-muted) 0deg)`,
        }}
      >
        <div className="grid size-24 place-items-center rounded-full bg-background">
          <span className="font-display text-2xl font-semibold">{value}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function List({ items, tone }: { items: string[]; tone: "good" | "bad" }) {
  return (
    <ul className="space-y-2.5 text-sm">
      {items.map((i) => (
        <li key={i} className="flex gap-2.5">
          {tone === "good" ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[oklch(0.72_0.19_155)]" />
          ) : (
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          )}
          <span className="text-muted-foreground">{i}</span>
        </li>
      ))}
    </ul>
  );
}

const SUGGESTED_PROMPTS = [
  "Hi",
  "What is 2+2?",
  "Explain liquidity sweep in trading.",
  "How should I manage risk after 2 consecutive losses?",
];

function Coach() {
  const [userTrades, setUserTrades] = useState<Trade[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      role: "assistant",
      content:
        "Welcome! I am your live Gemini AI Trading Coach. Ask me anything about trading concepts, strategy, math, or ask me to analyze your logged trade history.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  // Rate-limit cooldown: seconds remaining before next message is allowed
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchUserTrades().then((data) => setUserTrades(data));
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const startCooldown = (seconds: number) => {
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    setRateLimitCooldown(seconds);
    cooldownTimerRef.current = setInterval(() => {
      setRateLimitCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownTimerRef.current!);
          cooldownTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    // Block sending during loading OR rate-limit cooldown
    if (!text || loading || rateLimitCooldown > 0) return;

    setApiError(null);
    setInputMessage("");

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    // ── IMPORTANT FIX ────────────────────────────────────────────────────────
    // Pass `messages` (history BEFORE current turn) NOT `[...messages, userMsg]`.
    // The API handler appends the current message itself from the `message` param.
    // Sending `newHistory` would duplicate the user message in the Gemini payload.
    const historyBeforeCurrentTurn = messages;

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const replyText = await sendChatMessageToAI(text, historyBeforeCurrentTurn, userTrades);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      const errDetail = err instanceof Error ? err.message : "Failed to communicate with AI Coach.";
      setApiError(errDetail);

      // Start a 60-second cooldown if rate-limited
      if (errDetail.includes("rate limit") || errDetail.includes("rate-limit") || errDetail.includes("429")) {
        startCooldown(60);
      }

      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `⚠️ ${errDetail}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const ai = analyzeTradeDataWithAI(userTrades);

  return (
    <AppShell title="AI Coach" subtitle="Aapka personal live Gemini AI trading mentor">
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Live Interactive Chatbot Panel */}
        <Panel
          className="lg:col-span-3"
          title="Live AI Trading Coach Chatbot"
          action={
            <Badge tone="primary">
              <Sparkles className="mr-1 size-3" /> Live Gemini API
            </Badge>
          }
        >
          <div className="flex flex-col rounded-2xl border border-border/80 bg-card/60 shadow-sm overflow-hidden">
            {/* Chat Messages Container */}
            <div
              ref={chatContainerRef}
              className="flex max-h-[420px] min-h-[280px] flex-col gap-4 overflow-y-auto p-4 sm:p-6"
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 text-sm ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {m.role === "assistant" && (
                    <div
                      className={`grid size-8 shrink-0 place-items-center rounded-xl ${
                        m.isError
                          ? "bg-destructive/20 text-destructive"
                          : "bg-primary/20 text-primary"
                      }`}
                    >
                      {m.isError ? (
                        <AlertCircle className="size-4" />
                      ) : (
                        <Brain className="size-4" />
                      )}
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 leading-relaxed ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground font-medium rounded-tr-none"
                        : m.isError
                        ? "bg-destructive/10 text-destructive border border-destructive/30 rounded-tl-none"
                        : "bg-muted/60 text-foreground border border-border/50 rounded-tl-none"
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">{m.content}</div>
                    <span
                      className={`mt-1.5 block text-[10px] ${
                        m.role === "user"
                          ? "text-primary-foreground/70 text-right"
                          : "text-muted-foreground"
                      }`}
                    >
                      {m.timestamp}
                    </span>
                  </div>

                  {m.role === "user" && (
                    <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-accent/20 text-accent">
                      <User className="size-4" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 text-sm justify-start">
                  <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/20 text-primary">
                    <Brain className="size-4 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl bg-muted/60 p-4 text-muted-foreground border border-border/50 rounded-tl-none">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span>Gemini AI is thinking…</span>
                  </div>
                </div>
              )}
            </div>

            {/* Rate-limit countdown banner */}
            {rateLimitCooldown > 0 && (
              <div className="mx-4 mb-2 flex items-center gap-2 rounded-xl bg-amber-500/15 p-3 text-xs font-medium text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <Loader2 className="size-4 shrink-0 animate-spin" />
                <span>
                  Rate limit reached. Next message available in{" "}
                  <strong>{rateLimitCooldown}s</strong>. Gemini free tier allows ~10 requests/minute.
                </span>
              </div>
            )}

            {/* Error Alert Box */}
            {apiError && rateLimitCooldown === 0 && (
              <div className="mx-4 mb-2 flex items-center gap-2 rounded-xl bg-destructive/15 p-3 text-xs font-medium text-destructive border border-destructive/30">
                <AlertCircle className="size-4 shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Suggested Quick Prompts */}
            <div className="border-t border-border/60 bg-muted/20 px-4 py-2.5">
              <p className="mb-2 text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="size-3 text-primary" /> Try asking Gemini AI:
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={loading || rateLimitCooldown > 0}
                    onClick={() => handleSendMessage(prompt)}
                    className="rounded-lg border border-border/70 bg-card px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent/10 hover:text-foreground transition disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 border-t border-border/60 bg-card p-3"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask Gemini AI Coach anything (e.g. 'Explain liquidity sweep' or 'Hi')..."
                disabled={loading}
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim() || rateLimitCooldown > 0}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition disabled:opacity-50 shrink-0"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : rateLimitCooldown > 0 ? (
                  <span className="tabular-nums">{rateLimitCooldown}s</span>
                ) : (
                  <>
                    <span>Send</span>
                    <Send className="size-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </Panel>

        {/* Existing Performance Cards */}
        <Panel
          className="lg:col-span-2"
          title="Performance Grade"
          action={
            <Badge tone="primary">
              <Sparkles className="mr-1 size-3" /> Trade Data
            </Badge>
          }
        >
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
            <Ring value={ai.qualityScore} label="Trade Quality Score" />
            <Ring value={ai.institutionalScore} label="Institutional Score" />
            <div className="text-center">
              <div className="grid size-32 place-items-center rounded-3xl bg-gradient-to-br from-primary to-accent text-primary-foreground glow-primary">
                <span className="font-display text-5xl font-bold">{ai.overallGrade}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Overall Grade</p>
            </div>
          </div>
          <p className="mt-6 rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground">
            <Brain className="mr-2 inline size-4 text-primary" />
            {ai.psychologyText}
          </p>
        </Panel>

        <Panel title="Golden Rule">
          <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 p-4">
            <Crown className="size-5 text-primary" />
            <p className="mt-3 font-display text-base font-semibold">{ai.goldenRule}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Yeh rule aapke actual trade history ke patterns se nikala gaya hai.
            </p>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Discipline</span>
              <Badge tone="win">{ai.disciplineScore} / 100</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Patience</span>
              <Badge tone="primary">{ai.patienceScore} / 100</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Risk Control</span>
              <Badge tone="loss">{ai.riskControlScore} / 100</Badge>
            </div>
          </div>
        </Panel>

        <Panel title="Top Execution Mistakes">
          <List tone="bad" items={ai.topMistakes} />
        </Panel>

        <Panel title="Top Strengths">
          <List tone="good" items={ai.topStrengths} />
        </Panel>

        <Panel title="Improvement Plan (30 days)">
          <ol className="space-y-3 text-sm text-muted-foreground">
            {ai.improvementPlan.map((t, i) => (
              <li key={t} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                {t}
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title="Psychology Analysis">
          <p className="text-sm text-muted-foreground">{ai.psychologyText}</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            {[
              ["FOMO", "Medium"],
              ["Revenge", "High"],
              ["Overconfidence", "Low"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-muted/40 p-3">
                <p className="text-muted-foreground">{k}</p>
                <p className="mt-1 font-semibold">{v}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Risk Management Review">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <Shield className="mr-2 inline size-4 text-primary" />
              {ai.riskReviewText}
            </p>
            <p>
              <Target className="mr-2 inline size-4 text-accent" />
              Profit factor target minimum 2.0 rakho.
            </p>
          </div>
        </Panel>

        <Panel title="Final Coach Verdict" className="lg:col-span-3">
          <p className="text-sm text-muted-foreground">{ai.finalVerdict}</p>
        </Panel>
      </div>
    </AppShell>
  );
}
