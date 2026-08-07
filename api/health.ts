import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * GET /api/health
 * Diagnostic endpoint — verifies serverless functions are running and env vars are loaded.
 * Returns: runtime info, env var presence (NOT values), Node.js version.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-cache");

  return res.status(200).json({
    status: "ok",
    runtime: "vercel-node",
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
    env: {
      RESEND_API_KEY: !!process.env.RESEND_API_KEY ? "✅ SET" : "❌ NOT SET",
      EMAIL_USER: !!process.env.EMAIL_USER ? "✅ SET" : "❌ NOT SET",
      EMAIL_PASS: !!process.env.EMAIL_PASS ? "✅ SET" : "❌ NOT SET",
      OWNER_EMAIL: process.env.OWNER_EMAIL || "nakultrader007@gmail.com (default)",
      VITE_SITE_URL: process.env.VITE_SITE_URL || "not set (using default)",
      APPROVAL_SECRET: !!process.env.APPROVAL_SECRET ? "✅ SET" : "❌ NOT SET (using default)",
    },
    message: "If all env vars show NOT SET, go to Vercel Dashboard → Settings → Environment Variables and add them, then redeploy.",
  });
}
