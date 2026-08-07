import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * POST /api/send-approval
 * Body: { userEmail: string; userName: string }
 *
 * Sends approval request email to the owner.
 * Uses Resend (with configurable from address) or Gmail SMTP fallback.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { userEmail, userName } = req.body || {};
  if (!userEmail || !userName) {
    return res.status(400).json({ success: false, error: "Missing userEmail or userName" });
  }

  const resendApiKey = process.env['RESEND_API_KEY'];
  const smtpUser = process.env['EMAIL_USER'];
  const smtpPass = process.env['EMAIL_PASS'];
  const ownerEmail = process.env['OWNER_EMAIL'] || "nakultrader007@gmail.com";
  const baseUrl = process.env['VITE_SITE_URL'] || "https://tradernakul.vercel.app";
  const secret = process.env['APPROVAL_SECRET'] || "tn-approve-2026";
  const resendFrom = process.env['RESEND_FROM_EMAIL'] || "TraderNakul AI <onboarding@resend.dev>";

  const approveLink = `${baseUrl}/api/approve-user?action=approve&email=${encodeURIComponent(userEmail)}&secret=${encodeURIComponent(secret)}`;
  const rejectLink = `${baseUrl}/api/approve-user?action=reject&email=${encodeURIComponent(userEmail)}&secret=${encodeURIComponent(secret)}`;
  const requestTime = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  console.log(`[send-approval] Notifying owner: ${ownerEmail} about new user: ${userEmail}`);
  console.log(`[send-approval] From address: ${resendFrom}`);

  const htmlBody = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#0b0c16;color:#fff;border-radius:16px;overflow:hidden;border:1px solid rgba(99,102,241,0.2);">
      <div style="background:linear-gradient(135deg,#4338ca 0%,#6366f1 100%);padding:28px 40px;text-align:center;">
        <h1 style="margin:0;font-size:20px;font-weight:700;">🔔 New Access Request</h1>
        <p style="margin:6px 0 0;font-size:13px;opacity:0.85;">TraderNakul AI — Admin Notification</p>
      </div>
      <div style="padding:32px 40px;">
        <p style="font-size:15px;color:#cbd5e1;line-height:1.6;margin:0 0 20px;">
          A new user has requested access to <strong style="color:#a5b4fc;">TraderNakul AI</strong>.
        </p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:28px;background:#1e1b4b;border-radius:10px;overflow:hidden;">
          <tr><td style="padding:14px 18px;border-bottom:1px solid rgba(99,102,241,0.2);color:#94a3b8;font-size:13px;width:80px;">Name</td><td style="padding:14px 18px;border-bottom:1px solid rgba(99,102,241,0.2);font-weight:600;">${userName}</td></tr>
          <tr><td style="padding:14px 18px;border-bottom:1px solid rgba(99,102,241,0.2);color:#94a3b8;font-size:13px;">Email</td><td style="padding:14px 18px;border-bottom:1px solid rgba(99,102,241,0.2);">${userEmail}</td></tr>
          <tr><td style="padding:14px 18px;color:#94a3b8;font-size:13px;">Time</td><td style="padding:14px 18px;">${requestTime} IST</td></tr>
        </table>
        <div style="text-align:center;">
          <a href="${approveLink}" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;margin-right:12px;">✅ Approve</a>
          <a href="${rejectLink}" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;">❌ Reject</a>
        </div>
        <p style="font-size:11px;color:#475569;text-align:center;margin:20px 0 0;">
          You can also manage users from the <a href="${baseUrl}/admin" style="color:#6366f1;">Admin Panel</a>.
        </p>
      </div>
    </div>
  `;

  const textBody = `New access request:\nName: ${userName}\nEmail: ${userEmail}\nTime: ${requestTime}\n\nApprove: ${approveLink}\nReject: ${rejectLink}`;

  // ── Option 1: Resend API ──────────────────────────────────────────────────
  if (resendApiKey) {
    console.log("[send-approval] Attempting Resend API...");
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [ownerEmail],
          subject: `🔔 Access Request — ${userName} (${userEmail})`,
          html: htmlBody,
          text: textBody,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as any;
      console.log(`[send-approval] Resend status: ${response.status}`, JSON.stringify(data));

      if (response.ok) {
        console.log(`[send-approval] ✅ Sent via Resend to owner: ${ownerEmail}`);
        return res.status(200).json({ success: true, provider: "resend" });
      }

      const errMsg: string = data?.message || data?.error || `Resend error ${response.status}`;
      const isDomainError =
        errMsg.toLowerCase().includes("domain") ||
        errMsg.toLowerCase().includes("verify") ||
        errMsg.toLowerCase().includes("own email");

      if (isDomainError && smtpUser && smtpPass) {
        console.warn("[send-approval] Resend domain not verified — falling back to Gmail SMTP");
        // fall through
      } else {
        console.error("[send-approval] Resend failed:", errMsg);
        return res.status(500).json({ success: false, error: `Resend: ${errMsg}` });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[send-approval] Resend exception:", msg);
      if (!(smtpUser && smtpPass)) {
        return res.status(500).json({ success: false, error: `Resend error: ${msg}` });
      }
    }
  }

  // ── Option 2: Gmail SMTP ──────────────────────────────────────────────────
  if (smtpUser && smtpPass) {
    console.log("[send-approval] Attempting Gmail SMTP...");
    try {
      const nodemailer = (await import("nodemailer")).default;
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: smtpUser, pass: smtpPass },
      });
      await transporter.verify().catch((e: Error) => {
        throw new Error(`Gmail SMTP auth failed: ${e.message}`);
      });
      await transporter.sendMail({
        from: `"TraderNakul AI" <${smtpUser}>`,
        to: ownerEmail,
        subject: `🔔 Access Request — ${userName}`,
        html: htmlBody,
        text: textBody,
      });
      console.log(`[send-approval] ✅ Sent via Gmail SMTP to owner: ${ownerEmail}`);
      return res.status(200).json({ success: true, provider: "gmail_smtp" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[send-approval] Gmail SMTP failed:", msg);
      return res.status(500).json({ success: false, error: `SMTP error: ${msg}` });
    }
  }

  const noProviderMsg =
    "No email provider configured. Add RESEND_API_KEY + verify domain, or add EMAIL_USER + EMAIL_PASS.";
  console.error("[send-approval] FATAL:", noProviderMsg);
  return res.status(500).json({ success: false, error: noProviderMsg });
}
