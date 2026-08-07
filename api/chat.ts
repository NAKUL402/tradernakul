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

// ── Supported Gemini Models Pool ─────────────────────────────────────────────
const GEMINI_MODELS_POOL = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-pro",
];

// ── Vercel Serverless Function Handler ──────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("[CHAT_API] STEP 1: Incoming request received");
  
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    console.log("[CHAT_API] STEP 1.1: OPTIONS preflight handled");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    console.log("[CHAT_API] STEP 1.2: Invalid method", req.method);
    return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` });
  }

  try {
    console.log("[CHAT_API] STEP 2: Parsing request body");
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
    console.log("[CHAT_API] STEP 2.1: Prompt length:", cleanPrompt.length);

    if (!cleanPrompt) {
      console.log("[CHAT_API] STEP 2.2: Empty prompt error");
      return res.status(400).json({ success: false, error: "Prompt cannot be empty." });
    }

    console.log("[CHAT_API] STEP 3: Checking GEMINI_API_KEY environment variable");
    const apiKey = process.env["GEMINI_API_KEY"];
    const hasApiKey = Boolean(apiKey && apiKey.trim() !== "" && apiKey !== "placeholder");
    console.log("[CHAT_API] STEP 3.1: GEMINI_API_KEY exists:", hasApiKey);

    if (!hasApiKey) {
      console.log("[CHAT_API] STEP 3.2: GEMINI_API_KEY missing - using fallback mentor generator");
      return res.status(200).json({
        success: true,
        provider: "Google Gemini (Offline / Fallback)",
        response: getFallbackResponse(cleanPrompt),
        warning: "GEMINI_API_KEY is not set in Vercel Environment Variables.",
      });
    }

    console.log("[CHAT_API] STEP 4: Preparing Gemini API Call");
    const systemInstruction =
      "You are a world-class institutional trading mentor for TraderNakul AI Journal. " +
      "You specialize in trading psychology, risk management, liquidity sweeps, price action, and order blocks. " +
      "Keep your answers direct, actionable, professional, and inspiring for intermediate-to-advanced traders." +
      (contextInput ? ` Trader Context: ${contextInput}` : "");

    let lastErrorDetails = "";
    let executionSuccess = false;
    let finalResponseText = "";
    let usedModel = "";

    for (let i = 0; i < GEMINI_MODELS_POOL.length; i++) {
      const modelName = GEMINI_MODELS_POOL[i]!;
      const apiVersion = "v1beta";
      const requestUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

      console.log(`[CHAT_API] STEP 4.${i + 1}: Attempting model execution`);
      console.log(`  - Model Name: ${modelName}`);
      console.log(`  - API Version: ${apiVersion}`);
      console.log(`  - Request URL: ${requestUrl}`);
      console.log(`  - GEMINI_API_KEY Exists: ${hasApiKey}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`[CHAT_API] STEP 4.${i + 1}.TIMEOUT: Request timed out after 12000ms`);
        controller.abort();
      }, 12000);

      try {
        console.log(`[CHAT_API] STEP 5.${i + 1}: Executing fetch call to Google Gemini`);
        const response = await fetch(`${requestUrl}?key=${apiKey}`, {
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
                parts: [{ text: cleanPrompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 800,
            },
          }),
        });

        clearTimeout(timeoutId);

        console.log(`[CHAT_API] STEP 6.${i + 1}: Fetch completed`);
        console.log(`  - HTTP Status: ${response.status} ${response.statusText}`);
        
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((val, key) => {
          responseHeaders[key] = val;
        });
        console.log(`  - Response Headers:`, JSON.stringify(responseHeaders));

        const responseText = await response.text();

        if (!response.ok) {
          console.log(`[CHAT_API] STEP 6.${i + 1}.ERROR: Response not OK!`);
          console.log(`  - FULL Response Body: ${responseText}`);
          
          let parsedErrMsg = responseText;
          try {
            const errJson: unknown = JSON.parse(responseText);
            if (isRecord(errJson)) {
              const errPayload = errJson as GeminiErrorPayload;
              if (errPayload.error && typeof errPayload.error.message === "string") {
                parsedErrMsg = errPayload.error.message;
              }
            }
          } catch {
            // Not JSON
          }

          lastErrorDetails = `HTTP ${response.status} (${parsedErrMsg})`;

          if (
            parsedErrMsg.includes("not found") ||
            parsedErrMsg.includes("not supported") ||
            response.status === 404
          ) {
            console.log(`[CHAT_API] Model ${modelName} unavailable, attempting next model in pool...`);
            continue;
          }

          // Return original error directly so debugging is crystal clear
          return res.status(response.status).json({
            success: false,
            error: `Gemini API Error (HTTP ${response.status}): ${parsedErrMsg}`,
            debug: {
              status: response.status,
              model: modelName,
              rawBody: responseText,
            },
          });
        }

        console.log(`[CHAT_API] STEP 7.${i + 1}: Parsing successful Gemini response JSON`);
        const rawJson: unknown = JSON.parse(responseText);

        if (!isRecord(rawJson)) {
          console.log(`[CHAT_API] STEP 7.${i + 1}.ERROR: Response JSON is not an object`);
          lastErrorDetails = "Invalid JSON structure";
          continue;
        }

        const parsedData = rawJson as GeminiResponse;
        const candidateList = parsedData.candidates;
        const firstCand = Array.isArray(candidateList) ? candidateList[0] : undefined;
        const partList = firstCand?.content?.parts;
        const firstPart = Array.isArray(partList) ? partList[0] : undefined;
        const textOutput = firstPart?.text;

        if (textOutput && textOutput.trim() !== "") {
          console.log(`[CHAT_API] STEP 8: Generated text successfully from ${modelName}`);
          finalResponseText = textOutput.trim();
          usedModel = modelName;
          executionSuccess = true;
          break;
        } else {
          console.log(`[CHAT_API] STEP 7.${i + 1}.WARN: Generated text was empty`);
          lastErrorDetails = "Empty response text from model";
        }
      } catch (fetchErr: unknown) {
        clearTimeout(timeoutId);
        const errMessage = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        const errStack = fetchErr instanceof Error ? fetchErr.stack : "";

        console.error(`[CHAT_API] STEP 5.${i + 1}.EXCEPTION: Async fetch call failed`);
        console.error(`  - Message: ${errMessage}`);
        console.error(`  - Stack: ${errStack}`);

        lastErrorDetails = errMessage;
      }
    }

    if (executionSuccess) {
      console.log(`[CHAT_API] STEP 9: Returning successful HTTP 200 JSON response`);
      return res.status(200).json({
        success: true,
        provider: `Google Gemini (${usedModel})`,
        response: finalResponseText,
      });
    }

    console.log(`[CHAT_API] STEP 10: All models in pool failed`);
    return res.status(500).json({
      success: false,
      error: `All Gemini models failed. Last error: ${lastErrorDetails}`,
    });

  } catch (globalErr: unknown) {
    const message = globalErr instanceof Error ? globalErr.message : String(globalErr);
    const stack = globalErr instanceof Error ? globalErr.stack : "";

    console.error("[CHAT_API] FATAL UNHANDLED EXCEPTION in handler:");
    console.error("  - Message:", message);
    console.error("  - Stack:", stack);

    return res.status(500).json({
      success: false,
      error: `Fatal API Error: ${message}`,
      stack: stack,
    });
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
