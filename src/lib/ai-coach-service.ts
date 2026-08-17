import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const GROQ_MODEL = "llama-3.3-70b-versatile";
const OPENROUTER_MODEL = "openrouter/free";

type ChatHistoryItem = {
  role: string;
  content: string;
  isError?: boolean;
};

type TradeContext = Record<string, unknown>;

function cleanEnvValue(value: string | undefined): string {
  return (value || "").replace(/^["']|["']$/g, "").trim();
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function normalizeRole(role: string): "user" | "assistant" {
  return role === "assistant" || role === "model" ? "assistant" : "user";
}

function buildSystemPrompt(tradeContext?: TradeContext): string {
  let systemText = `You are Edge Journal Coach, an elite trading mentor.

Your job is to provide direct, honest, practical and actionable answers about:
- Trading
- Price action
- Smart Money Concepts (SMC)
- Liquidity
- Market structure
- Order Blocks
- Inducement
- Trading psychology
- Risk management
- Trade journaling
- Performance analysis

STRICT RULES:

1. NO FIXED "QUICK TAKE" OPENING
Never automatically start with "Quick Take:" or any other canned heading.
Answer the user's actual question naturally from the first sentence.

2. NEVER INVENT A TRADE REVIEW
If the user asks:
- Review my trade
- Review my chart
- Analyze my screenshot
- Look at this chart
- Analyze this image
- Review this file

and no actual image/file/trade details are available, do NOT pretend to see it.

Instead say clearly:
"You haven't uploaded a photo, chart screenshot, or file yet. Please upload or attach your trade screenshot/file so I can review it accurately for you."

Never invent:
- Entry
- Stop loss
- Take profit
- Direction
- Candlestick pattern
- Liquidity level
- Market structure
- Risk/reward
- Any other trade detail

3. CONCISE AND ACTIONABLE
Use short, clear paragraphs and bullets when useful.
Avoid unnecessary textbook explanations.
Focus on practical execution.

4. NO AI DISCLAIMERS
Do not say:
"As an AI..."
"I am a language model..."
or similar statements.

5. LANGUAGE
Match the user's language.

If the user speaks Roman Hindi/Hinglish, reply naturally in Roman Hindi/Hinglish while keeping trading terminology in English.

6. DETAILS ON DEMAND
Only give a deep/full breakdown when the user asks for:
- detail
- deep analysis
- full analysis
- explain deeply
- step-by-step

Otherwise keep answers concise.

7. STATISTICAL INTEGRITY
If tradeContext or patternSummary is supplied, use only the actual supplied data.
Never invent:
- win rate
- number of trades
- profit
- loss
- expectancy
- drawdown
- streak
- setup performance
- instrument performance

If there is insufficient data, clearly say so.

8. RISK DISCIPLINE
Never encourage reckless risk-taking.
Keep trading advice disciplined and risk-focused.

9. EDGE JOURNAL CONTEXT
You are the AI Coach inside Edge Journal.
When appropriate, help the user understand their own journal data and trading behaviour.

10. DO NOT CLAIM TO HAVE ACCESS TO DATA THAT WAS NOT PROVIDED
Only use information actually included in the current request, chat history, or tradeContext.`;

  if (tradeContext && typeof tradeContext === "object") {
    systemText += `

USER'S CURRENT TRADE / JOURNAL CONTEXT:
${JSON.stringify(tradeContext, null, 2)}

Use this context only when relevant.
Do not invent or modify its statistics.`;
  }

  return systemText;
}

function buildMessages(
  systemText: string,
  history: ChatHistoryItem[],
  userMessage: string,
) {
  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [
    {
      role: "system",
      content: systemText,
    },
  ];

  for (const item of history) {
    messages.push({
      role: normalizeRole(item.role),
      content: item.content.trim(),
    });
  }

  messages.push({
    role: "user",
    content: userMessage.trim(),
  });

  return messages;
}

async function callGroq(
  systemText: string,
  history: ChatHistoryItem[],
  userMessage: string,
): Promise<string> {
  const groqApiKey = cleanEnvValue(process.env.GROQ_API_KEY);

  if (!groqApiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const messages = buildMessages(systemText, history, userMessage);

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
      signal: AbortSignal.timeout(15000),
    },
  );

  const responseText = await response.text();

  let responseData: any = null;

  try {
    responseData = responseText ? JSON.parse(responseText) : null;
  } catch {
    responseData = null;
  }

  if (!response.ok) {
    const providerMessage =
      responseData?.error?.message ||
      responseData?.message ||
      response.statusText ||
      "Unknown Groq error";

    throw new Error(
      `Groq HTTP ${response.status}: ${providerMessage}`,
    );
  }

  const reply = responseData?.choices?.[0]?.message?.content;

  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("Groq returned an empty response.");
  }

  return reply.trim();
}

async function callOpenRouter(
  systemText: string,
  history: ChatHistoryItem[],
  userMessage: string,
): Promise<string> {
  const openRouterApiKey = cleanEnvValue(
    process.env.OPENROUTER_API_KEY,
  );

  if (!openRouterApiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const messages = buildMessages(systemText, history, userMessage);

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://edgejournal.site",
        "X-Title": "Edge Journal AI Coach",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
      signal: AbortSignal.timeout(20000),
    },
  );

  const responseText = await response.text();

  let responseData: any = null;

  try {
    responseData = responseText ? JSON.parse(responseText) : null;
  } catch {
    responseData = null;
  }

  if (!response.ok) {
    const providerMessage =
      responseData?.error?.message ||
      responseData?.message ||
      response.statusText ||
      "Unknown OpenRouter error";

    throw new Error(
      `OpenRouter HTTP ${response.status}: ${providerMessage}`,
    );
  }

  const reply = responseData?.choices?.[0]?.message?.content;

  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("OpenRouter returned an empty response.");
  }

  return reply.trim();
}

async function saveToSupabase(
  req: VercelRequest,
  userMessage: string,
  reply: string,
  modelUsed: string,
): Promise<void> {
  try {
    const authHeaderRaw = req.headers.authorization;

    const authHeader = Array.isArray(authHeaderRaw)
      ? authHeaderRaw[0]
      : authHeaderRaw;

    const supabaseUrl =
      process.env.VITE_SUPABASE_URL ||
      process.env.SUPABASE_URL;

    const supabaseAnonKey =
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY;

    if (
      typeof authHeader !== "string" ||
      !supabaseUrl ||
      !supabaseAnonKey
    ) {
      return;
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      return;
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      },
    );

    const authUserResult = await supabase.auth.getUser(token);

    const user = authUserResult.data?.user;

    if (!user?.id) {
      return;
    }

    const { error } = await supabase
      .from("ai_chat_history")
      .insert({
        user_id: user.id,
        user_message: userMessage.trim(),
        ai_response: reply,
        model_used: modelUsed,
      });

    if (error) {
      console.error(
        "[ai-coach] Supabase history save failed:",
        error,
      );

      return;
    }

    console.log(
      `[ai-coach] Chat history saved for user ${user.id}`,
    );
  } catch (error) {
    console.error(
      "[ai-coach] Supabase history save error:",
      error,
    );
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // ---------------------------------------------------------------------------
  // CORS
  // ---------------------------------------------------------------------------

  res.setHeader(
    "Access-Control-Allow-Origin",
    "*",
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS",
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed. Use POST.",
      code: "METHOD_NOT_ALLOWED",
    });
  }

  try {
    // -------------------------------------------------------------------------
    // Request body
    // -------------------------------------------------------------------------

    const body = req.body || {};

    const message = body.message;
    const history = body.history;
    const tradeContext = body.tradeContext;

    if (
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        error: "Message string is required in request body.",
        code: "BAD_REQUEST",
      });
    }

    const rawHistory: ChatHistoryItem[] =
      Array.isArray(history) ? history : [];

    const filteredHistory = rawHistory
      .filter(
        (item) =>
          !item.isError &&
          typeof item.content === "string" &&
          item.content.trim().length > 0,
      )
      .slice(-10);

    const safeTradeContext =
      tradeContext &&
      typeof tradeContext === "object" &&
      !Array.isArray(tradeContext)
        ? (tradeContext as TradeContext)
        : undefined;

    const systemText =
      buildSystemPrompt(safeTradeContext);

    // -------------------------------------------------------------------------
    // PRIMARY PROVIDER: GROQ
    // -------------------------------------------------------------------------

    let groqErrorMessage = "";

    try {
      console.log(
        `[ai-coach] Trying Groq model: ${GROQ_MODEL}`,
      );

      const groqReply = await callGroq(
        systemText,
        filteredHistory,
        message,
      );

      console.log(
        "[ai-coach] Groq request succeeded.",
      );

      // Save history without blocking the AI response.
      void saveToSupabase(
        req,
        message,
        groqReply,
        `groq-${GROQ_MODEL}`,
      );

      return res.status(200).json({
        reply: groqReply,
        modelUsed: `groq-${GROQ_MODEL}`,
        provider: "groq",
      });
    } catch (error) {
      groqErrorMessage = getErrorMessage(error);

      console.warn(
        `[ai-coach] Groq failed: ${groqErrorMessage}`,
      );

      // IMPORTANT:
      // We intentionally continue to OpenRouter for ALL Groq failures.
      //
      // This fixes the previous situation where a Groq 404 immediately
      // stopped the request and the backup provider was never tried.
    }

    // -------------------------------------------------------------------------
    // BACKUP PROVIDER: OPENROUTER
    // -------------------------------------------------------------------------

    try {
      console.log(
        `[ai-coach] Groq failed. Trying OpenRouter: ${OPENROUTER_MODEL}`,
      );

      const openRouterReply = await callOpenRouter(
        systemText,
        filteredHistory,
        message,
      );

      console.log(
        "[ai-coach] OpenRouter request succeeded.",
      );

      void saveToSupabase(
        req,
        message,
        openRouterReply,
        `openrouter-${OPENROUTER_MODEL}`,
      );

      return res.status(200).json({
        reply: openRouterReply,
        modelUsed: `openrouter-${OPENROUTER_MODEL}`,
        provider: "openrouter",
      });
    } catch (error) {
      const openRouterErrorMessage =
        getErrorMessage(error);

      console.error(
        `[ai-coach] OpenRouter also failed: ${openRouterErrorMessage}`,
      );

      // -----------------------------------------------------------------------
      // Both providers failed
      // -----------------------------------------------------------------------

      const hasGroqKey = Boolean(
        cleanEnvValue(process.env.GROQ_API_KEY),
      );

      const hasOpenRouterKey = Boolean(
        cleanEnvValue(process.env.OPENROUTER_API_KEY),
      );

      if (!hasGroqKey && !hasOpenRouterKey) {
        return res.status(500).json({
          error:
            "AI providers are not configured. Please configure GROQ_API_KEY or OPENROUTER_API_KEY.",
          code: "AI_KEYS_MISSING",
        });
      }

      if (!hasGroqKey) {
        return res.status(503).json({
          error:
            "The backup AI service is currently unavailable. Please try again in a moment.",
          code: "OPENROUTER_FAILED",
        });
      }

      if (!hasOpenRouterKey) {
        return res.status(503).json({
          error:
            "The primary AI service is currently unavailable and the backup provider is not configured.",
          code: "GROQ_FAILED_BACKUP_NOT_CONFIGURED",
        });
      }

      return res.status(503).json({
        error:
          "Our AI service is temporarily unavailable. Please try again in a moment.",
        code: "ALL_PROVIDERS_FAILED",
        details: {
          groq: groqErrorMessage,
          openrouter: openRouterErrorMessage,
        },
      });
    }
  } catch (error) {
    const errorMessage = getErrorMessage(error);

    console.error(
      "[ai-coach] Unexpected handler error:",
      errorMessage,
    );

    return res.status(500).json({
      error:
        "AI Coach encountered an unexpected error.",
      code: "INTERNAL_ERROR",
    });
  }
}
