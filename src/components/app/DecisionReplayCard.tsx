import { useState, useMemo } from "react";
import { type Trade } from "@/lib/trades";
import { Panel } from "@/components/app/ui-kit";
import { Brain, ArrowRight, MessageSquare, Target, ChevronRight } from "lucide-react";

type Insight = {
  plan: string;
  action: string;
  gapText: string;
  question: string;
};

export function DecisionReplayCard({ trades }: { trades: Trade[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reflection, setReflection] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const insight = useMemo<Insight | null>(() => {
    if (!trades || trades.length === 0) return null;

    // Analyze the last 20 trades max
    const recent = trades.slice(0, 20);

    let earlyCount = 0;
    let fomoCount = 0;
    let lateCount = 0;
    let oversizeCount = 0;
    let revengeCount = 0;

    for (const t of recent) {
      const text =
        `${t.mistakes || ""} ${t.notes || ""} ${t.tags?.join(" ") || ""} ${t.reason || ""} ${t.setup || ""}`.toLowerCase();

      if (text.includes("early") || text.includes("premature")) earlyCount++;
      if (text.includes("fomo") || text.includes("chase") || text.includes("chased")) fomoCount++;
      if (text.includes("late") || text.includes("hesitat")) lateCount++;
      if (text.includes("oversize") || text.includes("lot") || text.includes("risk"))
        oversizeCount++;
      if (text.includes("revenge") || text.includes("tilt")) revengeCount++;
    }

    const counts = [
      { key: "early", count: earlyCount },
      { key: "fomo", count: fomoCount },
      { key: "late", count: lateCount },
      { key: "oversize", count: oversizeCount },
      { key: "revenge", count: revengeCount },
    ].sort((a, b) => b.count - a.count);

    const top = counts[0];
    if (!top || top.count < 1) return null; // Found no matching patterns

    const sampleSize = recent.length;

    switch (top.key) {
      case "early":
        return {
          plan: "Wait for confirmation",
          action: "Entered before confirmation",
          gapText: `${top.count} of your last ${sampleSize} trades followed this pattern.`,
          question: "What were you trying to avoid by entering early?",
        };
      case "fomo":
        return {
          plan: "Follow predefined strategy",
          action: "Chased the trade (FOMO)",
          gapText: `${top.count} of your last ${sampleSize} trades showed this deviation.`,
          question: "What were you afraid of missing out on?",
        };
      case "late":
        return {
          plan: "Execute immediately on signal",
          action: "Hesitated and entered late",
          gapText: `${top.count} of your last ${sampleSize} trades were delayed.`,
          question: "What caused the hesitation when the setup appeared?",
        };
      case "oversize":
        return {
          plan: "Stick to strict risk management",
          action: "Oversized the position",
          gapText: `Risk parameters were breached in ${top.count} of your last ${sampleSize} trades.`,
          question: "What drove the need to increase risk on this setup?",
        };
      case "revenge":
        return {
          plan: "Accept loss & step away",
          action: "Revenge traded to recover",
          gapText: `${top.count} of your last ${sampleSize} trades were emotionally driven.`,
          question: "What feeling were you trying to resolve immediately after the loss?",
        };
      default:
        return null;
    }
  }, [trades]);

  if (!insight) {
    return (
      <Panel title="Decision Replay" className="flex flex-col h-full shadow-lg">
        <div className="flex min-h-[280px] flex-col items-center justify-center text-center p-6 sm:p-8 flex-1">
          <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary mb-4">
            <Target className="size-6" />
          </div>
          <p className="font-display text-lg font-medium text-foreground">
            Your decisions become visible with data.
          </p>
          <p className="mt-2 text-sm text-muted-foreground max-w-[240px]">
            Log a few more trades and Decision Replay will show where your plan and execution start
            to diverge.
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel
      title="Decision Replay"
      className="neon-glow-purple flex flex-col h-full"
      action={
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          See the trader
        </span>
      }
    >
      <div
        className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/50 bg-card p-5 transition hover:border-primary/30 cursor-pointer flex-1 min-h-[280px]"
        onClick={() => !isOpen && setIsOpen(true)}
      >
        <div className="flex flex-col h-full">
          {!isOpen ? (
            <>
              {/* Closed State */}
              <div className="flex items-center gap-3 mb-6">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary shadow-sm">
                  <Brain className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    The Gap
                  </p>
                  <p className="font-medium text-sm text-foreground mt-0.5">{insight.gapText}</p>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <div className="rounded-xl bg-background/50 p-3.5 border border-border/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Your Plan
                  </p>
                  <p className="text-sm font-medium text-foreground">{insight.plan}</p>
                </div>

                <div className="flex justify-center py-1">
                  <ArrowRight className="size-4 text-muted-foreground rotate-90" />
                </div>

                <div className="rounded-xl bg-destructive/10 p-3.5 border border-destructive/20">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-destructive mb-1">
                    Your Action
                  </p>
                  <p className="text-sm font-medium text-foreground">{insight.action}</p>
                </div>
              </div>

              <div className="mt-6">
                <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/20">
                  Reflect on this
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Open State (Reflection Drawer/Modal inside the card) */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/15 text-primary">
                    <MessageSquare className="size-4" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Reflection</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground p-1 transition"
                >
                  Close
                </button>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <p className="text-base font-medium leading-relaxed text-foreground mb-4">
                  "{insight.question}"
                </p>

                {isSubmitted ? (
                  <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-center animate-in fade-in zoom-in duration-300">
                    <p className="text-sm font-medium text-primary">Insight saved.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Self-awareness is the first step.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                    <textarea
                      value={reflection}
                      onChange={(e) => setReflection(e.target.value)}
                      placeholder="I felt like I was going to miss the move..."
                      className="w-full resize-none rounded-xl border border-border/50 bg-background/50 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition"
                      rows={3}
                    />
                    <button
                      onClick={() => {
                        if (reflection.trim()) setIsSubmitted(true);
                      }}
                      disabled={!reflection.trim()}
                      className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save Reflection
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Panel>
  );
}
