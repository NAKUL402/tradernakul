import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * GET /api/env-check
 * Definitive diagnostic: checks which environment variables are present at RUNTIME.
 * On Vercel, ALL dashboard env vars (including VITE_ prefixed ones) are available
 * as process.env in serverless functions at runtime.
 * If a variable shows NOT SET here, it is definitely not set in Vercel dashboard.
 */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-cache");

  // Read Supabase vars — Vercel exposes all env vars to both frontend build AND api/ runtime
  const supabaseUrl = process.env["VITE_SUPABASE_URL"] || "";
  const supabaseKey = process.env["VITE_SUPABASE_ANON_KEY"] || "";

  // Email vars
  const resendKey = process.env["RESEND_API_KEY"] || "";
  const emailUser = process.env["EMAIL_USER"] || "";
  const emailPass = process.env["EMAIL_PASS"] || "";
  const ownerEmail = process.env["OWNER_EMAIL"] || "";
  const siteUrl = process.env["VITE_SITE_URL"] || "";

  // AI vars
  const groqKey = process.env["GROQ_API_KEY"] || "";
  const openRouterKey = process.env["OPENROUTER_API_KEY"] || "";

  const urlOk = supabaseUrl.startsWith("https://") && supabaseUrl.includes(".supabase.co");
  const keyOk = supabaseKey.length > 20;

  return res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    ai: {
      GROQ_API_KEY: groqKey
        ? `✅ SET — length: ${groqKey.length} chars (primary AI, AI Coach ready)`
        : "❌ NOT SET — Add GROQ_API_KEY to Vercel Environment Variables to enable live Groq AI",
      OPENROUTER_API_KEY: openRouterKey
        ? `✅ SET — length: ${openRouterKey.length} chars (backup AI, automatic fallback ready)`
        : "⚠️ NOT SET — Optional: Add OPENROUTER_API_KEY for automatic fallback when Groq is unavailable",
    },
    supabase: {
      VITE_SUPABASE_URL: urlOk
        ? `✅ SET — ${supabaseUrl}`
        : supabaseUrl
          ? `⚠️ INVALID FORMAT — got: "${supabaseUrl}" (must start with https:// and contain .supabase.co)`
          : "❌ NOT SET — VITE_SUPABASE_URL missing from Vercel Environment Variables",
      VITE_SUPABASE_ANON_KEY: keyOk
        ? `✅ SET — length: ${supabaseKey.length} chars`
        : supabaseKey
          ? `⚠️ TOO SHORT — got ${supabaseKey.length} chars (expected 200+)`
          : "❌ NOT SET — VITE_SUPABASE_ANON_KEY missing from Vercel Environment Variables",
      configured: urlOk && keyOk,
    },
    email: {
      RESEND_API_KEY: resendKey ? "✅ SET" : "❌ NOT SET",
      EMAIL_USER: emailUser ? `✅ SET (${emailUser})` : "❌ NOT SET",
      EMAIL_PASS: emailPass ? "✅ SET" : "❌ NOT SET",
      OWNER_EMAIL: ownerEmail ? `✅ SET (${ownerEmail})` : "❌ NOT SET",
      VITE_SITE_URL: siteUrl ? `✅ SET (${siteUrl})` : "❌ NOT SET",
    },
    diagnosis:
      urlOk && keyOk
        ? "✅ All Supabase variables are correctly configured. Frontend should connect successfully."
        : "❌ Supabase variables missing or invalid. The frontend build will not embed them and 'Invalid API Key' will occur.",
  });
}
