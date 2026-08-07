import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createAPIFileRoute } from "@tanstack/start/api";

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

// ── Supported Gemini Models Pool ─────────────────────────────────────────────
const GEMINI_MODELS_POOL = [
  "gemini-2.0-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash",
  "gemini-1.5-pro-latest",
  "gemini-1.5-pro",
];

async function handleChatRequest(prompt: string, context?: string) {
  const apiKey = process.env["GEMINI_API_KEY"];

  if (!apiKey || apiKey.trim() === "" || apiKey === "placeholder") {
    return {
      success: true,
      provider: "Google Gemini (Offline / Fallback)",
      response: getFallbackResponse(prompt),
      warning: "GEMINI_API_KEY is not set in Vercel Environment Variables.",
    };
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
          return { success: false, error: "Invalid Gemini API Key. Please verify GEMINI_API_KEY in Vercel." };
        }
        if (response.status === 429) {
          return { success: false, error: "Gemini API rate limit exceeded. Please wait a moment before trying again." };
        }

        if (
          errMsg.includes("not found") ||
          errMsg.includes("not supported") ||
          errMsg.includes("404") ||
          response.status === 404
        ) {
          lastErrorMsg = errMsg;
          continue;
        }

        return { success: false, error: `AI Provider Error: ${errMsg}` };
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
        return {
          success: true,
          provider: "Google Gemini",
          response: generatedText.trim(),
        };
      }
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          lastErrorMsg = "Request timeout";
        } else {
          lastErrorMsg = err.message;
        }
      }
    }
  }

  return {
    success: false,
    error: `AI Provider Error: ${lastErrorMsg || "Supported Gemini models endpoints unavailable."}`,
  };
}

// ── TanStack Start API File Route Endpoint ──────────────────────────────────
export const APIRoute = createAPIFileRoute("/api/chat")({
  POST: async ({ request }) => {
    try {
      const requestBody: unknown = await request.json().catch(() => ({}));
      let promptInput = "";
      let contextInput: string | undefined = undefined;

      if (isRecord(requestBody)) {
        if (typeof requestBody["prompt"] === "string") {
          promptInput = requestBody["prompt"];
        }
        if (typeof requestBody["context"] === "string") {
          contextInput = requestBody["context"];
        }
      }

      const cleanPrompt = promptInput.trim();
      if (!cleanPrompt) {
        return new Response(JSON.stringify({ success: false, error: "Prompt cannot be empty." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = await handleChatRequest(cleanPrompt, contextInput);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: unknown) {
      return new Response(JSON.stringify({ success: false, error: "Internal server error." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});

// ── Vercel Serverless Function Handler Compatibility ─────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const requestBody: unknown = req.body || {};
  let promptInput = "";
  let contextInput: string | undefined = undefined;

  if (isRecord(requestBody)) {
    if (typeof requestBody["prompt"] === "string") {
      promptInput = requestBody["prompt"];
    }
    if (typeof requestBody["context"] === "string") {
      contextInput = requestBody["context"];
    }
  }

  const cleanPrompt = promptInput.trim();
  if (!cleanPrompt) {
    return res.status(400).json({ success: false, error: "Prompt cannot be empty." });
  }

  const result = await handleChatRequest(cleanPrompt, contextInput);
  return res.status(result.success ? 200 : 500).json(result);
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
