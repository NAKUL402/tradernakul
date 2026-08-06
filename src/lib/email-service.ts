import { createServerFn } from "@tanstack/react-start";

export const sendOTPEmail = createServerFn("POST", async ({ email, otp }: { email: string; otp: string }) => {
  const user = process.env.EMAIL_USER || "";
  const pass = process.env.EMAIL_PASS || "";

  if (!user || !pass) {
    console.warn("[SMTP Config Missing] EMAIL_USER and EMAIL_PASS environment variables are not set in Vercel.");
    return { 
      success: false, 
      mode: "missing_config", 
      message: "SMTP email credentials are not configured in Vercel. Set EMAIL_USER and EMAIL_PASS environment variables." 
    };
  }

  try {
    const nodemailer = (await import("nodemailer")).default;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: user,
        pass: pass,
      },
    });

    const mailOptions = {
      from: `"TraderNakul AI" <${user}>`,
      to: email,
      subject: "Your OTP Verification Code — TraderNakul AI",
      text: `Your OTP verification code is: ${otp}. This code is valid for 10 minutes.`,
      html: `
        <div style="font-family: sans-serif; padding: 25px; background-color: #0b0c16; color: #ffffff; border-radius: 16px; max-width: 480px; margin: auto; border: 1px solid rgba(255,255,255,0.08);">
          <h2 style="color: #6366f1; text-align: center; font-size: 24px; margin-top: 0;">TraderNakul AI</h2>
          <p style="font-size: 14px; text-align: center; color: #94a3b8; line-height: 1.5;">Log in securely using the one-time password (OTP) below:</p>
          <div style="background-color: #1e1b4b; border: 1px solid #4338ca; border-radius: 12px; padding: 18px; text-align: center; margin: 25px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #a5b4fc; font-family: monospace;">${otp}</span>
          </div>
          <p style="font-size: 11px; text-align: center; color: #64748b; margin-bottom: 0;">If you did not request this verification code, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true, mode: "smtp" };
  } catch (error) {
    console.error("[SMTP Error] Failed to send email:", error);
    return { 
      success: false, 
      mode: "error", 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
});

export const sendMassEmailBroadcaster = createServerFn("POST", async ({
  recipients,
  subject,
  bodyTitle,
  bodyText,
  occasionType,
}: {
  recipients: string[];
  subject: string;
  bodyTitle: string;
  bodyText: string;
  occasionType?: "announcement" | "festival" | "birthday" | "market_update";
}) => {
  const user = process.env.EMAIL_USER || "";
  const pass = process.env.EMAIL_PASS || "";

  if (!user || !pass) {
    console.warn("[SMTP Config Missing] EMAIL_USER and EMAIL_PASS environment variables are not set in Vercel.");
    return {
      success: false,
      mode: "missing_config",
      message: "SMTP email credentials are not configured in Vercel. Set EMAIL_USER and EMAIL_PASS environment variables.",
    };
  }

  try {
    const nodemailer = (await import("nodemailer")).default;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: user,
        pass: pass,
      },
    });

    const occasionBanner = occasionType === "festival" 
      ? "🎉 Festival & Season Special Wish" 
      : occasionType === "birthday" 
      ? "🎂 Happy Birthday Wishes from TraderNakul AI!" 
      : "📢 Member Announcement";

    const mailOptions = {
      from: `"TraderNakul AI Command Center" <${user}>`,
      to: recipients.join(", "),
      subject: subject,
      html: `
        <div style="font-family: sans-serif; padding: 30px; background-color: #0b0c16; color: #ffffff; border-radius: 16px; max-width: 550px; margin: auto; border: 1px solid rgba(255,255,255,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="background-color: #4338ca; color: #e0e7ff; font-size: 11px; padding: 4px 10px; border-radius: 20px; font-weight: bold;">${occasionBanner}</span>
            <h1 style="color: #6366f1; margin-top: 15px; font-size: 26px;">TraderNakul AI</h1>
          </div>
          <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px;">
            <h2 style="color: #a5b4fc; margin-top: 0; font-size: 18px;">${bodyTitle}</h2>
            <div style="font-size: 14px; color: #cbd5e1; line-height: 1.6; white-space: pre-wrap;">${bodyText}</div>
          </div>
          <div style="margin-top: 25px; text-align: center; font-size: 11px; color: #64748b;">
            Sent with ❤️ from TraderNakul AI Trading Command Center.
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true, mode: "smtp" };
  } catch (error) {
    console.error("[SMTP Mass Broadcaster Error]:", error);
    return {
      success: false,
      mode: "error",
      error: error instanceof Error ? error.message : String(error),
    };
  }
});
