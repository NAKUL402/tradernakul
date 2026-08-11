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
  const ownerEmail = process.env['OWNER_EMAIL'];
  if (!ownerEmail) {
    console.error("[send-approval] FATAL: OWNER_EMAIL environment variable is missing.");
    return res.status(500).json({ success: false, error: "OWNER_EMAIL environment variable not set." });
  }
  const baseUrl = process.env['VITE_SITE_URL'] || "https://Edge Journal.vercel.app";
  const resendFrom = process.env['RESEND_FROM_EMAIL'] || "Edge Journal <onboarding@resend.dev>";

  const adminLink = `${baseUrl}/admin`;
  const requestTime = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  console.log(`[send-approval] Notifying owner: ${ownerEmail} about new user: ${userEmail}`);
  console.log(`[send-approval] From address: ${resendFrom}`);

  const htmlBody = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#0b0c16;color:#fff;border-radius:16px;overflow:hidden;border:1px solid rgba(99,102,241,0.2);">
      <div style="background:linear-gradient(135deg,#4338ca 0%,#6366f1 100%);padding:28px 40px;text-align:center;">
        <h1 style="margin:0;font-size:20px;font-weight:700;">🔔 New Access Request</h1>
        <p style="margin:6px 0 0;font-size:13px;opacity:0.85;">Edge Journal — Admin Notification</p>
      </div>
      <div style="padding:32px 40px;">
        <p style="font-size:15px;color:#cbd5e1;line-height:1.6;margin:0 0 20px;">
          A new user has requested access to <strong style="color:#a5b4fc;">Edge Journal</strong>.
        </p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:28px;background:#1e1b4b;border-radius:10px;overflow:hidden;">
          <tr><td style="padding:14px 18px;border-bottom:1px solid rgba(99,102,241,0.2);color:#94a3b8;font-size:13px;width:80px;">Name</td><td style="padding:14px 18px;border-bottom:1px solid rgba(99,102,241,0.2);font-weight:600;">${userName}</td></tr>
          <tr><td style="padding:14px 18px;border-bottom:1px solid rgba(99,102,241,0.2);color:#94a3b8;font-size:13px;">Email</td><td style="padding:14px 18px;border-bottom:1px solid rgba(99,102,241,0.2);">${userEmail}</td></tr>
          <tr><td style="padding:14px 18px;color:#94a3b8;font-size:13px;">Time</td><td style="padding:14px 18px;">${requestTime} IST</td></tr>
        </table>
        <div style="text-align:center;">
          <a href="${adminLink}" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;margin-right:12px;">Go to Admin Panel</a>
        </div>
        <p style="font-size:11px;color:#475569;text-align:center;margin:20px 0 0;">
          Log in with your Owner email to securely review and approve this request.
          You can also manage users from the <a href="${baseUrl}/admin" style="color:#6366f1;">Admin Panel</a>.
        </p>
      </div>
    </div>
  `;

  const textBody = `New access request:\nName: ${userName}\nEmail: ${userEmail}\nTime: ${requestTime}\n\nReview this request securely in the Admin Panel:\n${adminLink}`;

  if (!resendApiKey) {
    console.error("[send-approval] FATAL: RESEND_API_KEY missing.");
    return res.status(500).json({ success: false, error: "RESEND_API_KEY environment variable not set." });
  }

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

    const data = (await response.json().catch(() => ({}))) as Record<string, any>;
    console.log(`[send-approval] Resend status: ${response.status}`, JSON.stringify(data));

    if (response.ok) {
      console.log(`[send-approval] ✅ Sent via Resend to owner: ${ownerEmail}`);
      return res.status(200).json({ success: true, provider: "resend" });
    }

    const errMsg: string = data['message'] || data['error'] || `Resend error ${response.status}`;
    console.error("[send-approval] Resend failed:", errMsg);
    return res.status(500).json({ success: false, error: `Resend: ${errMsg}` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[send-approval] Resend exception:", msg);
    return res.status(500).json({ success: false, error: `Resend error: ${msg}` });
  }
}
