import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/ai-coach
 * Live AI Integration for Edge Journal Coach.
 *
 * PRIMARY provider:  Groq (llama-3.3-70b-versatile)
 * BACKUP provider:   OpenRouter (openrouter/free route)
 *
 * Fallback logic:
 *   - Groq is ALWAYS tried first.
 *   - OpenRouter is ONLY attempted when Groq has an eligible provider-side failure:
 *       • HTTP 429 (rate limit / quota exhaustion)
 *       • HTTP 5xx (temporary server error)
 *       • Timeout / network failure
 *   - OpenRouter is NEVER called when Groq succeeds.
 *   - Groq 401/403/404 errors are NOT eligible for fallback (our config issue, not provider availability).
 *   - If both providers fail, a clean user-facing error is returned.
 *   - Supabase history-save failures do NOT trigger provider fallback.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Sentinel: typed error used to signal Groq failure is fallback-eligible
// ─────────────────────────────────────────────────────────────────────────────
class GroqFallbackError extends Error {
  readonly reason: "rate_limit" | "server_error" | "timeout" | "network";
  constructor(message: string, reason: "rate_limit" | "server_error" | "timeout" | "network") {
    super(message);
    this.name = "GroqFallbackError";
    this.reason = reason;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OpenRouter fallback helper — entirely self-contained
// ─────────────────────────────────────────────────────────────────────────────
async function callOpenRouter(
  systemText: string,
  filteredHistory: Array<{ role: string; content: string }>,
  userMessage: string,
): Promise<string> {
  const rawOpenRouterKey = process.env["OPENROUTER_API_KEY"] || "";
  const openRouterKey = rawOpenRouterKey.replace(/^["']|["']$/g, "").trim();

  if (!openRouterKey || openRouterKey.length < 10) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  // Build the message array in OpenAI-compatible format
  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: systemText },
  ];
  for (const item of filteredHistory) {
    messages.push({
      role: item.role === "model" || item.role === "assistant" ? "assistant" : "user",
      content: item.content,
    });
  }
  messages.push({ role: "user", content: userMessage.trim() });

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openRouterKey.trim()}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://Edge Journal.com",
      "X-Title": "Edge Journal-AI-Coach",
    },
    body: JSON.stringify({
      model: "openrouter/free", // Validated free route — dispatches to best available free model
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
    signal: AbortSignal.timeout(20000), // 20s timeout for OpenRouter (can be slower than Groq)
  });

  if (!response.ok) {
    let errMsg = `OpenRouter API error: HTTP ${response.status}`;
    try {
      const errData = (await response.json()) as any;
      if (errData?.error?.message) errMsg = `OpenRouter error: ${errData.error.message}`;
    } catch {
      // ignore JSON parse error on error body
    }
    throw new Error(errMsg);
  }

  const data = (await response.json()) as any;
  const text = data?.choices?.[0]?.message?.content;

  if (typeof text !== "string" || !text.trim()) {
    throw new Error("OpenRouter returned an empty response.");
  }

  return text;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ── CORS ──────────────────────────────────────────────────────────────────
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  try {
    const { message, history = [], tradeContext } = req.body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Message string is required in request body.",
        code: "BAD_REQUEST",
      });
    }

    let systemText = `You are Edge Journal Coach, an elite institutional trading mentor and quantitative analyst inside the Edge Journal Academy.\nYour objective is to provide sharp, concise, actionable, and accurate responses focused on trading education, Price Action, SMC (Smart Money Concepts), trading psychology, and risk management.\n\nSTRICT MENTOR RULES:\n1. Identify Discipline Issues: If a user asks "My trading is not improving" or similar, immediately guide them through identifying possible mistakes (revenge trading, over-leveraging, lack of patience, ignoring stop losses).\n2. SMC & Price Action Focus: Explain concepts like Liquidity Sweeps, Order Blocks, FVGs, and Market Structure precisely and professionally.\n3. No Sugar-coating: Act like a strict but professional mentor. Call out bad risk management immediately.\n4. Stay on Topic: Refuse to answer questions completely unrelated to trading, finance, or platform navigation.\n5. Tone: Premium, authoritative, analytical, and highly structured (use bullet points for readability).\n\nLANGUAGE & FORMATTING RULES:\n- Language Detection: Automatically match the user's language. If the user writes in Roman English/Hinglish (e.g. "kya hota hai?"), reply in Roman English/Hinglish. If they write in English, reply in English. Do not randomly switch. Keep trading terms (SMC, Liquidity Sweep, FVG, BOS, Stop Loss, etc.) in English.\n- Response Length: Keep answers extremely short, simple, clear, and satisfying to read.\n- Normal Questions: 2-5 short sentences OR 3-5 concise bullet points.\n- Simple Questions: 1-3 short sentences.\n- Concept Explanations: Max 5-7 short bullet points.\n- ONLY provide detailed/deep/long explanations if the user explicitly asks for "detailed", "deep explanation", or "thorough".\n- Do NOT write unnecessarily long paragraphs. Do NOT repeat points. Act like an experienced mentor giving a clear, fast answer, not a textbook.`;

    if (tradeContext && typeof tradeContext === "object") {
      systemText += `\n\nUser's Current Trade Summary:\n${JSON.stringify(tradeContext, null, 2)}`;
    }

    // ── Format Chat History ─────────────────────────────────────────────────
    const rawHistory = Array.isArray(history) ? history : [];
    const filteredHistory = rawHistory
      .filter(
        (item: { role: string; content: string; isError?: boolean }) =>
          !item.isError && typeof item.content === "string" && item.content.trim().length > 0,
      )
      .slice(-10); // Limit to last 10 messages to prevent token overflow

    // Helper to save to Supabase (fire-and-forget — failure must NOT affect AI response)
    const saveToSupabase = async (reply: string, model: string) => {
      try {
        const authHeaderRaw = req.headers.authorization;
        const authHeader = Array.isArray(authHeaderRaw) ? authHeaderRaw[0] : authHeaderRaw;
        const supabaseUrl = process.env["VITE_SUPABASE_URL"];
        const supabaseAnonKey = process.env["VITE_SUPABASE_ANON_KEY"];

        if (
          typeof authHeader === "string" &&
          typeof supabaseUrl === "string" &&
          typeof supabaseAnonKey === "string"
        ) {
          const token = authHeader.replace("Bearer ", "");
          const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${token}` } },
          });
          const authUserRes = await supabase.auth.getUser(token);
          const user = authUserRes.data?.user;
          if (user && user.id) {
            await supabase.from("ai_chat_history").insert({
              user_id: user.id,
              user_message: message.trim(),
              ai_response: reply,
              model_used: model,
            });
            console.log(`[ai-coach] Saved chat history for user ${user.id}`);
          }
        }
      } catch (dbErr) {
        // Intentionally swallowed — Supabase failure must never affect the AI response
        console.error("[ai-coach] Failed to save chat history to Supabase:", dbErr);
      }
    };

    // =========================================================================
    // PRIMARY: GROQ
    // =========================================================================
    const rawGroqKey = process.env["GROQ_API_KEY"] || "";
    const groqApiKey = rawGroqKey.replace(/^["']|["']$/g, "").trim();

    if (!groqApiKey || groqApiKey === "" || groqApiKey === "your_groq_api_key_here") {
      return res.status(500).json({
        error: "GROQ_API_KEY is not configured or invalid.",
        code: "CONFIG_ERROR",
      });
    }

    // groqFallbackError will be set when Groq fails with a fallback-eligible condition.
    // It stays null when Groq succeeds or fails with a non-eligible error (auth, 404, etc.)
    let groqFallbackError: GroqFallbackError | null = null;

    try {
      console.log("[ai-coach] AI Provider: GROQ (primary)");

      const groqMessages = [{ role: "system", content: systemText }];
      for (const item of filteredHistory as Array<{ role: string; content: string }>) {
        groqMessages.push({
          role: item.role === "model" || item.role === "assistant" ? "assistant" : "user",
          content: item.content,
        });
      }
      groqMessages.push({ role: "user", content: message.trim() });

      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: groqMessages,
          temperature: 0.7,
          max_tokens: 1024,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (groqResponse.ok) {
        // ── GROQ SUCCESS — return immediately, do NOT call OpenRouter ──────
        const groqData = (await groqResponse.json()) as any;
        const groqText = groqData.choices?.[0]?.message?.content;

        if (typeof groqText === "string" && groqText.trim()) {
          // Fire-and-forget Supabase save
          saveToSupabase(groqText, "groq-llama-3.3-70b-versatile").catch(console.error);
          return res.status(200).json({
            reply: groqText,
            modelUsed: "groq-llama-3.3-70b-versatile",
          });
        } else {
          // Empty response from Groq — not a provider-availability issue, return error directly
          return res.status(500).json({
            error: "Groq returned empty response.",
            code: "EMPTY_RESPONSE",
          });
        }
      } else {
        // ── GROQ HTTP ERROR — classify whether fallback is eligible ─────────
        let errorMsg = `Groq API failed with status ${groqResponse.status}: ${groqResponse.statusText}`;
        try {
          const errorData = (await groqResponse.json()) as any;
          if (errorData?.error?.message) errorMsg = errorData.error.message;
        } catch {
          // ignore JSON parse error
        }

        if (groqResponse.status === 401 || groqResponse.status === 403) {
          // Auth error — our config issue, NOT a fallback scenario
          return res.status(groqResponse.status).json({
            error: `API Key/Project Permission Configuration Error (HTTP ${groqResponse.status}): ${errorMsg}`,
            code: "UNAUTHORIZED",
          });
        }

        if (groqResponse.status === 404) {
          // Model not found — our config issue, NOT a fallback scenario
          return res.status(404).json({
            error: `Model Unavailable (HTTP 404): ${errorMsg}`,
            code: "NOT_FOUND",
          });
        }

        if (groqResponse.status === 429) {
          // Rate limit / quota exhaustion — ELIGIBLE for fallback
          console.warn("[ai-coach] Groq rate-limited (429). Will attempt OpenRouter fallback.");
          groqFallbackError = new GroqFallbackError(errorMsg, "rate_limit");
        } else if (groqResponse.status >= 500) {
          // Groq server error — ELIGIBLE for fallback
          console.warn(
            `[ai-coach] Groq server error (${groqResponse.status}). Will attempt OpenRouter fallback.`,
          );
          groqFallbackError = new GroqFallbackError(errorMsg, "server_error");
        } else {
          // Any other HTTP error (e.g. 400) — return directly, not eligible for fallback
          return res.status(groqResponse.status).json({
            error: `Groq API Error: ${errorMsg}`,
            code: "API_ERROR",
          });
        }
      }
    } catch (err) {
      // ── GROQ NETWORK / TIMEOUT ERROR — ELIGIBLE for fallback ─────────────
      const errMsg = err instanceof Error ? err.message : String(err);
      if (
        errMsg.includes("TimeoutError") ||
        errMsg.includes("abort") ||
        errMsg.includes("timeout")
      ) {
        console.warn("[ai-coach] Groq request timed out. Will attempt OpenRouter fallback.");
        groqFallbackError = new GroqFallbackError(errMsg, "timeout");
      } else {
        console.warn(`[ai-coach] Groq network error: ${errMsg}. Will attempt OpenRouter fallback.`);
        groqFallbackError = new GroqFallbackError(errMsg, "network");
      }
    }

    // =========================================================================
    // BACKUP: OPENROUTER — only reached when Groq had an eligible failure
    // =========================================================================
    if (groqFallbackError) {
      console.log(
        `[ai-coach] AI Provider: OPENROUTER (fallback — Groq reason: ${groqFallbackError.reason})`,
      );

      try {
        const openRouterText = await callOpenRouter(
          systemText,
          filteredHistory as Array<{ role: string; content: string }>,
          message,
        );

        // OpenRouter succeeded — return as normal response
        saveToSupabase(openRouterText, "openrouter-free-backup").catch(console.error);
        return res.status(200).json({
          reply: openRouterText,
          modelUsed: "openrouter-free-backup",
        });
      } catch (orErr) {
        // Both providers failed — return a clean user-facing error
        const orErrMsg = orErr instanceof Error ? orErr.message : String(orErr);
        console.error("[ai-coach] OpenRouter fallback also failed:", orErrMsg);

        return res.status(503).json({
          error:
            "Our AI service is currently unavailable. Both primary and backup providers failed. Please try again in a moment.",
          code: "ALL_PROVIDERS_FAILED",
        });
      }
    }

    // Should not reach here — all paths above return or set groqFallbackError
    return res.status(500).json({ error: "Unexpected handler state.", code: "INTERNAL_ERROR" });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return res.status(500).json({
      error: `AI Coach API Exception: ${errorMsg}`,
      code: "INTERNAL_ERROR",
    });
  }
}
