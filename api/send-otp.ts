import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * POST /api/send-otp
 * Body: { email: string; otp: string }
 *
 * Provider priority:
 *   1. Resend API      (RESEND_API_KEY env var)
 *      → If Resend returns 403 (testing restriction / domain not verified),
 *        automatically falls through to Gmail SMTP.
 *      → Any other Resend error that is non-fatal also falls through if Gmail is configured.
 *   2. Gmail SMTP      (EMAIL_USER + EMAIL_PASS env vars)
 *      → Sends to ANY email address, no domain verification needed.
 *
 * OTP is NEVER returned in the HTTP response under any circumstance.
 * If both providers fail, returns the exact error messages from each.
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
  if (!/^\d{6}$/.test(String(otp))) {
    return res.status(400).json({ success: false, error: "Invalid OTP format" });
  }

  const resendApiKey = process.env['RESEND_API_KEY'];
  const smtpUser    = process.env['EMAIL_USER'];
  const smtpPass    = process.env['EMAIL_PASS'];
  const resendFrom  = process.env['RESEND_FROM_EMAIL'] || "TraderNakul AI <onboarding@resend.dev>";
  const hasGmail    = !!(smtpUser && smtpPass);

  // ── Logging (no sensitive values logged) ─────────────────────────────────
  console.log("[send-otp] ────────────────────────────────────");
  console.log(`[send-otp] Recipient   : ${email}`);
  console.log(`[send-otp] Resend key  : ${resendApiKey ? "SET" : "NOT SET"}`);
  console.log(`[send-otp] Resend from : ${resendFrom}`);
  console.log(`[send-otp] Gmail user  : ${smtpUser ? "SET" : "NOT SET"}`);
  console.log(`[send-otp] Gmail pass  : ${smtpPass ? "SET" : "NOT SET"}`);

  const htmlBody = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#0b0c16;color:#fff;border-radius:16px;overflow:hidden;border:1px solid rgba(99,102,241,0.2);">
      <div style="background:linear-gradient(135deg,#4338ca 0%,#6366f1 100%);padding:32px 40px;text-align:center;">
        <h1 style="margin:0;font-size:22px;font-weight:700;letter-spacing:-0.5px;">TraderNakul AI</h1>
        <p style="margin:6px 0 0;font-size:13px;opacity:0.85;">Email Verification</p>
      </div>
      <div style="padding:36px 40px;">
        <p style="font-size:15px;color:#cbd5e1;line-height:1.6;margin:0 0 28px;">
          Use the one-time code below to verify your identity.
          This code expires in <strong style="color:#a5b4fc;">10 minutes</strong>.
        </p>
        <div style="background:#1e1b4b;border:1px solid #4338ca;border-radius:12px;padding:28px;text-align:center;margin:0 0 28px;">
          <span style="font-size:44px;font-weight:800;letter-spacing:14px;color:#a5b4fc;font-family:'Courier New',monospace;display:block;">${otp}</span>
        </div>
        <p style="font-size:12px;color:#64748b;text-align:center;margin:0;">
          If you did not request this, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;
  const textBody = `Your TraderNakul AI verification code: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.`;

  // Track errors from each provider for the final error report
  let resendError: string | null = null;
  let gmailError: string | null = null;

  // ── Provider 1: Resend API ────────────────────────────────────────────────
  if (resendApiKey) {
    console.log("[send-otp] Trying Provider 1: Resend API...");
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
          text: textBody,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as Record<string, any>;
      console.log(`[send-otp] Resend HTTP ${response.status}:`, JSON.stringify(data));

      if (response.ok && data['id']) {
        // ✅ Resend succeeded
        console.log(`[send-otp] ✅ Provider 1 (Resend) success — email id: ${data['id']}`);
        return res.status(200).json({ success: true, provider: "resend" });
      }

      // Resend failed — capture the exact error message
      resendError = data['message'] || data['error'] || data['name'] || `HTTP ${response.status}`;
      console.warn(`[send-otp] Resend failed: ${resendError}`);

      // Resend testing restriction = HTTP 403 with specific message
      // Always attempt Gmail fallback regardless of error type if Gmail is configured
      if (hasGmail) {
        console.log("[send-otp] Resend failed → falling through to Provider 2 (Gmail SMTP)");
        // fall through to Gmail block below
      } else {
        // No Gmail fallback — return the exact Resend error
        return res.status(500).json({
          success: false,
          error: `Resend: ${resendError}. To fix: either verify a domain at resend.com/domains, or configure EMAIL_USER + EMAIL_PASS (Gmail App Password) in Vercel environment variables.`,
        });
      }
    } catch (err: unknown) {
      resendError = err instanceof Error ? err['message'] : String(err);
      console.error("[send-otp] Resend exception:", resendError);
      if (!hasGmail) {
        return res.status(500).json({ success: false, error: `Resend exception: ${resendError}` });
      }
      console.log("[send-otp] Resend threw exception → falling through to Gmail SMTP");
    }
  }

  // ── Provider 2: Gmail SMTP ────────────────────────────────────────────────
  // Sends to any recipient address without domain verification
  if (hasGmail) {
    console.log("[send-otp] Trying Provider 2: Gmail SMTP...");
    try {
      const nodemailer = (await import("nodemailer")).default;

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: smtpUser, pass: smtpPass },
      });

      // Verify SMTP credentials before sending — gives the exact auth error if wrong
      await transporter.verify().catch((e: Error) => {
        throw new Error(
          `Gmail auth failed — EMAIL_PASS must be a 16-character App Password, not your regular Gmail password. ` +
          `Get one at: myaccount.google.com/apppasswords — Error: ${e['message']}`
        );
      });

      await transporter.sendMail({
        from: `"TraderNakul AI" <${smtpUser}>`,
        to: email,
        subject: "Your Verification Code — TraderNakul AI",
        html: htmlBody,
        text: textBody,
      });

      console.log(`[send-otp] ✅ Provider 2 (Gmail SMTP) success → delivered to: ${email}`);
      return res.status(200).json({ success: true, provider: "gmail_smtp" });

    } catch (err: unknown) {
      gmailError = err instanceof Error ? err['message'] : String(err);
      console.error("[send-otp] Gmail SMTP failed:", gmailError);
    }
  }

  // ── Both providers failed (or neither configured) ─────────────────────────
  const parts: string[] = [];
  if (resendError)  parts.push(`Resend: ${resendError}`);
  if (gmailError)   parts.push(`Gmail SMTP: ${gmailError}`);
  if (parts.length === 0) {
    parts.push(
      "No email provider configured. Set RESEND_API_KEY in Vercel env vars, " +
      "or set EMAIL_USER + EMAIL_PASS (Gmail App Password)."
    );
  }

  const finalError = parts.join(" | ");
  console.error("[send-otp] ❌ All providers failed:", finalError);

  // Return the real errors — OTP is never included
  return res.status(500).json({ success: false, error: finalError });
}
