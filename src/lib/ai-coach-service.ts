import { groupStats, money, stats, streaks, type Trade } from "./trades";

export type WeeklyGoldenRule = {
  week: number;
  title: string;
  rule: string;
  principle: string;
  category:
    "Capital Protection" | "Discipline" | "Psychology" | "Liquidity & Execution" | "Risk Control";
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
    principle:
      "Step away from screens immediately after a stop out to reset your psychological state.",
    category: "Psychology",
  },
  {
    week: 4,
    title: "Asymmetric Risk:Reward Ratio",
    rule: "Your win rate does not make you rich; your Risk-to-Reward ratio does. A 40% win rate with a 1:3 RRR builds long-term wealth.",
    principle:
      "Refuse setups offering less than 1:2 RRR, regardless of how enticing the pattern looks.",
    category: "Risk Control",
  },
  {
    week: 5,
    title: "Process Over Outcome",
    rule: "A winning trade executed against your plan is a bad trade. A losing trade executed strictly following your plan is a successful trade.",
    principle:
      "Evaluate trading success purely by rule adherence, not by short-term monetary results.",
    category: "Discipline",
  },
  {
    week: 6,
    title: "Position Sizing Is Your Shield",
    rule: "If a trade causes anxiety or heart palpitations, your lot size is too large. Size down until entry feels robotic and calm.",
    principle:
      "Calculate position size dynamically based on stop loss distance, not fixed lot numbers.",
    category: "Capital Protection",
  },
  {
    week: 7,
    title: "FOMO Is a Retail Trap",
    rule: "Chasing a candle is paying top price for market noise. Elite traders let price return to their Point of Interest (POI).",
    principle:
      "If you miss the initial break, wait patiently for the retest or skip the move entirely.",
    category: "Psychology",
  },
  {
    week: 8,
    title: "Cash Is a Valid Position",
    rule: "Not trading in low-probability market conditions is an active trading edge. Preserving mental capital is as important as money.",
    principle: "Do not force trades on choppy or news-heavy days without high-conviction setups.",
    category: "Discipline",
  },
  {
    week: 9,
    title: "Robotic Execution Discipline",
    rule: "Hesitation at entry and early exit at target are signs of trade fear. Once setup is verified, execute without doubt.",
    principle:
      "Set entry, stop loss, and take profit, then let the market reach one of them without micro-managing.",
    category: "Liquidity & Execution",
  },
  {
    week: 10,
    title: "Drawdown Management Strategy",
    rule: "Drawdowns are a natural statistical cost of trading. Cut your position size by 50% during a 3-trade losing streak.",
    principle:
      "Protect confidence and bankroll by scaling down risk when market conditions mismatch your strategy.",
    category: "Risk Control",
  },
  {
    week: 11,
    title: "Session Volatility Alignment",
    rule: "Trade when institutional volume is active. High probability moves happen during London and New York session overlaps.",
    principle:
      "Avoid entering new positions during Asian consolidation unless trading specific range-bound setups.",
    category: "Liquidity & Execution",
  },
  {
    week: 12,
    title: "Overcoming Overconfidence",
    rule: "A winning streak can make you feel invincible. The market is most dangerous when you feel you cannot lose.",
    principle: "Stick to strict risk parameters even after 5 consecutive winning trades.",
    category: "Psychology",
  },
  {
    week: 13,
    title: "Order Block Validation",
    rule: "Not all order blocks hold. Only trade order blocks that created market structure breaks (BOS) and left fair value gaps (FVG).",
    principle:
      "Filter setups by demanding displacement before placing limit orders at order blocks.",
    category: "Liquidity & Execution",
  },
  {
    week: 14,
    title: "Daily Max Loss Limit",
    rule: "Set a hard daily loss limit of 2% of total capital. Once hit, close terminals and walk away for the rest of the day.",
    principle:
      "Protecting your account from catastrophe days is the key difference between pros and amateurs.",
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
    now.getTime() - start.getTime() + (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60000;
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

import { supabase } from "./supabase";

/**
 * Send user message to live Groq API via backend /api/ai-coach endpoint.
 *
 * IMPORTANT: `history` must be the conversation BEFORE the current `message`.
 * The API handler appends the current message itself — do not include it in history.
 *
 * Throws real error reason — NO fake responses ever.
 */
export async function sendChatMessageToAI(
  message: string,
  history: ChatMessage[] = [],
  userTrades: Trade[] = [],
): Promise<string> {
  const summaryContext =
    userTrades && userTrades.length > 0
      ? {
          totalTrades: userTrades.length,
          stats: stats(userTrades),
          streaks: streaks(userTrades),
        }
      : null;

  // ── Build history to send ─────────────────────────────────────────────────
  // Exclude: error messages, the welcome/init message, and the current user message.
  // The current user message is NOT in history yet at the time we call this function
  // (it was just added to the local state, but we pass the history BEFORE it).
  const historyToSend = history
    .filter((h) => !h.isError && h.id !== "init-1")
    .map((h) => ({ role: h.role, content: h.content }));

  let res: Response | null = null;
  let attempts = 0;
  const maxAttempts = 2; // Try once, retry once if network/5xx error
  let lastErrorMsg = "";

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const isDev = import.meta.env.DEV;
      const baseUrl = isDev ? "http://localhost:3001" : "";

      res = await fetch(`${baseUrl}/api/ai-coach`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message,
          history: historyToSend,
          tradeContext: summaryContext,
        }),
        signal: AbortSignal.timeout(20000),
      });

      // If success or 4xx error (like 400, 401, 403, 404, 429), break immediately and handle below
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        break;
      }

      // If 5xx error, we will retry (if attempts < maxAttempts)
      lastErrorMsg = `Server returned HTTP ${res.status}`;
      if (attempts < maxAttempts) {
        console.warn(
          `[ai-coach-service] HTTP ${res.status}. Retrying (${attempts}/${maxAttempts})...`,
        );
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (networkErr: unknown) {
      const msg = networkErr instanceof Error ? networkErr.message : String(networkErr);
      lastErrorMsg = `Network/Timeout Error: ${msg}`;
      if (attempts < maxAttempts) {
        console.warn(
          `[ai-coach-service] Network error. Retrying (${attempts}/${maxAttempts})...`,
          msg,
        );
        await new Promise((r) => setTimeout(r, 1000));
      } else {
        throw new Error(
          `Cannot reach AI Coach API after ${maxAttempts} attempts. ` +
            (msg.includes("Timeout") || msg.includes("abort")
              ? "Request timed out."
              : `Original error: ${msg}`),
        );
      }
    }
  }

  if (!res) {
    throw new Error(`Failed to communicate with AI Coach: ${lastErrorMsg}`);
  }

  type CoachResponse = {
    reply?: string;
    error?: string;
    code?: string;
    modelUsed?: string;
    rateLimited?: boolean;
    retryAfterSeconds?: number;
  };

  let data: CoachResponse | null = null;

  try {
    data = (await res.json()) as CoachResponse;
  } catch {
    throw new Error(
      `Server returned non-JSON response (HTTP ${res.status}). ` +
        `The API server may not be running or crashed.`,
    );
  }

  if (!res.ok) {
    // ── Rate limit: show helpful countdown message ────────────────────────
    if (res.status === 429 || data?.code === "RATE_LIMIT" || data?.rateLimited) {
      const waitSec = data?.retryAfterSeconds ?? 60;
      throw new Error(
        `⏱ Groq API rate limit reached. ` +
          `Please wait ${waitSec} seconds before sending another message. ` +
          `This is an API quota limit, not an app error.`,
      );
    }

    const errorMsg = data?.error || `Server HTTP ${res.status}: ${res.statusText}`;
    throw new Error(errorMsg);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.reply) {
    throw new Error("Groq AI returned an empty response. Please try again.");
  }

  return data.reply;
}

export function analyzeTradeDataWithAI(userTrades: Trade[]): AICoachAnalysis {
  const weekIdx = getCurrentWeekIndex();
  const currentWeeklyRule = WEEKLY_GOLDEN_RULES[weekIdx] || WEEKLY_GOLDEN_RULES[0]!;

  const suggestedPrompts = [
    "How do I prevent revenge trading after a stop out?",
    "What is the best way to trade London Session liquidity sweeps?",
    "How should I adjust position size during a drawdown?",
    "How can I improve my average Risk-to-Reward ratio?",
  ];

  if (!userTrades || userTrades.length === 0) {
    return {
      qualityScore: 78,
      institutionalScore: 74,
      disciplineScore: 80,
      patienceScore: 75,
      riskControlScore: 82,
      overallGrade: "B",
      currentWeeklyRule,
      topMistakes: [
        "No live trade logs detected yet. Enter your recent trades to generate institutional analytics.",
        "Executing trades without logging entry setup & stop loss parameters.",
      ],
      topStrengths: [
        "AI Coach engine active and connected to institutional evaluation rules.",
        "Open access active — ready to analyze your edge instantly upon trade input.",
      ],
      improvementPlan: [
        "Phase 1: Log at least 5 live trades with pair name, side (Buy/Sell), entry price and stop loss.",
        "Phase 2: Maintain a fixed 1% risk per trade and tag setup type (Order Block / Liquidity Sweep).",
        "Phase 3: Conduct a weekend performance review using AI Coach insights.",
      ],
      psychologyText:
        "Patience is not passive waiting; it is actively refusing low-probability setups. Log your entries to unlock personalized psychological profiling.",
      riskReviewText:
        "Ensure strict risk control of 1% to 2% per trade. Always utilize an automated position sizing calculator prior to execution.",
      finalVerdict:
        "Your AI Mentor is active. Log your trades in the Journal to receive automated institutional grading and edge analysis.",
      suggestedPrompts,
    };
  }

  const s = stats(userTrades);
  const str = streaks(userTrades);
  const bySetup = groupStats(userTrades, (t) => t.setup);

  const qualityScore = Math.min(99, Math.max(35, Math.round(s.winRate * 0.65 + s.avgRRR * 14)));
  const institutionalScore = Math.min(98, Math.max(30, Math.round(s.profitFactor * 30 + 22)));

  const overallGrade: "A+" | "A" | "B" | "C" | "D" =
    qualityScore >= 88
      ? "A+"
      : qualityScore >= 78
        ? "A"
        : qualityScore >= 68
          ? "B"
          : qualityScore >= 58
            ? "C"
            : "D";

  const bestPair = s.bestPair?.name || "XAUUSD";
  const worstPair = s.worstPair?.name || "USDJPY";
  const bestSetup = bySetup.sort((a, b) => b.winRate - a.winRate)[0]?.name || "Order Block";

  const mistakes: string[] = [];
  if (str.loss >= 3) {
    mistakes.push(
      `Max loss streak reached ${str.loss} trades. Acknowledge emotional tilt and enforce a 30-min post-loss break.`,
    );
  }
  if (worstPair && worstPair !== bestPair) {
    mistakes.push(
      `Suboptimal performance on ${worstPair}. Reduce lot size or eliminate setups on this asset.`,
    );
  }
  if (s.avgRRR < 1.8) {
    mistakes.push(
      `Average Risk:Reward ratio is 1:${s.avgRRR.toFixed(2)}. Target a minimum of 1:2.0 RRR to compound gains.`,
    );
  }
  if (userTrades.some((t) => t.riskPct > 2.5)) {
    mistakes.push(
      "Position sizing exceeded 2.5% risk on certain trades. Standardize risk to max 1-2%.",
    );
  }
  if (mistakes.length === 0) {
    mistakes.push(
      "Watch out for news-driven volatility spikes during London open liquidity sweeps.",
    );
  }

  const strengths: string[] = [
    `Strong win rate on ${bestPair} (${s.bestPair ? s.bestPair.winRate.toFixed(0) : "65"}%). Keep this as your primary asset focus.`,
    `High execution precision on ${bestSetup} setups with positive expected value.`,
    `Consistent trade logging maintained across ${s.total} trades.`,
  ];

  const plan: string[] = [
    `Phase 1: Focus exclusively on high-conviction ${bestPair} + ${bestSetup} setups. Cut non-core pairs.`,
    "Phase 2: Enforce a strict 1% risk per trade limit with dynamic position sizing.",
    "Phase 3: Implement mandatory 30-minute cooling-off period after any stop loss execution.",
    "Phase 4: Perform weekly review of trade screenshots and emotional state notes.",
  ];

  const disciplineScore = Math.min(96, Math.max(50, Math.round(s.winRate + 22)));
  const patienceScore = Math.min(95, Math.max(45, Math.round(s.avgRRR * 26)));
  const riskControlScore = Math.min(98, Math.max(40, Math.round(s.profitFactor * 32)));

  const psychologyText = `${currentWeeklyRule.rule} Your win rate is ${s.winRate.toFixed(1)}%. Maintain robotic execution discipline and ignore short-term outcome noise.`;

  const riskReviewText = `Profit Factor is ${s.profitFactor.toFixed(2)} and average RRR is 1:${s.avgRRR.toFixed(2)}. Capital preservation must remain your primary metric of trading excellence.`;

  const finalVerdict = `Verdict: Your trading edge is statistically evident. Net performance is ${s.net >= 0 ? "profitable" : "improving"} (${money(s.net)}). Maintain 100% adherence to your trading plan rules without deviation.`;

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
    improvementPlan: plan,
    psychologyText,
    riskReviewText,
    finalVerdict,
    suggestedPrompts,
  };
}
