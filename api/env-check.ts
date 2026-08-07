import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * GET /api/env-check
 * Diagnostic endpoint — shows whether Supabase environment variables are loaded
 * on the server-side. This does NOT expose key values, only their presence/length.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-cache");

  const supabaseUrl = process.env['VITE_SUPABASE_URL'] || process.env['SUPABASE_URL'] || "";
  const supabaseKey = process.env['VITE_SUPABASE_ANON_KEY'] || process.env['SUPABASE_ANON_KEY'] || "";
  const resendKey = process.env['RESEND_API_KEY'] || "";
  const emailUser = process.env['EMAIL_USER'] || "";
  const emailPass = process.env['EMAIL_PASS'] || "";
  const ownerEmail = process.env['OWNER_EMAIL'] || "nakultrader007@gmail.com (default)";

  const urlSet = supabaseUrl.length > 10;
  const keySet = supabaseKey.length > 20;

  return res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    supabase: {
      VITE_SUPABASE_URL: urlSet
        ? `✅ SET (${supabaseUrl.substring(0, 30)}...)`
        : "❌ NOT SET — frontend will use placeholder and get Invalid API Key",
      VITE_SUPABASE_ANON_KEY: keySet
        ? `✅ SET (length: ${supabaseKey.length} chars)`
        : "❌ NOT SET — all database calls will fail with Invalid API Key",
      configured: urlSet && keySet,
    },
    email: {
      RESEND_API_KEY: resendKey ? "✅ SET" : "❌ NOT SET",
      EMAIL_USER: emailUser ? `✅ SET (${emailUser})` : "❌ NOT SET",
      EMAIL_PASS: emailPass ? "✅ SET" : "❌ NOT SET",
      OWNER_EMAIL: ownerEmail,
    },
    note: "IMPORTANT: VITE_ prefixed variables must be explicitly set in Vercel Environment Variables with their exact name (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) to be embedded into the frontend build. Server-side (api/) reads them at runtime.",
    action_required: (!urlSet || !keySet) ? [
      "1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables",
      "2. Add VITE_SUPABASE_URL = https://cszfyeeykucohwqmgfej.supabase.co",
      "3. Add VITE_SUPABASE_ANON_KEY = your_anon_key_value",
      "4. Redeploy the project (Vercel → Deployments → Redeploy)",
    ] : ["✅ All variables configured correctly"],
  });
}
