import https from "node:https";

interface SendPasswordResetOptions {
  to: string;
  name?: string | null;
  resetUrl: string;
}

function postJson(
  targetUrl: string,
  payload: unknown
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const postData = JSON.stringify(payload);

    const req = https.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: "POST",
        family: 4, // Explicitly force IPv4
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
        timeout: 15000,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          resolve({ status: res.statusCode || 200, body });
        });
      }
    );

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out connecting to email service"));
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: SendPasswordResetOptions): Promise<void> {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.log("=================================================");
    console.log(" [DEV EMAIL] Password Reset Link Generated:");
    console.log(` To: ${to}`);
    console.log(` Reset URL: ${resetUrl}`);
    console.log(
      " Note: Configure EMAILJS_* environment variables to send real emails via EmailJS."
    );
    console.log("=================================================");
    return;
  }

  console.log(
    `[Email] Dispatching password reset email to ${to} via EmailJS REST API...`
  );

  const payload: Record<string, unknown> = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: {
      to_email: to,
      to_name: name || "User",
      reset_url: resetUrl,
    },
  };

  if (privateKey) {
    payload.accessToken = privateKey;
  }

  const response = await postJson(
    "https://api.emailjs.com/api/v1.0/email/send",
    payload
  );

  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      `EmailJS API failed (${response.status}): ${response.body}`
    );
  }

  console.log(
    `[Email] Password reset email sent successfully via EmailJS! Response: ${response.body}`
  );
}
