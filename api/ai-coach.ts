import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/ai-coach
 * Live AI Integration for Edge Journal Coach.
 *
 * PRIMARY PROVIDER:
 *   Groq - llama-3.3-70b-versatile
 *
 * BACKUP PROVIDER:
 *   OpenRouter - openrouter/free
 *
 * FALLBACK LOGIC:
 *   1. Try Groq first when GROQ_API_KEY exists.
 *   2. If Groq succeeds, return immediately.
 *   3. If Groq returns 401/403/404/429/5xx, try OpenRouter.
 *   4. If Groq times out or has a network error, try OpenRouter.
 *   5. If Groq key is missing, skip Groq and try OpenRouter.
 *   6. If both providers fail, return a clean 503 error.
 *   7. Supabase history-save failures never break the AI response.
 */

type ChatHistoryItem = {
  role: string;
  content: string;
  isError?: boolean;
};

type FallbackReason =
  | "auth"
  | "not_found"
  | "rate_limit"
  | "server_error"
  | "timeout"
  | "network";

class GroqFallbackError extends Error {
  readonly reason: FallbackReason;

  constructor(message: string, reason: FallbackReason) {
    super(message);
    this.name = "GroqFallbackError";
    this.reason = reason;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function cleanEnvValue(value: string | undefined): string {
  return (value || "").replace(/^["']|["']$/g, "").trim();
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function isTimeoutError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("aborterror") ||
    message.includes("aborted")
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OpenRouter fallback
// ─────────────────────────────────────────────────────────────────────────────

async function callOpenRouter(
  systemText: string,
  filteredHistory: Array<{ role: string; content: string }>,
  userMessage: string,
): Promise<string> {
  const openRouterKey = cleanEnvValue(process.env["OPENROUTER_API_KEY"]);

  if (!openRouterKey || openRouterKey.length < 10) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    {
      role: "system",
      content: systemText,
    },
  ];

  for (const item of filteredHistory) {
    messages.push({
      role:
        item.role === "model" || item.role === "assistant"
          ? "assistant"
          : "user",
      content: item.content,
    });
  }

  messages.push({
    role: "user",
    content: userMessage.trim(),
  });

  const siteUrl =
    cleanEnvValue(process.env["VITE_SITE_URL"]) ||
    "https://edgejournal.site";

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": siteUrl,
        "X-Title": "Edge Journal AI Coach",
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
      signal: AbortSignal.timeout(20000),
    },
  );

  if (!response.ok) {
    let errorMessage = `OpenRouter API error: HTTP ${response.status}`;

    try {
      const errorData = (await response.json()) as {
        error?: {
          message?: string;
        };
      };

      if (errorData?.error?.message) {
        errorMessage = errorData.error.message;
      }
    } catch {
      // Ignore invalid JSON error body.
    }

    throw new Error(errorMessage);
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const text = data?.choices?.[0]?.message?.content;

  if (typeof text !== "string" || !text.trim()) {
    throw new Error("OpenRouter returned an empty response.");
  }

  return text.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // ── CORS ──────────────────────────────────────────────────────────────────
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
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
    const { message, history = [], tradeContext } = req.body || {};

    // ── Validate message ────────────────────────────────────────────────────
    if (
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        error: "Message string is required in request body.",
        code: "BAD_REQUEST",
      });
    }

    // ── AI system prompt ────────────────────────────────────────────────────
    let systemText = `You are Edge Journal Coach, an elite trading mentor. Your goal is to provide direct, honest, and highly actionable answers about trading, price action, SMC, psychology, and risk management.

STRICT OPERATIONAL RULES:

1. NO PRE-FIXED "QUICK TAKE" OPENINGS:
   - NEVER start your response with a fixed "Quick Take:" header or canned summary unless specifically asked.
   - Address the user's specific query directly and naturally right from the very first word.

2. ABSOLUTELY NO FAKE / ASSUMED REVIEWS (CRITICAL RULE):
   - If the user asks you to "Review this trade", "Review my chart", "Look at this screenshot", "Analyze this image", "Review this file", or anything visual/file-related, BUT NO actual image or file content is attached/uploaded in the message:
     YOU MUST NEVER INVENT, ASSUME, OR PRETEND TO SEE A CHART OR FILE.
     YOU MUST CLEARLY AND POLITELY STATE:
     "You haven't uploaded a photo, chart screenshot, or file yet. Please upload or attach your trade screenshot/file so I can review it accurately for you."
   - ONLY review a chart, trade image, or attached file when the actual visual data or specific trade details are genuinely provided in the message.
   - Under no circumstances assume trade direction, entry, stop loss, or candlestick patterns that are not provided.

3. CONCISE & ACTIONABLE:
   - Use punchy, clear lines and actionable bullet points.
   - No long fluff or textbook lectures.
   - Keep trading advice realistic, disciplined, and strictly risk-focused.

4. NO DISCLAIMERS:
   - Never say "As an AI...", "Please note that I am a language model...", or similar statements.
   - Keep the conversation authentic and professional.

5. LANGUAGE & TONE:
   - Match the user's language: English, Roman Hindi, or Hinglish.
   - If Roman Hindi/Hinglish is used, reply naturally in Roman Hindi/Hinglish while keeping technical trading terms in English.

6. DETAILS ON DEMAND:
   - Provide a deep breakdown only when explicitly asked:
     "detail mein bata", "explain deeply", "full analysis", etc.
   - Otherwise stay clean, crisp, and direct.

7. STATISTICAL INTEGRITY:
   - If a patternSummary or tradeContext is provided, use ONLY that real statistical data.
   - Never invent win rates, trades, profits, losses, or metrics.
   - If data is unavailable or insufficient, explicitly state that.

8. EDGE JOURNAL CONTEXT:
   - You are the AI Coach inside Edge Journal.
   - Focus on helping the user understand their trading process, execution, psychology, risk management, price action, liquidity, structure, and journal data.
   - Do not invent information from the user's journal.`;

    if (tradeContext && typeof tradeContext === "object") {
      systemText += `\n\nUser's Current Trade Summary:\n${JSON.stringify(
        tradeContext,
        null,
        2,
      )}`;
    }

    // ── Format chat history ─────────────────────────────────────────────────
    const rawHistory: ChatHistoryItem[] = Array.isArray(history)
      ? history
      : [];

    const filteredHistory = rawHistory
      .filter(
        (item) =>
          !item.isError &&
          typeof item.content === "string" &&
          item.content.trim().length > 0,
      )
      .slice(-10)
      .map((item) => ({
        role: item.role,
        content: item.content.trim(),
      }));

    // ───────────────────────────────────────────────────────────────────────
    // Supabase history helper
    // ───────────────────────────────────────────────────────────────────────

    const saveToSupabase = async (
      reply: string,
      model: string,
    ): Promise<void> => {
      try {
        const authHeaderRaw = req.headers.authorization;
        const authHeader = Array.isArray(authHeaderRaw)
          ? authHeaderRaw[0]
          : authHeaderRaw;

        const supabaseUrl =
          cleanEnvValue(process.env["VITE_SUPABASE_URL"]) ||
          cleanEnvValue(process.env["SUPABASE_URL"]);

        const supabaseAnonKey =
          cleanEnvValue(process.env["VITE_SUPABASE_ANON_KEY"]) ||
          cleanEnvValue(process.env["SUPABASE_ANON_KEY"]);

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

        const authUserRes = await supabase.auth.getUser(token);
        const user = authUserRes.data?.user;

        if (!user?.id) {
          return;
        }

        await supabase.from("ai_chat_history").insert({
          user_id: user.id,
          user_message: message.trim(),
          ai_response: reply,
          model_used: model,
        });

        console.log(
          `[ai-coach] Saved chat history for user ${user.id}`,
        );
      } catch (dbError) {
        // Never allow Supabase history errors to break the AI response.
        console.error(
          "[ai-coach] Failed to save chat history to Supabase:",
          dbError,
        );
      }
    };

    // ───────────────────────────────────────────────────────────────────────
    // Provider configuration
    // ───────────────────────────────────────────────────────────────────────

    const groqApiKey = cleanEnvValue(process.env["GROQ_API_KEY"]);
    const openRouterApiKey = cleanEnvValue(
      process.env["OPENROUTER_API_KEY"],
    );

    // If neither provider is configured, fail clearly.
    if (!groqApiKey && !openRouterApiKey) {
      return res.status(500).json({
        error:
          "AI service is not configured. Please configure GROQ_API_KEY or OPENROUTER_API_KEY in Vercel.",
        code: "AI_NOT_CONFIGURED",
      });
    }

    // ───────────────────────────────────────────────────────────────────────
    // PRIMARY: GROQ
    // ───────────────────────────────────────────────────────────────────────

    let groqFallbackError: GroqFallbackError | null = null;

    if (groqApiKey) {
      try {
        console.log(
          "[ai-coach] AI Provider: GROQ (primary)",
        );

        const groqMessages: Array<{
          role: "system" | "user" | "assistant";
          content: string;
        }> = [
          {
            role: "system",
            content: systemText,
          },
        ];

        for (const item of filteredHistory) {
          groqMessages.push({
            role:
              item.role === "model" ||
              item.role === "assistant"
                ? "assistant"
                : "user",
            content: item.content,
          });
        }

        groqMessages.push({
          role: "user",
          content: message.trim(),
        });

        const groqResponse = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${groqApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: groqMessages,
              temperature: 0.7,
              max_tokens: 1024,
            }),
            signal: AbortSignal.timeout(15000),
          },
        );

        // ── GROQ SUCCESS ───────────────────────────────────────────────────
        if (groqResponse.ok) {
          const groqData = (await groqResponse.json()) as {
            choices?: Array<{
              message?: {
                content?: string;
              };
            }>;
          };

          const groqText =
            groqData?.choices?.[0]?.message?.content;

          if (
            typeof groqText === "string" &&
            groqText.trim()
          ) {
            const cleanReply = groqText.trim();

            saveToSupabase(
              cleanReply,
              "groq-llama-3.3-70b-versatile",
            ).catch((error) => {
              console.error(
                "[ai-coach] Supabase save error:",
                error,
              );
            });

            return res.status(200).json({
              reply: cleanReply,
              modelUsed: "groq-llama-3.3-70b-versatile",
              provider: "groq",
            });
          }

          // Empty Groq response → try backup.
          groqFallbackError = new GroqFallbackError(
            "Groq returned an empty response.",
            "server_error",
          );
        } else {
          // ── GROQ HTTP ERROR ───────────────────────────────────────────────
          let errorMessage =
            `Groq API failed with HTTP ${groqResponse.status}: ${groqResponse.statusText}`;

          try {
            const errorData = (await groqResponse.json()) as {
              error?: {
                message?: string;
              };
            };

            if (errorData?.error?.message) {
              errorMessage = errorData.error.message;
            }
          } catch {
            // Ignore invalid JSON error body.
          }

          if (
            groqResponse.status === 401 ||
            groqResponse.status === 403
          ) {
            console.warn(
              `[ai-coach] Groq authentication/permission error (${groqResponse.status}). Trying OpenRouter fallback.`,
            );

            groqFallbackError = new GroqFallbackError(
              errorMessage,
              "auth",
            );
          } else if (groqResponse.status === 404) {
            console.warn(
              "[ai-coach] Groq returned 404/model unavailable. Trying OpenRouter fallback.",
            );

            groqFallbackError = new GroqFallbackError(
              errorMessage,
              "not_found",
            );
          } else if (groqResponse.status === 429) {
            console.warn(
              "[ai-coach] Groq rate-limited (429). Trying OpenRouter fallback.",
            );

            groqFallbackError = new GroqFallbackError(
              errorMessage,
              "rate_limit",
            );
          } else if (groqResponse.status >= 500) {
            console.warn(
              `[ai-coach] Groq server error (${groqResponse.status}). Trying OpenRouter fallback.`,
            );

            groqFallbackError = new GroqFallbackError(
              errorMessage,
              "server_error",
            );
          } else {
            // Other errors such as malformed request.
            return res.status(groqResponse.status).json({
              error: `Groq API Error: ${errorMessage}`,
              code: "GROQ_API_ERROR",
            });
          }
        }
      } catch (error) {
        // ── GROQ NETWORK / TIMEOUT ─────────────────────────────────────────
        const errorMessage = getErrorMessage(error);

        if (isTimeoutError(error)) {
          console.warn(
            "[ai-coach] Groq request timed out. Trying OpenRouter fallback.",
          );

          groqFallbackError = new GroqFallbackError(
            errorMessage,
            "timeout",
          );
        } else {
          console.warn(
            `[ai-coach] Groq network error: ${errorMessage}. Trying OpenRouter fallback.`,
          );

          groqFallbackError = new GroqFallbackError(
            errorMessage,
            "network",
          );
        }
      }
    } else {
      // No Groq key → directly use backup.
      console.warn(
        "[ai-coach] GROQ_API_KEY is missing. Skipping Groq and using OpenRouter.",
      );

      groqFallbackError = new GroqFallbackError(
        "GROQ_API_KEY is not configured.",
        "auth",
      );
    }

    // ───────────────────────────────────────────────────────────────────────
    // BACKUP: OPENROUTER
    // ───────────────────────────────────────────────────────────────────────

    if (groqFallbackError) {
      if (!openRouterApiKey) {
        return res.status(503).json({
          error:
            "Primary AI provider is unavailable and OPENROUTER_API_KEY is not configured.",
          code: "BACKUP_NOT_CONFIGURED",
          providerReason: groqFallbackError.reason,
        });
      }

      console.log(
        `[ai-coach] AI Provider: OPENROUTER fallback (Groq reason: ${groqFallbackError.reason})`,
      );

      try {
        const openRouterText = await callOpenRouter(
          systemText,
          filteredHistory,
          message,
        );

        saveToSupabase(
          openRouterText,
          "openrouter-free-backup",
        ).catch((error) => {
          console.error(
            "[ai-coach] Supabase save error:",
            error,
          );
        });

        return res.status(200).json({
          reply: openRouterText,
          modelUsed: "openrouter-free-backup",
          provider: "openrouter",
        });
      } catch (openRouterError) {
        const openRouterErrorMessage =
          getErrorMessage(openRouterError);

        console.error(
          "[ai-coach] OpenRouter fallback failed:",
          openRouterErrorMessage,
        );

        return res.status(503).json({
          error:
            "Our AI service is currently unavailable. Please try again in a moment.",
          code: "ALL_PROVIDERS_FAILED",
        });
      }
    }

    // ───────────────────────────────────────────────────────────────────────
    // Safety fallback
    // ───────────────────────────────────────────────────────────────────────

    return res.status(500).json({
      error: "Unexpected AI provider state.",
      code: "INTERNAL_ERROR",
    });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);

    console.error(
      "[ai-coach] Unexpected handler exception:",
      errorMessage,
    );

    return res.status(500).json({
      error: `AI Coach API Exception: ${errorMessage}`,
      code: "INTERNAL_ERROR",
    });
  }
}
