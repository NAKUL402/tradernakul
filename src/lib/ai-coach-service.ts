import { groupStats, stats, streaks, type Trade } from "./trades";

export type AICoachAnalysis = {
  qualityScore: number;
  institutionalScore: number;
  overallGrade: "A+" | "A" | "B" | "C" | "D";
  goldenRule: string;
  disciplineScore: number;
  patienceScore: number;
  riskControlScore: number;
  topMistakes: string[];
  topStrengths: string[];
  improvementPlan: string[];
  psychologyText: string;
  riskReviewText: string;
  finalVerdict: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isError?: boolean;
};

/**
 * Send user message to live Gemini API via backend /api/ai-coach endpoint.
 * Throws real API error if Gemini API or backend server fails.
 */
export async function sendChatMessageToAI(
  message: string,
  history: ChatMessage[] = [],
  userTrades: Trade[] = []
): Promise<string> {
  const summaryContext =
    userTrades && userTrades.length > 0
      ? {
          totalTrades: userTrades.length,
          stats: stats(userTrades),
          streaks: streaks(userTrades),
        }
      : null;

  const res = await fetch("/api/ai-coach", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history: history.map((h) => ({ role: h.role, content: h.content })),
      tradeContext: summaryContext,
    }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg = data?.error || `Server HTTP Error ${res.status}: ${res.statusText}`;
    throw new Error(errorMsg);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.reply) {
    throw new Error("No response text received from Gemini API.");
  }

  return data.reply;
}

export function analyzeTradeDataWithAI(userTrades: Trade[]): AICoachAnalysis {
  if (!userTrades || userTrades.length === 0) {
    return {
      qualityScore: 75,
      institutionalScore: 70,
      overallGrade: "B",
      goldenRule: "Ek din mein maximum 2 trades. Start journaling your live trades to receive AI feedback.",
      disciplineScore: 70,
      patienceScore: 70,
      riskControlScore: 70,
      topMistakes: ["No trades logged yet. Start entering your trade history."],
      topStrengths: ["System ready for trade analysis."],
      improvementPlan: ["Week 1: Log at least 5 trades with entry/exit prices and screenshots."],
      psychologyText: "Patience is not waiting; patience is actively refusing low-probability setups. Log your trades to build your psychology profile.",
      riskReviewText: "Ensure fixed risk percentage (1-2%) per trade.",
      finalVerdict: "Ready to analyze your trading edge as soon as you log entries.",
    };
  }

  const s = stats(userTrades);
  const str = streaks(userTrades);
  const bySetup = groupStats(userTrades, (t) => t.setup);

  const qualityScore = Math.min(99, Math.max(30, Math.round(s.winRate * 0.7 + s.avgRRR * 12)));
  const institutionalScore = Math.min(98, Math.max(25, Math.round(s.profitFactor * 32 + 20)));

  const overallGrade: "A+" | "A" | "B" | "C" | "D" =
    qualityScore >= 90 ? "A+"
    : qualityScore >= 80 ? "A"
    : qualityScore >= 70 ? "B"
    : qualityScore >= 60 ? "C"
    : "D";

  const bestPair = s.bestPair?.name || "XAUUSD";
  const worstPair = s.worstPair?.name || "USDJPY";
  const bestSetup = bySetup.sort((a, b) => b.winRate - a.winRate)[0]?.name || "Order Block";

  // Dynamic Mistakes Identification
  const mistakes: string[] = [];
  if (str.lossStreak >= 3) {
    mistakes.push(`Aapka max loss streak ${str.lossStreak} trades ka hai. Loss ke baad revenge trade pattern ban raha hai.`);
  }
  if (worstPair && worstPair !== bestPair) {
    mistakes.push(`${worstPair} pair par win rate low hai. Is pair par risk reduce karo ya trade avoid karo.`);
  }
  if (s.avgRRR < 1.5) {
    mistakes.push(`Average Risk:Reward ratio 1:${s.avgRRR.toFixed(2)} hai. Target minimum 1:2 RRR rakho.`);
  }
  if (userTrades.some((t) => t.riskPct > 3)) {
    mistakes.push("Kuch trades mein risk > 3% chala gaya hai. Position sizing fixed karo.");
  }
  if (mistakes.length === 0) {
    mistakes.push("London session open par volatility high hoti hai — liquidity sweep confirm hone do.");
  }

  // Dynamic Strengths Identification
  const strengths: string[] = [
    `${bestPair} par aapka win rate solid hai (${s.bestPair ? s.bestPair.winRate.toFixed(0) : "65"}%). Isko primary focus banao.`,
    `${bestSetup} setup par execution strong hai — high probability pattern.`,
    `Stop loss discipline maintain kar rahe ho — lifetime trades logged: ${s.total}.`,
  ];

  // Dynamic 30-Day Plan
  const plan: string[] = [
    `Week 1: Sirf ${bestPair} + ${bestSetup} setup trade karo. Baaki noise clear karo.`,
    "Week 2: Fixed 1% risk per trade, position sizing strict rakho.",
    "Week 3: Loss trade ke baad 30 minute ka mandatory break rule follow karo.",
    "Week 4: Har entry ke saath chart screenshot + emotion note upload karo.",
  ];

  // 20 Elite Psychology Principles
  const principles = [
    "The market rewards execution, not prediction. Stop guessing and start executing.",
    "Every impulsive trade is a loan taken from your future profits. It must be repaid with interest.",
    "Patience is not waiting; patience is actively refusing low-probability setups.",
    "Your stop loss is the cost of doing business. Your inability to accept it is the cost of ruin.",
    "A profitable trader protects capital first, opportunities second. Survival is the only edge.",
    "The market owes you absolutely nothing. Every entry must justify its place on your ledger.",
    "Discipline is what remains when emotions become too expensive. Trade like a machine.",
    "One undisciplined trade can erase weeks of perfect execution. Consistency is fragile.",
    "Winning traders think in terms of probability, not certainty. Every trade is just one of many.",
    "If you cannot follow your plan, you do not have a trading system. You have a gambling habit.",
    "Confidence comes from repeating a validated process, not from wishing for a positive outcome.",
    "Accepting a loss is an active decision. Holding a losing trade is a passive surrender.",
    "The market is not against you. Your refusal to accept reality is your only enemy.",
    "An elite trader is comfortable with missing moves. FOMO is a retail trap.",
    "Drawdowns are not failures; they are the price you pay to play a statistical game.",
    "Revenge trading is an emotional attempt to control a market that cannot be controlled.",
    "Your win rate is irrelevant if your average loss is larger than your average win.",
    "Trading is not about being right. It is about making decisions under uncertainty.",
    "If you feel excited or devastated by a single trade, your position sizing is too large.",
    "Elite execution is boring. If your trading feels like a thriller, you are doing it wrong."
  ];

  let selectedPrinciple = principles[0]!;

  if (str.lossStreak >= 2) {
    selectedPrinciple = principles[15]!; // Revenge / control
  } else if (str.winStreak >= 2) {
    selectedPrinciple = principles[7]!; // Consistency is fragile / overconfidence
  } else if (s.winRate < 45) {
    selectedPrinciple = principles[2]!; // Patience / refusing setups
  } else {
    // Rotate based on trade count hash
    selectedPrinciple = principles[userTrades.length % principles.length]!;
  }

  const psychologyText = `${selectedPrinciple} Aapka win rate ${s.winRate.toFixed(1)}% hai. Streak performance ko bypass karke risk controls follow karo.`;

  const riskReviewText = `Profit Factor ${s.profitFactor.toFixed(2)} aur average RRR 1:${s.avgRRR.toFixed(2)} hai. Capital protection primary goal honi chahiye. Position sizing auto-calculator use karo.`;

  const finalVerdict = `Verdict: Aapka edge clearly market mein visible hai. Net performance ${s.net >= 0 ? "positive" : "improving"} hai (${s.net < 0 ? "-" : ""}$${Math.abs(s.net)}). Strategy badalne ki zaroorat nahi hai — bas execution rules ko 100% robotic banao.`;

  return {
    qualityScore,
    institutionalScore,
    overallGrade,
    goldenRule: `"Ek din mein maximum 2 trades. Loss ke 30 min baad entry ban hai."`,
    disciplineScore: Math.min(95, Math.max(50, Math.round(s.winRate + 20))),
    patienceScore: Math.min(95, Math.max(45, Math.round(s.avgRRR * 25))),
    riskControlScore: Math.min(95, Math.max(40, Math.round(s.profitFactor * 30))),
    topMistakes: mistakes,
    topStrengths: strengths,
    improvementPlan: plan,
    psychologyText,
    riskReviewText,
    finalVerdict,
  };
}
