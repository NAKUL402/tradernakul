import {
  groupStats,
  money,
  stats,
  streaks,
  aggregateTradePatterns,
  type Trade,
} from "./trades";

import { supabase } from "./supabase";

export type WeeklyGoldenRule = {
  week: number;
  title: string;
  rule: string;
  principle: string;
  category:
    | "Capital Protection"
    | "Discipline"
    | "Psychology"
    | "Liquidity & Execution"
    | "Risk Control";
};

export const WEEKLY_GOLDEN_RULES: WeeklyGoldenRule[] = [
  {
    week: 1,
    title: "Capital Protection First",
    rule: "Your first goal is not to make money. Your first goal is to protect your capital. A disciplined trader survives long enough to become profitable.",
    principle: "Never risk more than 1% to 2% of your account equity on a single trade setup.",
    category: "Capital Protection",
  },
  {
    week: 2,
    title: "Liquidity Sweep Awareness",
    rule: "Smart money feeds on retail stop losses. Never buy at support or sell at resistance before a liquidity sweep occurs.",
    principle: "Wait for session highs or lows to be swept before taking reversal entries.",
    category: "Liquidity & Execution",
  },
  {
    week: 3,
    title: "The 30-Minute Post-Loss Rule",
    rule: "Revenge trading is an emotional attempt to control an uncontrollable market. Take a mandatory 30-minute break after every loss.",
    principle: "Step away from screens immediately after a stop out to reset your psychological state.",
    category: "Psychology",
  },
  {
    week: 4,
    title: "Asymmetric Risk:Reward Ratio",
    rule: "Your win rate does not make you rich; your Risk-to-Reward ratio does. A 40% win rate with a 1:3 RRR builds long-term wealth.",
    principle: "Refuse setups offering less than 1:2 RRR, regardless of how enticing the pattern looks.",
    category: "Risk Control",
  },
  {
    week: 5,
    title: "Process Over Outcome",
    rule: "A winning trade executed against your plan is a bad trade. A losing trade executed strictly following your plan is a successful trade.",
    principle: "Evaluate trading success purely by rule adherence, not by short-term monetary results.",
    category: "Discipline",
  },
  {
    week: 6,
    title: "Position Sizing Is Your Shield",
    rule: "If a trade causes anxiety, your lot size is too large. Size down until entry feels robotic and calm.",
    principle: "Calculate position size dynamically based on stop loss distance, not fixed lot numbers.",
    category: "Capital Protection",
  },
  {
    week: 7,
    title: "FOMO Is a Retail Trap",
    rule: "Chasing a candle is paying top price for market noise. Elite traders let price return to their Point of Interest (POI).",
    principle: "If you miss the initial break, wait patiently for the retest or skip the move entirely.",
    category: "Psychology",
  },
  {
    week: 8,
    title: "Cash Is a Valid Position",
    rule: "Not trading in low-probability market conditions is an active trading edge.",
    principle: "Do not force trades on choppy or news-heavy days without high-conviction setups.",
    category: "Discipline",
  },
  {
    week: 9,
    title: "Robotic Execution Discipline",
    rule: "Hesitation at entry and early exit at target are signs of trade fear.",
    principle: "Set entry, stop loss, and take profit, then let the market reach one of them.",
    category: "Liquidity & Execution",
  },
  {
    week: 10,
    title: "Drawdown Management Strategy",
    rule: "Drawdowns are a natural statistical cost of trading. Cut your position size by 50% during a 3-trade losing streak.",
    principle: "Protect confidence and bankroll by scaling down risk when market conditions mismatch your strategy.",
    category: "Risk Control",
  },
  {
    week: 11,
    title: "Session Volatility Alignment",
    rule: "Trade when institutional volume is active. High probability moves happen during London and New York sessions.",
    principle: "Avoid entering new positions during Asian consolidation unless trading a specific range-bound setup.",
    category: "Liquidity & Execution",
  },
  {
    week: 12,
    title: "Overcoming Overconfidence",
    rule: "A winning streak can make you feel invincible. The market is most dangerous when you feel you cannot lose.",
    principle: "Stick to strict risk parameters even after consecutive winning trades.",
    category: "Psychology",
  },
  {
    week: 13,
    title: "Order Block Validation",
    rule: "Not all order blocks hold. Only trade order blocks that created market structure breaks and displacement.",
    principle: "Filter setups by demanding displacement before placing limit orders at order blocks.",
    category: "Liquidity & Execution",
  },
  {
    week: 14,
    title: "Daily Max Loss Limit",
    rule: "Set a hard daily loss limit. Once hit, close terminals and walk away for the rest of the day.",
    principle: "Protecting your account from catastrophe days is critical to long-term survival.",
    category: "Capital Protection",
  },
  {
    week: 15,
    title: "Trade Journaling Discipline",
    rule: "What gets measured gets improved. Journaling every trade with screenshots and emotions is your fastest path to mastery.",
    principle: "Review weekly trade logs every weekend to identify recurring execution patterns.",
    category: "Discipline",
  },
  {
    week: 16,
    title: "Accepting Market Uncertainty",
    rule: "Every single trade has a random distribution of outcome. Accept risk completely before placing the order.",
    principle: "If you cannot accept loss on a trade, you are not ready to enter it.",
    category: "Psychology",
  },
];

export function getCurrentWeekIndex(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);

  const diff =
    now.getTime() -
    start.getTime() +
    (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60000;

  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const weekNum = Math.floor(dayOfYear / 7);

  return weekNum % WEEKLY_GOLDEN_RULES.length;
}

export type AICoachAnalysis = {
  qualityScore: number;
  institutionalScore: number;
  disciplineScore: number;
  patienceScore: number;
  riskControlScore: number;
  overallGrade: "A+" | "A" | "B" | "C" | "D";
  currentWeeklyRule: WeeklyGoldenRule;
  topMistakes: string[];
  topStrengths: string[];
  improvementPlan: string[];
  psychologyText: string;
  riskReviewText: string;
  finalVerdict: string;
  suggestedPrompts: string[];
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isError?: boolean;
};

/**
 * Sends a message to the production/server API.
 *
 * IMPORTANT:
 * We intentionally use a relative URL:
 * /api/ai-coach
 *
 * This means:
 * - Production -> current Edge Journal domain
 * - Local development -> current local dev origin
 *
 * NEVER hard-code localhost:3001 here.
 */
export async function sendChatMessageToAI(
  message: string,
  history: ChatMessage[] = [],
  userTrades: Trade[] = [],
): Promise<string> {
  const cleanMessage = message.trim();

  if (!cleanMessage) {
    throw new Error("Please enter a message.");
  }

  const summaryContext =
    userTrades.length > 0
      ? {
          totalTrades: userTrades.length,
          stats: stats(userTrades),
          streaks: streaks(userTrades),
          patternSummary: aggregateTradePatterns(userTrades),
        }
      : null;

  const historyToSend = history
    .filter((h) => !h.isError && h.id !== "init-1")
    .filter((h) => typeof h.content === "string" && h.content.trim())
    .slice(-10)
    .map((h) => ({
      role: h.role,
      content: h.content,
    }));

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  let response: Response;

  try {
    /*
     * CRITICAL FIX:
     *
     * Do NOT use:
     * http://localhost:3001/api/ai-coach
     *
     * Always use the same-origin production/serverless endpoint.
     */
    response = await fetch("/api/ai-coach", {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: cleanMessage,
        history: historyToSend,
        tradeContext: summaryContext,
      }),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    throw new Error(
      `AI Coach connection failed. Could not reach /api/ai-coach. ${message}`,
    );
  }

  let data: {
    reply?: string;
    error?: string;
    code?: string;
    modelUsed?: string;
    provider?: string;
    rateLimited?: boolean;
    retryAfterSeconds?: number;
  } | null = null;

  const responseText = await response.text();

  try {
    data = responseText
      ? (JSON.parse(responseText) as typeof data)
      : null;
  } catch {
    throw new Error(
      `AI Coach API returned an invalid response (HTTP ${response.status}).`,
    );
  }

  if (!response.ok) {
    if (
      response.status === 429 ||
      data?.code === "RATE_LIMIT" ||
      data?.rateLimited
    ) {
      const waitSeconds = data?.retryAfterSeconds ?? 60;

      throw new Error(
        `AI API rate limit reached. Please wait ${waitSeconds} seconds and try again.`,
      );
    }

    throw new Error(
      data?.error ||
        `AI Coach API failed with HTTP ${response.status}.`,
    );
  }

  if (!data?.reply || typeof data.reply !== "string") {
    throw new Error(
      "AI Coach returned an empty response. Please try again.",
    );
  }

  return data.reply;
}

/**
 * Generates local AI Coach analytics.
 */
export function analyzeTradeDataWithAI(
  userTrades: Trade[],
): AICoachAnalysis {
  const weekIdx = getCurrentWeekIndex();

  const currentWeeklyRule =
    WEEKLY_GOLDEN_RULES[weekIdx] || WEEKLY_GOLDEN_RULES[0]!;

  const suggestedPrompts = [
    "How do I prevent revenge trading after a stop out?",
    "What is the best way to trade London Session liquidity sweeps?",
    "How should I adjust position size during a drawdown?",
    "How can I improve my average Risk-to-Reward ratio?",
  ];

  if (!userTrades.length) {
    return {
      qualityScore: 78,
      institutionalScore: 74,
      disciplineScore: 80,
      patienceScore: 75,
      riskControlScore: 82,
      overallGrade: "B",
      currentWeeklyRule,

      topMistakes: [
        "No live trade logs detected yet. Enter recent trades to generate institutional analytics.",
        "Trade setup and risk parameters are not yet available for analysis.",
      ],

      topStrengths: [
        "AI Coach engine is ready for live trade analysis.",
        "Trade analytics will become more personalized as journal data increases.",
      ],

      improvementPlan: [
        "Log at least 5 live trades with pair, direction, entry and stop loss.",
        "Maintain consistent risk per trade.",
        "Review your journal every weekend.",
      ],

      psychologyText:
        "Patience means refusing low-probability setups. Use your journal to identify emotional execution patterns.",

      riskReviewText:
        "Maintain strict risk control and calculate position size from your stop-loss distance.",

      finalVerdict:
        "Your AI Mentor is ready. Log trades in the Journal to unlock personalized edge analysis.",

      suggestedPrompts,
    };
  }

  const s = stats(userTrades);
  const str = streaks(userTrades);

  const bySetup = groupStats(
    userTrades,
    (trade) => trade.setup,
  );

  const qualityScore = Math.min(
    99,
    Math.max(
      35,
      Math.round(s.winRate * 0.65 + s.avgRRR * 14),
    ),
  );

  const institutionalScore = Math.min(
    98,
    Math.max(
      30,
      Math.round(s.profitFactor * 30 + 22),
    ),
  );

  const overallGrade: AICoachAnalysis["overallGrade"] =
    qualityScore >= 88
      ? "A+"
      : qualityScore >= 78
        ? "A"
        : qualityScore >= 68
          ? "B"
          : qualityScore >= 58
            ? "C"
            : "D";

  const bestPair = s.bestPair?.name || "N/A";
  const worstPair = s.worstPair?.name || "N/A";

  const bestSetup =
    bySetup
      .slice()
      .sort((a, b) => b.winRate - a.winRate)[0]?.name ||
    "Core Setup";

  const mistakes: string[] = [];

  if (str.loss >= 3) {
    mistakes.push(
      `Maximum loss streak reached ${str.loss} trades. Enforce a cooling-off period after losses.`,
    );
  }

  if (
    worstPair !== "N/A" &&
    bestPair !== "N/A" &&
    worstPair !== bestPair
  ) {
    mistakes.push(
      `Performance on ${worstPair} is weaker than your strongest asset. Review whether this asset fits your edge.`,
    );
  }

  if (s.avgRRR < 1.8) {
    mistakes.push(
      `Average Risk:Reward is 1:${s.avgRRR.toFixed(2)}. Focus on higher-quality setups with stronger asymmetric R:R.`,
    );
  }

  if (userTrades.some((trade) => trade.riskPct > 2.5)) {
    mistakes.push(
      "Some trades exceeded 2.5% risk. Standardize position sizing and protect account capital.",
    );
  }

  if (!mistakes.length) {
    mistakes.push(
      "No major statistical weakness detected from the available trade data. Continue monitoring execution quality.",
    );
  }

  const strengths: string[] = [
    bestPair !== "N/A"
      ? `Strongest recorded asset: ${bestPair}.`
      : "Trade data is being tracked.",
    `Best recorded setup category: ${bestSetup}.`,
    `Trade journal contains ${s.total} recorded trades.`,
  ];

  const improvementPlan = [
    `Focus analysis around your strongest asset and ${bestSetup} setups.`,
    "Maintain consistent position sizing and predefined risk.",
    "Use a cooling-off period after significant losing streaks.",
    "Review screenshots and execution notes during weekly review.",
  ];

  const disciplineScore = Math.min(
    96,
    Math.max(50, Math.round(s.winRate + 22)),
  );

  const patienceScore = Math.min(
    95,
    Math.max(45, Math.round(s.avgRRR * 26)),
  );

  const riskControlScore = Math.min(
    98,
    Math.max(40, Math.round(s.profitFactor * 32)),
  );

  const psychologyText =
    `${currentWeeklyRule.rule} ` +
    `Your current recorded win rate is ${s.winRate.toFixed(1)}%.`;

  const riskReviewText =
    `Profit Factor is ${s.profitFactor.toFixed(2)} and average RRR is 1:${s.avgRRR.toFixed(2)}. ` +
    "Capital preservation remains the primary priority.";

  const finalVerdict =
    `Your current journal data shows ${s.net >= 0 ? "positive" : "negative"} net performance ` +
    `(${money(s.net)}). Focus on consistent execution rather than individual trade outcomes.`;

  return {
    qualityScore,
    institutionalScore,
    disciplineScore,
    patienceScore,
    riskControlScore,
    overallGrade,
    currentWeeklyRule,
    topMistakes: mistakes,
    topStrengths: strengths,
    improvementPlan,
    psychologyText,
    riskReviewText,
    finalVerdict,
    suggestedPrompts,
  };
}
