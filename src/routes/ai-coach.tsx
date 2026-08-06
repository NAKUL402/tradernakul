import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Badge, Panel } from "@/components/app/ui-kit";
import { fetchUserTrades, type Trade } from "@/lib/trades";
import { analyzeTradeDataWithAI } from "@/lib/ai-coach-service";
import { AlertTriangle, Brain, CheckCircle2, Crown, Shield, Sparkles, Target } from "lucide-react";

export const Route = createFileRoute("/ai-coach")({
  head: () => ({
    meta: [
      { title: "AI Coach — Trading Journal AI" },
      { name: "description", content: "Your AI trading coach: quality score, institutional score, mistakes, strengths, psychology review and an improvement plan." },
      { property: "og:title", content: "AI Coach — Trading Journal AI" },
      { property: "og:description", content: "Get an AI grade on your trading with psychology and risk management reviews." },
    ],
  }),
  component: Coach,
});

function Ring({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="grid size-32 place-items-center rounded-full"
        style={{ background: `conic-gradient(var(--color-primary) ${value * 3.6}deg, var(--color-muted) 0deg)` }}
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
          {tone === "good" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[oklch(0.72_0.19_155)]" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />}
          <span className="text-muted-foreground">{i}</span>
        </li>
      ))}
    </ul>
  );
}

function Coach() {
  const [userTrades, setUserTrades] = useState<Trade[]>([]);

  useEffect(() => {
    fetchUserTrades().then((data) => setUserTrades(data));
  }, []);

  const ai = analyzeTradeDataWithAI(userTrades);

  return (
    <AppShell title="AI Coach" subtitle="Aapka personal trading mentor">
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Performance Grade" action={<Badge tone="primary"><Sparkles className="mr-1 size-3" /> AI generated</Badge>}>
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
            <p className="mt-2 text-xs text-muted-foreground">Yeh rule aapke actual trade history ke patterns se nikala gaya hai.</p>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Discipline</span><Badge tone="win">{ai.disciplineScore} / 100</Badge></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Patience</span><Badge tone="primary">{ai.patienceScore} / 100</Badge></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Risk Control</span><Badge tone="loss">{ai.riskControlScore} / 100</Badge></div>
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
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/20 text-xs font-semibold text-primary">{i + 1}</span>
                {t}
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title="Psychology Analysis">
          <p className="text-sm text-muted-foreground">{ai.psychologyText}</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            {[["FOMO", "Medium"], ["Revenge", "High"], ["Overconfidence", "Low"]].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-muted/40 p-3"><p className="text-muted-foreground">{k}</p><p className="mt-1 font-semibold">{v}</p></div>
            ))}
          </div>
        </Panel>

        <Panel title="Risk Management Review">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p><Shield className="mr-2 inline size-4 text-primary" />{ai.riskReviewText}</p>
            <p><Target className="mr-2 inline size-4 text-accent" />Profit factor target minimum 2.0 rakho.</p>
          </div>
        </Panel>

        <Panel title="Final Coach Verdict" className="lg:col-span-3">
          <p className="text-sm text-muted-foreground">{ai.finalVerdict}</p>
        </Panel>
      </div>
    </AppShell>
  );
}
