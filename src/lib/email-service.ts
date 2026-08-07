/**
 * Email Service — Client-side wrappers around Vercel API routes
 *
 * These functions call real Vercel serverless API routes (/api/send-otp,
 * /api/send-approval) which run Node.js and nodemailer on the server.
 *
 * NO OTP or sensitive data is ever returned to the browser.
 */

export async function sendOTPEmail({
  email,
  otp,
}: {
  email: string;
  otp: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: data.error || `Server error: ${res.status}`,
      };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Network error: ${message}` };
  }
}

export async function sendOwnerApprovalEmail({
  userEmail,
  userName,
}: {
  userEmail: string;
  userName: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("/api/send-approval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userEmail, userName }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: data.error || `Server error: ${res.status}`,
      };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Network error: ${message}` };
  }
}

export async function sendStatusNotificationEmail({
  email,
  name,
  status,
}: {
  email: string;
  name: string;
  status: "approved" | "rejected";
}): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("/api/send-status-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, status }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: data.error || `Server error: ${res.status}`,
      };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Network error: ${message}` };
  }
}

