import { Resend } from "resend";

interface SendPasswordResetOptions {
  to: string;
  name?: string | null;
  resetUrl: string;
}

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (resendClient) return resendClient;

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    resendClient = new Resend(apiKey);
    return resendClient;
  }

  return null;
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: SendPasswordResetOptions): Promise<void> {
  const resend = getResendClient();
  const recipientName = name ? ` ${name}` : "";

  const subject = "Reset your DTR password";
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; }
    .title { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; }
    .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .button { display: inline-block; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 12px 24px; font-weight: 600; font-size: 14px; border-radius: 8px; text-align: center; }
    .footer { margin-top: 32px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="title">Reset Your Password</h1>
    <p class="text">Hi${recipientName},</p>
    <p class="text">We received a request to reset your password for your Daily Time Record (DTR) account. Click the button below to set a new password:</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}" class="button" target="_blank">Reset Password</a>
    </div>
    <p class="text" style="font-size: 13px;">This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
    <div class="footer">
      <p style="margin: 0;">Daily Time Record (DTR) &bull; OJT Attendance Tracker</p>
      <p style="margin: 4px 0 0 0; word-break: break-all; color: #94a3b8;">${resetUrl}</p>
    </div>
  </div>
</body>
</html>
`;

  const textContent = `Hi${recipientName},\n\nWe received a request to reset your password for your DTR account.\n\nClick the link below to set a new password (valid for 1 hour):\n${resetUrl}\n\nIf you did not make this request, you can safely ignore this email.`;

  if (!resend) {
    console.log("=================================================");
    console.log(" [DEV EMAIL] Password Reset Link Generated:");
    console.log(` To: ${to}`);
    console.log(` Reset URL: ${resetUrl}`);
    console.log("=================================================");
    return;
  }

  const from = process.env.EMAIL_FROM || "DTR Support <onboarding@resend.dev>";

  console.log(`[Email] Dispatching password reset email to ${to} via Resend HTTPS API...`);

  const response = await resend.emails.send({
    from,
    to: [to],
    subject,
    text: textContent,
    html: htmlContent,
  });

  if (response.error) {
    console.error(`[Email] Resend API Error:`, response.error);
    throw new Error(response.error.message || "Failed to send reset email");
  }

  console.log(`[Email] Email sent successfully via Resend! ID: ${response.data?.id}`);
}
