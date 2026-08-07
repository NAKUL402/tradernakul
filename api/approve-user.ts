import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * GET /api/approve-user?action=approve|reject&email=xxx&secret=yyy
 *
 * Called when the owner clicks Approve or Reject in the email.
 * Updates the user's approval status in localStorage (via redirect to admin page).
 *
 * NOTE: Since this app uses localStorage as the database (not a real server DB),
 * this endpoint redirects the owner to the admin page where the action is applied.
 * The admin page reads the query params and applies the status change.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action, email, secret } = req.query as Record<string, string>;

  const expectedSecret = process.env.APPROVAL_SECRET || "tn-approve-2026";
  const baseUrl = process.env.VITE_SITE_URL || "https://tradernakul.vercel.app";

  if (!secret || secret !== expectedSecret) {
    return res.status(403).send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#0b0c16;color:#fff;">
        <h2 style="color:#f87171">❌ Invalid or expired link</h2>
        <p>This approval link is invalid or has expired.</p>
        <a href="${baseUrl}/admin" style="color:#6366f1">Go to Admin Panel</a>
      </body></html>
    `);
  }

  if (!email || !action || !["approve", "reject"].includes(action)) {
    return res.status(400).send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#0b0c16;color:#fff;">
        <h2 style="color:#f87171">❌ Invalid Request</h2>
        <p>Missing or invalid parameters.</p>
      </body></html>
    `);
  }

  // Redirect to admin page with the action pre-applied as query params
  // The admin page will pick these up and update localStorage
  const redirectUrl = `${baseUrl}/admin?${action}=${encodeURIComponent(email)}&fromEmail=1`;
  
  // Show an immediate confirmation page, then redirect
  const actionLabel = action === "approve" ? "✅ Approved" : "❌ Rejected";
  const actionColor = action === "approve" ? "#059669" : "#dc2626";

  return res.status(200).send(`
    <html>
      <head>
        <title>${actionLabel} — TraderNakul AI</title>
        <meta http-equiv="refresh" content="3;url=${redirectUrl}">
        <style>
          body { font-family: 'Segoe UI', sans-serif; text-align: center; padding: 80px 20px; background: #0b0c16; color: #fff; }
          .card { max-width: 400px; margin: 0 auto; background: #1e1b4b; border-radius: 16px; padding: 40px; border: 1px solid rgba(99,102,241,0.3); }
          h2 { color: ${actionColor}; font-size: 28px; margin: 0 0 16px; }
          p { color: #94a3b8; line-height: 1.6; }
          a { color: #6366f1; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>${actionLabel}</h2>
          <p>User <strong style="color:#e2e8f0">${email}</strong> has been <strong>${action}d</strong>.</p>
          <p>Redirecting to Admin Panel in 3 seconds…<br>
          <a href="${redirectUrl}">Click here if not redirected</a></p>
        </div>
      </body>
    </html>
  `);
}
