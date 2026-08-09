import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * GET /api/health
 * Diagnostic — shows which env vars are loaded and which email provider will be used.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-cache");

  const resendKey = !!process.env['RESEND_API_KEY'];
  const smtpUser = !!process.env['EMAIL_USER'];
  const smtpPass = !!process.env['EMAIL_PASS'];
  const resendFrom = process.env['RESEND_FROM_EMAIL'] || "onboarding@resend.dev (default — testing only)";

  let activeProvider = "❌ NONE — email will fail";
  if (resendKey) activeProvider = "✅ Resend API";
  if (!resendKey && smtpUser && smtpPass) activeProvider = "✅ Gmail SMTP";
  if (resendKey && smtpUser && smtpPass) activeProvider = "✅ Resend (Gmail SMTP as fallback)";

  const hasSupabaseUrl = !!(process.env['VITE_SUPABASE_URL'] || process.env['SUPABASE_URL']);
  const hasSupabaseKey = !!(process.env['VITE_SUPABASE_ANON_KEY'] || process.env['SUPABASE_ANON_KEY']);

  return res.status(200).json({
    status: "ok",
    runtime: "vercel-node",
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
    activeEmailProvider: activeProvider,
    database: {
      provider: (hasSupabaseUrl && hasSupabaseKey) ? "✅ Production Supabase Shared DB" : "❌ LocalStorage Mock Engine (NOT SHARED)",
      VITE_SUPABASE_URL: hasSupabaseUrl ? "✅ SET" : "❌ NOT SET",
      VITE_SUPABASE_ANON_KEY: hasSupabaseKey ? "✅ SET" : "❌ NOT SET",
    },
    env: {
      RESEND_API_KEY: resendKey ? "✅ SET" : "❌ NOT SET",
      RESEND_FROM_EMAIL: resendFrom,
      EMAIL_USER: smtpUser ? "✅ SET" : "❌ NOT SET",
      EMAIL_PASS: smtpPass ? "✅ SET" : "❌ NOT SET",
      OWNER_EMAIL: process.env['OWNER_EMAIL'] || "❌ NOT SET",
      VITE_SITE_URL: process.env['VITE_SITE_URL'] || "❌ NOT SET (email links may be wrong)",
      GROQ_API_KEY: process.env['GROQ_API_KEY'] ? "✅ SET (primary AI)" : "❌ NOT SET",
      OPENROUTER_API_KEY: process.env['OPENROUTER_API_KEY'] ? "✅ SET (backup AI)" : "❌ NOT SET",
      APPROVAL_SECRET: process.env['APPROVAL_SECRET'] ? "✅ SET" : "using default",
    },
    notes: [
      "Resend free tier: can only send to your OWN Resend account email until you verify a domain.",
      "To send to any email: verify a domain at resend.com/domains, then set RESEND_FROM_EMAIL=noreply@yourdomain.com",
      "Gmail SMTP: set EMAIL_USER + EMAIL_PASS (16-char App Password) — works for any recipient immediately.",
      "Shared database: to make the Admin Panel sync across devices, you MUST set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel settings.",
    ],
  });
}
