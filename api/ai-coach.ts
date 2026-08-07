import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * POST /api/ai-coach
 * Live Gemini API Integration for TraderNakul AI Coach.
 * Sends user prompt & conversation history to Google Gemini API.
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

  const apiKey = process.env["GEMINI_API_KEY"] || process.env["VITE_GEMINI_API_KEY"];

  if (!apiKey) {
    return res.status(400).json({
      error: "GEMINI_API_KEY environment variable is not configured in environment settings.",
    });
  }

  try {
    const { message, history = [], tradeContext } = req.body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message string is required." });
    }

    // Build system instruction
    let systemText = `You are TraderNakul AI Coach, an elite institutional trading mentor and quantitative analyst.
Your objective is to provide sharp, concise, actionable, and accurate responses.
If asked general questions (e.g. "Hi", "What is 2+2?", general definitions), answer directly, naturally, and accurately.
If asked about trading, risk management, liquidity, setups, or market psychology, provide professional trading mentor insights.`;

    if (tradeContext && typeof tradeContext === "object") {
      systemText += `\n\nUser Current Trade Summary Context:\n${JSON.stringify(tradeContext, null, 2)}`;
    }

    // Format chat history according to Gemini v1beta REST API schema
    const formattedContents = history.map((item: { role: string; content: string }) => ({
      role: item.role === "assistant" || item.role === "model" ? "model" : "user",
      parts: [{ text: item.content }],
    }));

    // Append the latest user message
    formattedContents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const payload = {
      systemInstruction: {
        parts: [{ text: systemText }],
      },
      contents: formattedContents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    };

    // Primary & Fallback Models
    const models = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
    ];

    let lastError: string | null = null;

    for (const model of models) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const geminiRes = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await geminiRes.json();

      if (!geminiRes.ok) {
        const errDetail = responseData?.error?.message || geminiRes.statusText;
        lastError = `Gemini API Error (${model} HTTP ${geminiRes.status}): ${errDetail}`;
        // If 404 model not found, try fallback model in loop
        if (geminiRes.status === 404) {
          continue;
        }
        // For non-404 errors (e.g. 400 bad request, 401 unauthorized, 429 quota), return immediately
        return res.status(geminiRes.status).json({ error: lastError });
      }

      const candidateText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!candidateText) {
        return res.status(500).json({
          error: `Gemini API (${model}) returned empty response candidates.`,
        });
      }

      return res.status(200).json({
        reply: candidateText,
        modelUsed: model,
      });
    }

    return res.status(500).json({
      error: lastError || "Failed to reach Gemini API models.",
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return res.status(500).json({ error: `AI Coach API Exception: ${errorMsg}` });
  }
}
