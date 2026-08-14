import { useEffect, useState, useMemo } from "react";
import { Bot, X, Activity, TrendingUp, AlertTriangle } from "lucide-react";
import { fetchUserTrades, type Trade } from "@/lib/trades";
import { useLocation } from "@tanstack/react-router";

export function FloatingAICoach() {
  const location = useLocation();
  const isAICoachPage = location.pathname === "/ai-coach";
  const [isOpen, setIsOpen] = useState(false);
  const [userTrades, setUserTrades] = useState<Trade[]>([]);

  useEffect(() => {
    fetchUserTrades().then((data) => setUserTrades(data));
  }, []);

  const pulseInsight = useMemo(() => {
    if (!userTrades || userTrades.length < 5) return null;

    // Simple mock logic for Trade Pulse based on real trades
    const recent = userTrades.slice(0, 10);
    const wins = recent.filter((t) => t.result === "Win").length;

    if (wins >= 7) {
      return {
        type: "positive",
        text: "Your recent momentum is strong. You've won 7 of your last 10 trades. Keep risk tight.",
      };
    } else if (wins <= 3) {
      return {
        type: "negative",
        text: "You're in a minor drawdown. Consider reducing position sizing until clarity returns.",
      };
    }

    const sessions = recent.map((t) => t.session);
    const modeSession = sessions
      .sort(
        (a, b) => sessions.filter((v) => v === a).length - sessions.filter((v) => v === b).length,
      )
      .pop();

    if (modeSession) {
      return {
        type: "neutral",
        text: `Your recent activity is heavily concentrated in the ${modeSession} session.`,
      };
    }

    return { type: "neutral", text: "Trade Pulse is analyzing your recent patterns..." };
  }, [userTrades]);

  if (!isAICoachPage) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-accent text-primary-foreground shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 depth-hover ${isOpen ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100 glow-primary"}`}
        aria-label="Open Trade Pulse"
      >
        <Activity className="size-6 animate-pulse" />
      </button>

      <div
        className={`fixed inset-0 z-[60] bg-background/20 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      <div
        className={`fixed bottom-24 right-6 z-[70] w-80 rounded-2xl neon-card neon-glow-purple bg-card/95 backdrop-blur-xl shadow-2xl transition-all duration-300 ease-out origin-bottom-right overflow-hidden ${
          isOpen
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-90 opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {/* Subtle Candlestick Background */}
        <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
          <svg className="w-full h-full text-zinc-500/20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 320 200">
            <line x1="40" y1="30" x2="40" y2="150" stroke="#10b981" strokeWidth="1" opacity="0.4"/>
            <rect x="36" y="60" width="8" height="60" fill="#10b981" rx="1" opacity="0.3"/>

            <line x1="100" y1="50" x2="100" y2="170" stroke="#f43f5e" strokeWidth="1" opacity="0.4"/>
            <rect x="96" y="80" width="8" height="70" fill="#f43f5e" rx="1" opacity="0.3"/>

            <line x1="160" y1="20" x2="160" y2="140" stroke="#10b981" strokeWidth="1" opacity="0.4"/>
            <rect x="156" y="40" width="8" height="60" fill="#10b981" rx="1" opacity="0.3"/>

            <line x1="220" y1="40" x2="220" y2="160" stroke="#10b981" strokeWidth="1" opacity="0.4"/>
            <rect x="216" y="60" width="8" height="50" fill="#10b981" rx="1" opacity="0.3"/>

            <line x1="280" y1="30" x2="280" y2="130" stroke="#10b981" strokeWidth="1" opacity="0.4"/>
            <rect x="276" y="45" width="8" height="45" fill="#10b981" rx="1" opacity="0.3"/>
          </svg>
        </div>

        <div className="flex items-center justify-between border-b border-border/60 p-4 relative z-10 bg-card/40">
          <div className="flex items-center gap-2 text-purple-400">
            <Activity className="size-5 animate-pulse" />
            <span className="font-display font-bold text-sm tracking-wide text-foreground">TRADE PULSE</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 relative z-10">
          {pulseInsight ? (
            <div className="flex items-start gap-3">
              {pulseInsight.type === "positive" && (
                <TrendingUp className="size-5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              {pulseInsight.type === "negative" && (
                <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
              )}
              {pulseInsight.type === "neutral" && (
                <Bot className="size-5 text-primary shrink-0 mt-0.5" />
              )}
              <p className="text-sm font-medium leading-relaxed text-foreground">{pulseInsight.text}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center gap-2 py-2">
              <Activity className="size-6 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">Trade Pulse needs more journal data.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
