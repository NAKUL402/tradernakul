import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * POST /api/send-status-email
 * Body: { email: string; name: string; status: "approved" | "rejected" }
 *
 * Sends an email notification to a user when their account access request
 * is approved or rejected by the admin.
 * Tries Resend API first (recommended), falls back to Gmail SMTP if configured.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, name, status } = req.body || {};
  if (!email || !name || !status || !["approved", "rejected"].includes(status)) {
    return res.status(400).json({ success: false, error: "Missing or invalid email, name, or status" });
  }

  const resendApiKey = process.env['RESEND_API_KEY'];
  const smtpUser = process.env['EMAIL_USER'];
  const smtpPass = process.env['EMAIL_PASS'];
  const resendFrom = process.env['RESEND_FROM_EMAIL'] || "Edge Journal <onboarding@resend.dev>";
  const hasGmail = !!(smtpUser && smtpPass);

  console.log(`[send-status-email] Sending ${status} notification to: ${email}`);

  const isApproved = status === "approved";
  const statusLabel = isApproved ? "Access Approved" : "Access Denied";
  const headerColor = isApproved ? "linear-gradient(135deg, #059669 0%, #10b981 100%)" : "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)";
  
  const htmlBody = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#0b0c16;color:#fff;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
      <div style="background:${headerColor};padding:32px 40px;text-align:center;">
        <h1 style="margin:0;font-size:22px;font-weight:700;">Edge Journal</h1>
        <p style="margin:6px 0 0;font-size:13px;opacity:0.9;text-transform:uppercase;letter-spacing:1px;">${statusLabel}</p>
      </div>
      <div style="padding:36px 40px;background:#131524;">
        <p style="font-size:16px;color:#f1f5f9;line-height:1.6;margin:0 0 16px;">
          Hello ${name},
        </p>
        ${isApproved ? `
          <p style="font-size:15px;color:#cbd5e1;line-height:1.6;margin:0 0 24px;">
            We are pleased to inform you that your request for access to <strong style="color:#10b981;">Edge Journal</strong> has been approved by the administrator.
          </p>
          <div style="text-align:center;margin:30px 0;">
            <a href="${process.env['VITE_SITE_URL'] || "https://Edge Journal.vercel.app"}/login" 
               style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;padding:12px 30px;border-radius:10px;font-weight:700;font-size:15px;box-shadow:0 4px 12px rgba(16,185,129,0.3);">
              Log In to Dashboard
            </a>
          </div>
        ` : `
          <p style="font-size:15px;color:#cbd5e1;line-height:1.6;margin:0 0 24px;">
            Thank you for your interest in Edge Journal. Unfortunately, your request for access has been declined by the administrator at this time.
          </p>
          <p style="font-size:14px;color:#94a3b8;line-height:1.6;margin:0 0 24px;">
            If you believe this is a mistake or have questions, please contact us.
          </p>
        `}
        <hr style="border:0;border-top:1px solid rgba(255,255,255,0.08);margin:24px 0;" />
        <p style="font-size:12px;color:#64748b;text-align:center;margin:0;">
          This is an automated notification from Edge Journal.
        </p>
      </div>
    </div>
  `;

  const textBody = isApproved 
    ? `Hello ${name},\n\nYour request for access to Edge Journal has been approved! You can now log in here: ${process.env['VITE_SITE_URL'] || "https://Edge Journal.vercel.app"}/login`
    : `Hello ${name},\n\nYour request for access to Edge Journal was declined by the administrator.`;

  let resendError: string | null = null;
  let gmailError: string | null = null;

  // Try Resend first
  if (resendApiKey) {
    console.log("[send-status-email] Trying Resend API...");
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
          subject: `Edge Journal — ${statusLabel}`,
          html: htmlBody,
          text: textBody,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as Record<string, any>;
      if (response.ok && data['id']) {
        console.log(`[send-status-email] ✅ Resend success: ${data['id']}`);
        return res.status(200).json({ success: true, provider: "resend" });
      }

      resendError = data['message'] || data['error'] || `HTTP ${response.status}`;
      console.warn(`[send-status-email] Resend failed: ${resendError}`);
    } catch (err: unknown) {
      resendError = err instanceof Error ? err.message : String(err);
      console.error("[send-status-email] Resend exception:", resendError);
    }
  }

  // Fallback to Gmail SMTP
  if (hasGmail) {
    console.log("[send-status-email] Trying Gmail SMTP fallback...");
    try {
      const nodemailer = (await import("nodemailer")).default;
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: smtpUser, pass: smtpPass },
      });

      await transporter.verify().catch((e: Error) => {
        throw new Error(`SMTP verify failed: ${e.message}`);
      });

      await transporter.sendMail({
        from: `"Edge Journal" <${smtpUser}>`,
        to: email,
        subject: `Edge Journal — ${statusLabel}`,
        html: htmlBody,
        text: textBody,
      });

      console.log(`[send-status-email] ✅ Gmail SMTP success: ${email}`);
      return res.status(200).json({ success: true, provider: "gmail_smtp" });
    } catch (err: unknown) {
      gmailError = err instanceof Error ? err.message : String(err);
      console.error("[send-status-email] Gmail SMTP failed:", gmailError);
    }
  }

  const errors = [];
  if (resendError) errors.push(`Resend: ${resendError}`);
  if (gmailError) errors.push(`Gmail: ${gmailError}`);
  const finalError = errors.join(" | ") || "No email provider configured";

  return res.status(500).json({ success: false, error: finalError });
}
