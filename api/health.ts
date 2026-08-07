import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * GET /api/health
 * Diagnostic — shows which env vars are loaded and which email provider will be used.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-cache");

  const resendKey = !!process.env.RESEND_API_KEY;
  const smtpUser = !!process.env.EMAIL_USER;
  const smtpPass = !!process.env.EMAIL_PASS;
  const resendFrom = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev (default — testing only)";

  let activeProvider = "❌ NONE — email will fail";
  if (resendKey) activeProvider = "✅ Resend API";
  if (!resendKey && smtpUser && smtpPass) activeProvider = "✅ Gmail SMTP";
  if (resendKey && smtpUser && smtpPass) activeProvider = "✅ Resend (Gmail SMTP as fallback)";

  return res.status(200).json({
    status: "ok",
    runtime: "vercel-node",
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
    activeEmailProvider: activeProvider,
    env: {
      RESEND_API_KEY: resendKey ? "✅ SET" : "❌ NOT SET",
      RESEND_FROM_EMAIL: resendFrom,
      EMAIL_USER: smtpUser ? "✅ SET" : "❌ NOT SET",
      EMAIL_PASS: smtpPass ? "✅ SET" : "❌ NOT SET",
      OWNER_EMAIL: process.env.OWNER_EMAIL || "nakultrader007@gmail.com (default)",
      VITE_SITE_URL: process.env.VITE_SITE_URL || "❌ NOT SET (email links may be wrong)",
      APPROVAL_SECRET: process.env.APPROVAL_SECRET ? "✅ SET" : "using default",
    },
    notes: [
      "Resend free tier: can only send to your OWN Resend account email until you verify a domain.",
      "To send to any email: verify a domain at resend.com/domains, then set RESEND_FROM_EMAIL=noreply@yourdomain.com",
      "Gmail SMTP: set EMAIL_USER + EMAIL_PASS (16-char App Password) — works for any recipient immediately.",
    ],
  });
}
