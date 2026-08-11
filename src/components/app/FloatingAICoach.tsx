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
    const wins = recent.filter(t => t.result === "Win").length;
    
    if (wins >= 7) {
      return { type: "positive", text: "Your recent momentum is strong. You've won 7 of your last 10 trades. Keep risk tight." };
    } else if (wins <= 3) {
      return { type: "negative", text: "You're in a minor drawdown. Consider reducing position sizing until clarity returns." };
    }
    
    const sessions = recent.map(t => t.session);
    const modeSession = sessions.sort((a,b) =>
          sessions.filter(v => v===a).length
        - sessions.filter(v => v===b).length
    ).pop();

    if (modeSession) {
      return { type: "neutral", text: `Your recent activity is heavily concentrated in the ${modeSession} session.` };
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
        className={`fixed bottom-24 right-6 z-[70] w-80 rounded-2xl border border-primary/20 bg-card/95 shadow-2xl glass-card-3d transform-3d transition-all duration-300 ease-out origin-bottom-right ${
          isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between border-b border-primary/10 p-4">
          <div className="flex items-center gap-2 text-primary">
            <Activity className="size-5" />
            <span className="font-display font-semibold tracking-wide">TRADE PULSE</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
        
        <div className="p-5">
          {pulseInsight ? (
            <div className="flex items-start gap-3">
              {pulseInsight.type === "positive" && <TrendingUp className="size-5 text-emerald-400 shrink-0 mt-0.5" />}
              {pulseInsight.type === "negative" && <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />}
              {pulseInsight.type === "neutral" && <Bot className="size-5 text-primary shrink-0 mt-0.5" />}
              <p className="text-sm font-medium leading-relaxed">{pulseInsight.text}</p>
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
