import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * POST /api/ai-coach
 * Live Gemini API Integration for TraderNakul AI Coach.
 * Sends user prompt & conversation history to Google Gemini API.
 * Returns real AI response or clear error reason — NO fake/hardcoded fallbacks.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS & Header setup
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
        "Please add your Google AI Studio API key to Vercel environment variables (for production) " +
        "or to the .env file (for local development). " +
        "Get a free key at: https://aistudio.google.com/",
    });
  }

  try {
    const { message, history = [], tradeContext } = req.body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message string is required in request body." });
    }

    // ── System Instruction ──────────────────────────────────────────────────
    let systemText = `You are TraderNakul AI Coach, an elite institutional trading mentor and quantitative analyst.
Your objective is to provide sharp, concise, actionable, and accurate responses.
Rules:
- If asked general questions (e.g. "Hi", greetings, math questions like "2+2"), answer directly, naturally, and accurately.
- If asked about trading concepts (liquidity sweep, order blocks, ICT, SMC, etc.), provide professional trading mentor insights with clear explanations.
- If asked to analyze trade data that is provided, give specific, data-driven feedback.
- Never refuse to answer basic questions. Always be helpful.
- For math: compute and answer directly (e.g., "2+2 = 4").
- For greetings: respond warmly and mention you are the AI Trading Coach.`;

    if (tradeContext && typeof tradeContext === "object") {
      systemText += `\n\nUser's Current Trade Summary:\n${JSON.stringify(tradeContext, null, 2)}`;
    }

    // ── Format Chat History ─────────────────────────────────────────────────
    // Gemini requires alternating user/model roles — filter out error messages
    const filteredHistory = Array.isArray(history)
      ? history.filter(
          (item: { role: string; content: string; isError?: boolean }) => !item.isError && item.content?.trim(),
        )
      : [];

    const formattedContents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // Ensure alternating roles (Gemini strict requirement)
    let lastRole = "";
    for (const item of filteredHistory as Array<{ role: string; content: string }>) {
      const role = item.role === "assistant" || item.role === "model" ? "model" : "user";
      if (role === lastRole) continue; // Skip consecutive same-role messages
      formattedContents.push({ role, parts: [{ text: item.content }] });
      lastRole = role;
    }

    // Append current user message
    // If last message was also 'user', merge or skip (shouldn't happen normally)
    if (lastRole !== "user") {
      formattedContents.push({ role: "user", parts: [{ text: message }] });
    } else {
      // Edge case: replace last user message
      formattedContents[formattedContents.length - 1] = {
        role: "user",
        parts: [{ text: message }],
      };
    }

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
    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

    let lastError: string | null = null;
    let allModels404 = true;

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
        lastError = `Network error connecting to Gemini API (${model}): ${msg}. Check your internet connection.`;
        continue;
      }

      if (!geminiRes.ok) {
        allModels404 = allModels404 && geminiRes.status === 404;
        const errDetail = responseData?.error?.message || geminiRes.statusText;
        const errCode = responseData?.error?.code || geminiRes.status;

        if (geminiRes.status === 401) {
          return res.status(401).json({
            error: `Invalid Gemini API Key (HTTP 401). Your GEMINI_API_KEY is incorrect or expired. Get a new key at https://aistudio.google.com/`,
          });
        }

        if (geminiRes.status === 429) {
          return res.status(429).json({
            error: `Gemini API rate limit exceeded (HTTP 429). You have hit the free tier quota. Wait a minute and try again, or upgrade your Google AI plan.`,
          });
        }

        if (geminiRes.status === 400) {
          return res.status(400).json({
            error: `Gemini API bad request (HTTP 400): ${errDetail}. This may be a message formatting issue.`,
          });
        }

        if (geminiRes.status === 404) {
          lastError = `Model "${model}" not found (HTTP 404). Trying fallback model…`;
          continue; // Try next model in fallback chain
        }

        lastError = `Gemini API Error (${model}, HTTP ${errCode}): ${errDetail}`;
        return res.status(geminiRes.status).json({ error: lastError });
      }

      // ── Check for safety/content blocks ──────────────────────────────────
      const blockReason = responseData?.promptFeedback?.blockReason;
      if (blockReason) {
        return res.status(200).json({
          reply: `I cannot answer that question. Reason: ${blockReason}. Please rephrase your trading question.`,
          modelUsed: model,
          blocked: true,
        });
      }

      const candidate = responseData?.candidates?.[0];
      const finishReason = candidate?.finishReason;

      if (finishReason === "SAFETY") {
        return res.status(200).json({
          reply: `That response was blocked by safety filters. Please rephrase your question about trading.`,
          modelUsed: model,
          blocked: true,
        });
      }

      if (finishReason === "MAX_TOKENS") {
        // Partial response is still valid — return it
        const partialText = candidate?.content?.parts?.[0]?.text;
        if (partialText) {
          return res.status(200).json({
            reply: partialText + "\n\n[Response truncated due to length limit]",
            modelUsed: model,
          });
        }
      }

      const candidateText = candidate?.content?.parts?.[0]?.text;

      if (!candidateText || !candidateText.trim()) {
        lastError = `Gemini API (${model}) returned an empty response. Finish reason: ${finishReason || "unknown"}.`;
        continue; // Try next model
      }

      // ── Success ───────────────────────────────────────────────────────────
      return res.status(200).json({
        reply: candidateText,
        modelUsed: model,
      });
    }

    // All models exhausted
    if (allModels404) {
      return res.status(503).json({
        error:
          "All Gemini models are unavailable (404). The model names may have changed in the Google API. " +
          "Please check: https://ai.google.dev/gemini-api/docs/models",
      });
    }

    return res.status(503).json({
      error: lastError || "Failed to get a response from Gemini API after trying all available models.",
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return res.status(500).json({ error: `AI Coach API Exception: ${errorMsg}` });
  }
}
