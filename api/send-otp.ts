import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * POST /api/send-otp
 * Body: { email: string; otp: string }
 *
 * Sends the OTP to the user via email.
 * Tries Resend API first (recommended), falls back to Gmail SMTP if configured.
 * NEVER returns the OTP in the response — security critical.
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

  // Validate OTP format — must be exactly 6 digits (extra security layer)
  if (!/^\d{6}$/.test(otp)) {
    return res.status(400).json({ success: false, error: "Invalid OTP format" });
  }

  console.log(`[send-otp] Attempting to send OTP email to: ${email}`);
  console.log(`[send-otp] Environment check — RESEND_API_KEY present: ${!!process.env.RESEND_API_KEY}`);
  console.log(`[send-otp] Environment check — EMAIL_USER present: ${!!process.env.EMAIL_USER}`);
  console.log(`[send-otp] Environment check — EMAIL_PASS present: ${!!process.env.EMAIL_PASS}`);

  const resendApiKey = process.env.RESEND_API_KEY;
  const smtpUser = process.env.EMAIL_USER;
  const smtpPass = process.env.EMAIL_PASS;

  const htmlBody = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0b0c16; color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid rgba(99,102,241,0.2);">
      <div style="background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%); padding: 32px 40px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">TraderNakul AI</h1>
        <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.85;">Email Verification Code</p>
      </div>
      <div style="padding: 36px 40px;">
        <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6; margin: 0 0 28px;">
          Use the one-time verification code below to confirm your identity. 
          This code expires in <strong style="color: #a5b4fc;">10 minutes</strong>.
        </p>
        <div style="background: #1e1b4b; border: 1px solid #4338ca; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 28px;">
          <span style="font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #a5b4fc; font-family: 'Courier New', monospace; display: block;">${otp}</span>
        </div>
        <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0;">
          If you did not request this verification code, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;

  // ── Option 1: Resend API (recommended — most reliable on Vercel) ──────────
  if (resendApiKey) {
    try {
      console.log("[send-otp] Using Resend API...");
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "TraderNakul AI <onboarding@resend.dev>",
          to: [email],
          subject: "Your Verification Code — TraderNakul AI",
          html: htmlBody,
          text: `Your 6-digit verification code is: ${otp}\n\nThis code is valid for 10 minutes.\n\nIf you did not request this, please ignore this email.`,
        }),
      });

      const resendData = await response.json().catch(() => ({})) as any;
      console.log("[send-otp] Resend response status:", response.status);
      console.log("[send-otp] Resend response body:", JSON.stringify(resendData));

      if (!response.ok) {
        const errMsg = resendData?.message || resendData?.error || `Resend API error: ${response.status}`;
        console.error("[send-otp] Resend failed:", errMsg);
        return res.status(500).json({ success: false, error: `Email delivery failed: ${errMsg}` });
      }

      console.log(`[send-otp] ✅ OTP email sent via Resend to: ${email} (id: ${resendData.id})`);
      return res.status(200).json({ success: true, provider: "resend" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[send-otp] Resend exception:", msg);
      return res.status(500).json({ success: false, error: `Email delivery failed: ${msg}` });
    }
  }

  // ── Option 2: Gmail SMTP via Nodemailer (fallback) ────────────────────────
  if (smtpUser && smtpPass) {
    try {
      console.log("[send-otp] Using Gmail SMTP (nodemailer)...");
      const nodemailer = (await import("nodemailer")).default;

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: smtpUser, pass: smtpPass },
      });

      // Verify SMTP connection first — gives a real error message if auth fails
      await transporter.verify().catch((verifyErr: Error) => {
        throw new Error(`SMTP authentication failed: ${verifyErr.message}`);
      });

      await transporter.sendMail({
        from: `"TraderNakul AI" <${smtpUser}>`,
        to: email,
        subject: "Your Verification Code — TraderNakul AI",
        html: htmlBody,
        text: `Your verification code: ${otp} (valid 10 minutes)`,
      });

      console.log(`[send-otp] ✅ OTP email sent via Gmail SMTP to: ${email}`);
      return res.status(200).json({ success: true, provider: "gmail_smtp" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[send-otp] Gmail SMTP error:", msg);
      return res.status(500).json({ success: false, error: `Email delivery failed (SMTP): ${msg}` });
    }
  }

  // ── No email provider configured ─────────────────────────────────────────
  const missingMsg =
    "Email service not configured. Please set RESEND_API_KEY (recommended) or EMAIL_USER + EMAIL_PASS in Vercel environment variables.";
  console.error("[send-otp] FATAL:", missingMsg);
  return res.status(500).json({ success: false, error: missingMsg });
}
