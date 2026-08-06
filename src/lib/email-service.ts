import { createServerFn } from "@tanstack/react-start";
import nodemailer from "nodemailer";

export const sendOTPEmail = createServerFn("POST", async ({ email, otp }: { email: string; otp: string }) => {
  const user = process.env.EMAIL_USER || "";
  const pass = process.env.EMAIL_PASS || "";

  if (!user || !pass) {
    console.warn("[SMTP Warn] SMTP credentials are not configured. Using fallback console/UI display mode.");
    console.log(`[SMTP Debug] OTP code for ${email} is ${otp}`);
    return { success: false, mode: "debug", message: "SMTP credentials not configured." };
  }

  // Create transporter using SMTP credentials
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

  try {
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
