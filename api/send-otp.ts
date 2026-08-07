import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * POST /api/send-otp
 * Body: { email: string; otp: string }
 *
 * Email provider priority:
 *  1. Resend API  — requires RESEND_API_KEY + (for non-account emails) a verified domain
 *  2. Gmail SMTP  — requires EMAIL_USER + EMAIL_PASS (App Password), sends to ANY email
 *
 * NEVER returns the OTP in the response.
 *
 * From address:
 *  - Testing (no domain verified): "onboarding@resend.dev"  — can only send TO the Resend account email
 *  - Production (domain verified) : set RESEND_FROM_EMAIL=noreply@mail.tradernakul.com
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, otp } = req.body || {};
  if (!email || !otp) {
    return res.status(400).json({ success: false, error: "Missing email or otp" });
  }
  if (!/^\d{6}$/.test(otp)) {
    return res.status(400).json({ success: false, error: "Invalid OTP format" });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const smtpUser = process.env.EMAIL_USER;
  const smtpPass = process.env.EMAIL_PASS;

  // From address: use verified domain address in production, shared domain for testing
  const resendFrom = process.env.RESEND_FROM_EMAIL || "TraderNakul AI <onboarding@resend.dev>";

  console.log(`[send-otp] Sending OTP to: ${email}`);
  console.log(`[send-otp] RESEND_API_KEY: ${resendApiKey ? "SET" : "NOT SET"}`);
  console.log(`[send-otp] RESEND_FROM_EMAIL: ${resendFrom}`);
  console.log(`[send-otp] EMAIL_USER: ${smtpUser ? "SET" : "NOT SET"}`);

  const htmlBody = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#0b0c16;color:#fff;border-radius:16px;overflow:hidden;border:1px solid rgba(99,102,241,0.2);">
      <div style="background:linear-gradient(135deg,#4338ca 0%,#6366f1 100%);padding:32px 40px;text-align:center;">
        <h1 style="margin:0;font-size:22px;font-weight:700;">TraderNakul AI</h1>
        <p style="margin:6px 0 0;font-size:13px;opacity:0.85;">Email Verification Code</p>
      </div>
      <div style="padding:36px 40px;">
        <p style="font-size:15px;color:#cbd5e1;line-height:1.6;margin:0 0 28px;">
          Use the one-time code below to verify your identity.
          Expires in <strong style="color:#a5b4fc;">10 minutes</strong>.
        </p>
        <div style="background:#1e1b4b;border:1px solid #4338ca;border-radius:12px;padding:24px;text-align:center;margin:0 0 28px;">
          <span style="font-size:42px;font-weight:800;letter-spacing:12px;color:#a5b4fc;font-family:'Courier New',monospace;display:block;">${otp}</span>
        </div>
        <p style="font-size:12px;color:#64748b;text-align:center;margin:0;">
          If you did not request this code, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;

  // ── Option 1: Resend API ──────────────────────────────────────────────────
  if (resendApiKey) {
    console.log("[send-otp] Attempting Resend API...");
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [email],
          subject: "Your Verification Code — TraderNakul AI",
          html: htmlBody,
          text: `Your 6-digit code: ${otp}\nExpires in 10 minutes. Do not share this code.`,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as any;
      console.log(`[send-otp] Resend status: ${response.status}`, JSON.stringify(data));

      if (response.ok) {
        console.log(`[send-otp] ✅ Sent via Resend to: ${email} (id: ${data.id})`);
        return res.status(200).json({ success: true, provider: "resend" });
      }

      // Specific error: domain not verified — fall through to SMTP if available
      const errMsg: string = data?.message || data?.error || `Resend error ${response.status}`;
      const isDomainError =
        errMsg.toLowerCase().includes("domain") ||
        errMsg.toLowerCase().includes("verify") ||
        errMsg.toLowerCase().includes("own email");

      if (isDomainError && (smtpUser && smtpPass)) {
        console.warn("[send-otp] Resend domain not verified — falling back to Gmail SMTP");
        // fall through to SMTP block below
      } else {
        console.error("[send-otp] Resend failed (non-recoverable):", errMsg);
        return res.status(500).json({
          success: false,
          error: isDomainError
            ? "Email delivery requires domain verification in Resend. Please set up Gmail SMTP as a fallback (EMAIL_USER + EMAIL_PASS), or verify your domain at resend.com/domains."
            : `Email delivery failed: ${errMsg}`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[send-otp] Resend exception:", msg);
      if (!(smtpUser && smtpPass)) {
        return res.status(500).json({ success: false, error: `Resend error: ${msg}` });
      }
      console.warn("[send-otp] Falling back to Gmail SMTP after Resend exception");
    }
  }

  // ── Option 2: Gmail SMTP (works for ANY recipient without domain verification) ──
  if (smtpUser && smtpPass) {
    console.log("[send-otp] Attempting Gmail SMTP...");
    try {
      const nodemailer = (await import("nodemailer")).default;
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: smtpUser, pass: smtpPass },
      });

      await transporter.verify().catch((e: Error) => {
        throw new Error(
          `Gmail SMTP auth failed — make sure EMAIL_PASS is a 16-char App Password (not your Gmail login password): ${e.message}`
        );
      });

      await transporter.sendMail({
        from: `"TraderNakul AI" <${smtpUser}>`,
        to: email,
        subject: "Your Verification Code — TraderNakul AI",
        html: htmlBody,
        text: `Your 6-digit code: ${otp}\nExpires in 10 minutes.`,
      });

      console.log(`[send-otp] ✅ Sent via Gmail SMTP to: ${email}`);
      return res.status(200).json({ success: true, provider: "gmail_smtp" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[send-otp] Gmail SMTP failed:", msg);
      return res.status(500).json({ success: false, error: `Gmail SMTP error: ${msg}` });
    }
  }

  // ── No provider configured ────────────────────────────────────────────────
  const noProviderMsg =
    "No email provider configured. Add RESEND_API_KEY (plus verify domain at resend.com) OR add EMAIL_USER + EMAIL_PASS (Gmail App Password).";
  console.error("[send-otp] FATAL:", noProviderMsg);
  return res.status(500).json({ success: false, error: noProviderMsg });
}
