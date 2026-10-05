import nodemailer from "nodemailer";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as {
      to?: string;
      name?: string;
      resetUrl?: string;
      secret?: string;
    };
    const { to, name, resetUrl, secret } = body;

    const expectedSecret = process.env.EMAIL_PROXY_SECRET;
    if (expectedSecret && secret !== expectedSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!to || !resetUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const user = process.env.SMTP_USER;
    const rawPass = process.env.SMTP_PASS;

    if (!user || !rawPass) {
      console.error(
        "[Netlify Email Proxy] SMTP_USER or SMTP_PASS missing in Netlify environment variables",
      );
      return new Response(
        JSON.stringify({ error: "SMTP credentials not configured on Netlify" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const pass = rawPass.replace(/\s+/g, "");

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user,
        pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

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

    const from = process.env.EMAIL_FROM || `DTR Support <${user}>`;

    console.log(`[Netlify Function] Sending email to ${to} via Gmail SMTP...`);

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.log(
      `[Netlify Function] Sent successfully! MessageId: ${info.messageId}`,
    );

    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("[Netlify Function] Error sending email:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Failed to send email" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
