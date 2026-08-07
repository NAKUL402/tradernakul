import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/ai-coach
 * Live Gemini API Integration for TraderNakul AI Coach.
 *
 * Models tried in order (free tier fallback chain):
 *   1. gemini-2.5-flash  — 10 RPM / 500 RPD free tier
 *   2. gemini-2.0-flash  — fallback if 2.5 is rate-limited or unavailable
 *   3. gemini-1.5-flash  — last resort fallback
 *
 * On 429 rate-limit: tries next model in chain instead of failing immediately.
 * Returns real error reason — NO fake/hardcoded fallbacks.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ── CORS ──────────────────────────────────────────────────────────────────
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  // ── API Key Validation ────────────────────────────────────────────────────
  const apiKey = process.env["GEMINI_API_KEY"] || process.env["VITE_GEMINI_API_KEY"];

  if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
    return res.status(400).json({
      error:
        "GEMINI_API_KEY is not configured. " +
        "Add your Google AI Studio key to Vercel environment variables (production) " +
        "or to .env file (local). Get a free key at: https://aistudio.google.com/",
    });
  }

  try {
    const { message, history = [], tradeContext } = req.body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message string is required in request body." });
    }

    // ── System Instruction ──────────────────────────────────────────────────
    let systemText = `You are TraderNakul AI Coach, an elite institutional trading mentor and quantitative analyst inside the TraderNakul Academy.
Your objective is to provide sharp, concise, actionable, and accurate responses focused on trading education, Price Action, SMC (Smart Money Concepts), trading psychology, and risk management.

STRICT MENTOR RULES:
1. Identify Discipline Issues: If a user asks "My trading is not improving" or similar, immediately guide them through identifying possible mistakes (revenge trading, over-leveraging, lack of patience, ignoring stop losses).
2. SMC & Price Action Focus: Explain concepts like Liquidity Sweeps, Order Blocks, FVGs, and Market Structure precisely and professionally.
3. No Sugar-coating: Act like a strict but professional mentor. Call out bad risk management immediately. (e.g. "You are taking too many trades after losses. Your risk management needs improvement.")
4. Stay on Topic: Refuse to answer questions completely unrelated to trading, finance, or platform navigation.
5. Tone: Premium, authoritative, analytical, and highly structured (use bullet points for readability).`;

    if (tradeContext && typeof tradeContext === "object") {
      systemText += `\n\nUser's Current Trade Summary:\n${JSON.stringify(tradeContext, null, 2)}`;
    }

    // ── Format Chat History ─────────────────────────────────────────────────
    // IMPORTANT: history sent from frontend already excludes the current message.
    // We add the current message ourselves here — do NOT include it in history.
    //
    // Gemini strict requirements:
    //   1. Roles must alternate: user → model → user → model
    //   2. First turn must be "user"
    //   3. Last turn before our new message must be "model" (or empty history)

    const filteredHistory = Array.isArray(history)
      ? history.filter(
          (item: { role: string; content: string; isError?: boolean }) =>
            !item.isError && typeof item.content === "string" && item.content.trim().length > 0,
        )
      : [];

    const formattedContents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    let lastRole = "";

    for (const item of filteredHistory as Array<{ role: string; content: string }>) {
      const role = item.role === "assistant" || item.role === "model" ? "model" : "user";
      // Skip consecutive same-role messages (Gemini rejects these)
      if (role === lastRole) continue;
      formattedContents.push({ role, parts: [{ text: item.content }] });
      lastRole = role;
    }

    // Ensure the last history entry is "model" before we append the new "user" message.
    // If last was "user", remove it (the current message will replace it).
    if (lastRole === "user" && formattedContents.length > 0) {
      formattedContents.pop();
    }

    // Append current user message
    formattedContents.push({ role: "user", parts: [{ text: message.trim() }] });

    const payload = {
      systemInstruction: {
        parts: [{ text: systemText }],
      },
      contents: formattedContents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        topP: 0.95,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
      ],
    };

    // ── Model Fallback Chain ────────────────────────────────────────────────
    // On 429 rate-limit: try the next model instead of failing immediately.
    // We use the most stable and universally supported models across both v1 and v1beta.
    const models = ["gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];

    let lastError: string | null = null;
    const rateLimitedModels: string[] = [];

    for (const model of models) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;

      let geminiRes: Response;
      let responseData: {
        error?: { message?: string; code?: number; status?: string };
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
          finishReason?: string;
          safetyRatings?: unknown;
        }>;
        promptFeedback?: { blockReason?: string };
      };

      try {
        geminiRes = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        responseData = (await geminiRes.json()) as typeof responseData;
      } catch (fetchErr: unknown) {
        const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        lastError = `Network error reaching Gemini API (${model}): ${msg}`;
        continue; // Try next model
      }

      if (!geminiRes.ok) {
        const errDetail = responseData?.error?.message || geminiRes.statusText;

        // ── 401 Unauthorized — bad API key, stop immediately ────────────────
        if (geminiRes.status === 401) {
          return res.status(401).json({
            error:
              "Invalid Gemini API Key (HTTP 401). Your GEMINI_API_KEY is incorrect or has been revoked. " +
              "Get a new key at https://aistudio.google.com/",
          });
        }

        // ── 429 Rate Limited — try next model in fallback chain ─────────────
        if (geminiRes.status === 429) {
          rateLimitedModels.push(model);
          lastError = `${model} rate-limited (429). Trying next model…`;
          continue; // ← KEY FIX: don't give up, try the next model
        }

        // ── 400 Bad Request — likely a payload issue ────────────────────────
        if (geminiRes.status === 400) {
          return res.status(400).json({
            error: `Gemini API bad request (HTTP 400): ${errDetail}. This is usually a message history formatting issue.`,
          });
        }

        // ── 404 Model Not Found — try next model ────────────────────────────
        if (geminiRes.status === 404) {
          lastError = `Model "${model}" not found (HTTP 404). Trying next model…`;
          continue;
        }

        // ── Other errors — return immediately ───────────────────────────────
        lastError = `Gemini API Error (${model}, HTTP ${geminiRes.status}): ${errDetail}`;
        return res.status(geminiRes.status).json({ error: lastError });
      }

      // ── Safety / Content Blocks ───────────────────────────────────────────
      const blockReason = responseData?.promptFeedback?.blockReason;
      if (blockReason) {
        return res.status(200).json({
          reply: `I cannot answer that. Reason: ${blockReason}. Please rephrase your trading question.`,
          modelUsed: model,
          blocked: true,
        });
      }

      const candidate = responseData?.candidates?.[0];
      const finishReason = candidate?.finishReason;

      if (finishReason === "SAFETY") {
        return res.status(200).json({
          reply: `That response was blocked by Gemini's safety filters. Please rephrase your question.`,
          modelUsed: model,
          blocked: true,
        });
      }

      // ── Partial response from MAX_TOKENS — still return it ────────────────
      if (finishReason === "MAX_TOKENS") {
        const partialText = candidate?.content?.parts?.[0]?.text;
        if (partialText && partialText.trim()) {
          return res.status(200).json({
            reply: partialText + "\n\n[Response was cut short. Ask me to continue if needed.]",
            modelUsed: model,
          });
        }
      }

      const candidateText = candidate?.content?.parts?.[0]?.text;

      if (!candidateText || !candidateText.trim()) {
        lastError = `${model} returned empty response (finish reason: ${finishReason || "unknown"}). Trying next model…`;
        continue;
      }

      // ── SUCCESS ───────────────────────────────────────────────────────────
      // Try to save to Supabase
      try {
        const authHeader = req.headers.authorization;
        const supabaseUrl = process.env["VITE_SUPABASE_URL"];
        // For inserting, we can use anon key if we have the user's JWT, or the service role key.
        // Using anon key with the user's JWT is best for RLS.
        const supabaseAnonKey = process.env["VITE_SUPABASE_ANON_KEY"];
        
        if (authHeader && supabaseUrl && supabaseAnonKey) {
          const token = authHeader.replace("Bearer ", "");
          const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: {
              headers: { Authorization: `Bearer ${token}` }
            }
          });
          
          const { data: { user } } = await supabase.auth.getUser(token);
          
          if (user) {
            await supabase.from("ai_chat_history").insert({
              user_id: user.id,
              user_message: message.trim(),
              ai_response: candidateText,
              model_used: model
            });
            console.log(`[ai-coach] Saved chat history for user ${user.id}`);
          }
        }
      } catch (dbErr) {
        console.error("[ai-coach] Failed to save chat history to Supabase:", dbErr);
        // Do not fail the request if DB save fails, just log it.
      }

      return res.status(200).json({
        reply: candidateText,
        modelUsed: model,
        // Include info if fallback was used
        ...(rateLimitedModels.length > 0 && {
          note: `Primary model(s) rate-limited. Response from fallback: ${model}.`,
        }),
      });
    }

    // ── All models exhausted ──────────────────────────────────────────────
    if (rateLimitedModels.length === models.length) {
      // Every single model hit rate limit
      return res.status(429).json({
        error:
          `All Gemini models are rate-limited (HTTP 429). ` +
          `Models tried: ${rateLimitedModels.join(", ")}. ` +
          `You have exceeded the free tier quota (10–15 requests/minute). ` +
          `Wait 60 seconds and try again, or upgrade your Google AI plan at https://aistudio.google.com/`,
        retryAfterSeconds: 60,
        rateLimited: true,
      });
    }

    if (rateLimitedModels.length > 0) {
      return res.status(503).json({
        error:
          `Some models were rate-limited (${rateLimitedModels.join(", ")}) ` +
          `and remaining models failed: ${lastError}`,
      });
    }

    return res.status(503).json({
      error: lastError || "All Gemini models failed to respond. Check the Google AI status page.",
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return res.status(500).json({ error: `AI Coach API Exception: ${errorMsg}` });
  }
}
