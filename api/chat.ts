import type { VercelRequest, VercelResponse } from "@vercel/node";

// ── Gemini API Response Interfaces ──────────────────────────────────────────
interface GeminiPart {
  text?: string;
}

interface GeminiContent {
  parts?: GeminiPart[];
  role?: string;
}

interface GeminiCandidate {
  content?: GeminiContent;
  finishReason?: string;
  index?: number;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  promptFeedback?: {
    blockReason?: string;
  };
}

interface GeminiErrorDetail {
  code?: number;
  message?: string;
  status?: string;
}

interface GeminiErrorPayload {
  error?: GeminiErrorDetail;
}

// ── Type Guard Helper ───────────────────────────────────────────────────────
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// ── Modular AI Provider Interface ──────────────────────────────────────────
export interface AIProvider {
  name: string;
  generateResponse(prompt: string, context?: string): Promise<string>;
}

// ── Supported Gemini Models Pool ─────────────────────────────────────────────
const GEMINI_MODELS_POOL = [
  "gemini-2.0-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash",
  "gemini-1.5-pro-latest",
  "gemini-1.5-pro",
];

// ── Google Gemini Provider Implementation ─────────────────────────────────
export class GeminiProvider implements AIProvider {
  name = "Google Gemini";

  async generateResponse(prompt: string, context?: string): Promise<string> {
    const apiKey = process.env["GEMINI_API_KEY"];

    if (!apiKey || apiKey.trim() === "" || apiKey === "placeholder") {
      throw new Error("GEMINI_API_KEY_MISSING");
    }

    const systemInstruction =
      "You are a world-class institutional trading mentor for TraderNakul AI Journal. " +
      "You specialize in trading psychology, risk management, liquidity sweeps, price action, and order blocks. " +
      "Keep your answers direct, actionable, professional, and inspiring for intermediate-to-advanced traders." +
      (context ? ` Trader Context: ${context}` : "");

    let lastErrorMsg = "";

    for (const modelName of GEMINI_MODELS_POOL) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

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
          let errMsg = `HTTP Error ${response.status}`;
          try {
            const errorJson: unknown = await response.json();
            if (isRecord(errorJson)) {
              const errPayload = errorJson as GeminiErrorPayload;
              if (errPayload.error && typeof errPayload.error.message === "string") {
                errMsg = errPayload.error.message;
              }
            }
          } catch {
            // Fallback
          }

          if (response.status === 401 || response.status === 403) {
            throw new Error("GEMINI_INVALID_KEY");
          }
          if (response.status === 429) {
            throw new Error("GEMINI_RATE_LIMIT");
          }

          // If model is not found or unsupported on this endpoint, try next model
          if (
            errMsg.includes("not found") ||
            errMsg.includes("not supported") ||
            errMsg.includes("404") ||
            response.status === 404
          ) {
            lastErrorMsg = errMsg;
            continue;
          }

          throw new Error(`GEMINI_API_ERROR: ${errMsg}`);
        }

        const rawJson: unknown = await response.json();

        if (!isRecord(rawJson)) {
          continue;
        }

        const parsedData = rawJson as GeminiResponse;
        const candidateList = parsedData.candidates;
        const firstCand = Array.isArray(candidateList) ? candidateList[0] : undefined;
        const partList = firstCand?.content?.parts;
        const firstPart = Array.isArray(partList) ? partList[0] : undefined;
        const generatedText = firstPart?.text;

        if (generatedText && generatedText.trim() !== "") {
          return generatedText.trim();
        }
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        if (err instanceof Error) {
          if (err.message === "GEMINI_INVALID_KEY" || err.message === "GEMINI_RATE_LIMIT") {
            throw err;
          }
          if (err.name === "AbortError") {
            lastErrorMsg = "Request timeout";
          } else {
            lastErrorMsg = err.message;
          }
        }
      }
    }

    throw new Error(`GEMINI_API_ERROR: ${lastErrorMsg || "Supported Gemini models endpoints unavailable."}`);
  }
}

// ── AI Provider Registry ────────────────────────────────────────────────────
export const AI_PROVIDERS: Record<string, AIProvider> = {
  gemini: new GeminiProvider(),
};

// ── Vercel Serverless Function Handler ──────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const requestBody: unknown = req.body || {};
    let promptInput = "";
    let contextInput: string | undefined = undefined;
    let providerName = "gemini";

    if (isRecord(requestBody)) {
      if (typeof requestBody["prompt"] === "string") {
        promptInput = requestBody["prompt"];
      }
      if (typeof requestBody["context"] === "string") {
        contextInput = requestBody["context"];
      }
      if (typeof requestBody["provider"] === "string") {
        providerName = requestBody["provider"];
      }
    }

    const cleanPrompt = promptInput.trim();
    if (!cleanPrompt) {
      return res.status(400).json({ success: false, error: "Prompt cannot be empty." });
    }

    const providerInstance = AI_PROVIDERS[providerName] || AI_PROVIDERS["gemini"];

    try {
      const outputText = await providerInstance.generateResponse(cleanPrompt, contextInput);
      return res.status(200).json({
        success: true,
        provider: providerInstance.name,
        response: outputText,
      });
    } catch (providerErr: unknown) {
      const errMessage = providerErr instanceof Error ? providerErr.message : "";

      if (errMessage === "GEMINI_API_KEY_MISSING") {
        return res.status(200).json({
          success: true,
          provider: "Google Gemini (Offline / Fallback)",
          response: getFallbackResponse(cleanPrompt),
          warning: "GEMINI_API_KEY is not set in Vercel Environment Variables.",
        });
      }

      if (errMessage === "GEMINI_INVALID_KEY") {
        return res.status(401).json({
          success: false,
          error: "Invalid Gemini API Key. Please verify GEMINI_API_KEY in Vercel.",
        });
      }

      if (errMessage === "GEMINI_RATE_LIMIT") {
        return res.status(429).json({
          success: false,
          error: "Gemini API rate limit exceeded. Please wait a moment before trying again.",
        });
      }

      if (errMessage === "GEMINI_TIMEOUT") {
        return res.status(504).json({
          success: false,
          error: "Gemini API request timed out. Please try again.",
        });
      }

      return res.status(500).json({
        success: false,
        error: `AI Provider Error: ${errMessage || "Failed to generate response."}`,
      });
    }
  } catch (handlerErr: unknown) {
    console.error("Chat handler error:", handlerErr);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
}

// ── Offline Fallback Response Generator ─────────────────────────────────────
function getFallbackResponse(prompt: string): string {
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
