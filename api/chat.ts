import type { VercelRequest, VercelResponse } from "@vercel/node";

// ── Modular AI Provider Interface ──────────────────────────────────────────
export interface AIProvider {
  name: string;
  generateResponse(prompt: string, context?: string): Promise<string>;
}

// ── Google Gemini AI Provider Implementation ─────────────────────────────────
export class GeminiProvider implements AIProvider {
  name = "Google Gemini";

  async generateResponse(prompt: string, context?: string): Promise<string> {
    const apiKey = process.env['GEMINI_API_KEY'];

    if (!apiKey || apiKey.trim() === "" || apiKey === "placeholder") {
      throw new Error("GEMINI_API_KEY_MISSING");
    }

    const systemInstruction = `You are a world-class institutional trading mentor for TraderNakul AI Journal.
You specialize in trading psychology, risk management, liquidity sweeps, price action, and order blocks.
Keep your answers direct, actionable, professional, and inspiring for intermediate-to-advanced traders.
${context ? `Trader Context: ${context}` : ""}`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401 || response.status === 403) {
          throw new Error("GEMINI_INVALID_KEY");
        }
        if (response.status === 429) {
          throw new Error("GEMINI_RATE_LIMIT");
        }
        const errMsg = (errorData as Record<string, any>)['error']?.['message'] || `HTTP Error ${response.status}`;
        throw new Error(`GEMINI_API_ERROR: ${errMsg}`);
      }

      const data = await response.json();
      const text = data['candidates']?.[0]?.['content']?.['parts']?.[0]?.['text'];

      if (!text || text.trim() === "") {
        throw new Error("GEMINI_EMPTY_RESPONSE");
      }

      return text.trim();
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        throw new Error("GEMINI_TIMEOUT");
      }
      throw err;
    }
  }
}

// ── Registry of AI Providers for Future Expansion (Groq, OpenRouter, Mistral, Cohere)
export const AI_PROVIDERS: Record<string, AIProvider> = {
  gemini: new GeminiProvider(),
};

// ── Vercel Serverless Function Handler ──────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt, context, provider = "gemini" } = req.body || {};

    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      return res.status(400).json({ error: "Prompt cannot be empty." });
    }

    const aiProvider = AI_PROVIDERS[provider] || AI_PROVIDERS['gemini'];

    try {
      const responseText = await aiProvider.generateResponse(prompt.trim(), context);
      return res.status(200).json({
        success: true,
        provider: aiProvider.name,
        response: responseText,
      });
    } catch (providerErr: any) {
      const code = providerErr.message || "";

      if (code === "GEMINI_API_KEY_MISSING") {
        return res.status(200).json({
          success: true,
          provider: "Google Gemini (Offline / Fallback)",
          response: getFallbackMentorResponse(prompt),
          warning: "GEMINI_API_KEY is not set in Vercel Environment Variables. Add GEMINI_API_KEY to enable live Gemini AI generation.",
        });
      }

      if (code === "GEMINI_INVALID_KEY") {
        return res.status(401).json({
          error: "Invalid Gemini API Key. Please verify GEMINI_API_KEY in your Vercel Environment Variables.",
        });
      }

      if (code === "GEMINI_RATE_LIMIT") {
        return res.status(429).json({
          error: "Gemini API rate limit exceeded. Please wait a moment before asking again.",
        });
      }

      if (code === "GEMINI_TIMEOUT") {
        return res.status(504).json({
          error: "Gemini API request timed out. Please try again.",
        });
      }

      return res.status(500).json({
        error: `AI Provider Error: ${providerErr.message || "Failed to generate response."}`,
      });
    }
  } catch (err: any) {
    console.error("Chat API handler error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

// ── Smart Trading Mentor Fallback Generator ──────────────────────────────
function getFallbackMentorResponse(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("revenge") || lower.includes("loss")) {
    return "Revenge trading is an emotional attempt to regain lost capital in an uncontrollable market. Take a mandatory 30-minute cooling-off period after any stop out: close your charts, reset your mind, and evaluate your entry rules before placing another trade.";
  }
  if (lower.includes("lot") || lower.includes("position") || lower.includes("size")) {
    return "Calculate lot size dynamically: (Account Capital × Risk %) ÷ (Stop Loss Distance × Pip Value). Never risk more than 1% to 2% on a single trade setup.";
  }
  if (lower.includes("london") || lower.includes("sweep") || lower.includes("liquidity")) {
    return "London Session sweeps happen when Asian range highs/lows are taken out to grab retail stops. Wait for a clear 15m/5m Market Structure Break (BOS) and Fair Value Gap (FVG) before taking your entry.";
  }
  if (lower.includes("rrr") || lower.includes("ratio")) {
    return "To boost your Risk:Reward Ratio: 1) Refuse entries offering under 1:2 RRR. 2) Refine your entry on lower timeframes at key Point of Interest (POI) levels. 3) Take partial profits at 1:2 and let the runner hit institutional liquidity targets.";
  }
  return "Trading mastery requires strict execution of your plan, capital preservation, and patience. Focus on taking high-conviction setups and protecting your capital first.";
}
