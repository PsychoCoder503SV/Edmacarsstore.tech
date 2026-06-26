import type { CheckoutCustomer, PaymentMethod } from "@/lib/checkout";
import { PAYMENT_LABELS } from "@/lib/checkout";
import { buildOrderTrackUrl } from "@/lib/site-url";
import nodemailer from "nodemailer";

type OrderEmailItem = {
  name: string;
  quantity: number;
  unitPrice: number;
};

type Sender = { name: string; email: string };

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseSenderFromString(raw: string): Sender | null {
  const match = raw.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  if (raw.includes("@")) return { name: "Edmacars Store", email: raw.trim() };
  return null;
}

function resolveSender(): Sender | null {
  const smtpUser = process.env.SMTP_USER?.trim();
  if (smtpUser) {
    return {
      name: process.env.EMAIL_FROM_NAME?.trim() || "Edmacars Store",
      email: smtpUser,
    };
  }

  const fromEnv =
    process.env.EMAIL_FROM_ADDRESS?.trim() ||
    process.env.BREVO_FROM_EMAIL?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim();

  if (!fromEnv) return null;

  const parsed = parseSenderFromString(fromEnv);
  if (parsed) return parsed;

  return {
    name: process.env.EMAIL_FROM_NAME?.trim() || "Edmacars Store",
    email: fromEnv,
  };
}

export function buildOrderConfirmationHtml(
  orderNumber: string,
  payment: PaymentMethod,
  customer: CheckoutCustomer,
  items: OrderEmailItem[],
  total: number,
  trackToken?: string
): string {
  const rows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #1e1e2e;color:#e4e4e7;font-size:14px;">
          ${escapeHtml(i.name)} × ${i.quantity}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #1e1e2e;color:#00f5ff;font-size:14px;text-align:right;">
          $${(i.unitPrice * i.quantity).toFixed(2)}
        </td>
      </tr>`
    )
    .join("");

  const trackUrl = buildOrderTrackUrl(orderNumber, trackToken);

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#07070f;font-family:Segoe UI,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07070f;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#12121f;border:1px solid #1e1e2e;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:28px 28px 12px;text-align:center;">
            <p style="margin:0;font-size:28px;font-weight:700;letter-spacing:2px;color:#fff;">
              EDMA<span style="color:#00f5ff;">CARS</span>
            </p>
            <p style="margin:8px 0 0;font-size:13px;color:#71717a;">Tu pedido fue recibido correctamente</p>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 28px 24px;">
            <p style="margin:0 0 6px;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:1px;">Número de orden</p>
            <p style="margin:0;font-size:22px;font-weight:700;color:#00f5ff;font-family:monospace;">${escapeHtml(orderNumber)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 20px;">
            <p style="margin:0 0 12px;font-size:14px;color:#d4d4d8;">Hola <strong style="color:#fff;">${escapeHtml(customer.fullName)}</strong>,</p>
            <p style="margin:0;font-size:14px;line-height:1.6;color:#a1a1aa;">
              Gracias por comprar en Edmacars Store. Registramos tu pedido y nuestro equipo lo revisará pronto.
              Atención <strong style="color:#00f5ff;">24/7</strong>.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:12px 16px;background:#0d0d18;border-radius:10px;width:50%;">
                  <p style="margin:0;font-size:11px;color:#71717a;">Pago</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#fff;">${escapeHtml(PAYMENT_LABELS[payment])}</p>
                </td>
                <td width="12"></td>
                <td style="padding:12px 16px;background:#0d0d18;border-radius:10px;width:50%;">
                  <p style="margin:0;font-size:11px;color:#71717a;">Total</p>
                  <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#00f5ff;">$${total.toFixed(2)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 28px 8px;">
            <p style="margin:0 0 8px;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:1px;">Productos</p>
            <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 28px 20px;">
            <p style="margin:0 0 6px;font-size:12px;color:#71717a;">Entrega</p>
            <p style="margin:0;font-size:13px;line-height:1.5;color:#d4d4d8;">${escapeHtml(customer.address)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 28px;text-align:center;">
            <a href="${trackUrl}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,rgba(0,245,255,0.2),rgba(255,0,128,0.15));border:1px solid rgba(0,245,255,0.4);border-radius:10px;color:#fff;font-size:14px;font-weight:600;text-decoration:none;">
              Rastrear mi pedido
            </a>
            <p style="margin:14px 0 0;font-size:11px;color:#52525b;">
              Usa tu número de orden y este email en la página de seguimiento.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px;background:#0a0a12;text-align:center;border-top:1px solid #1e1e2e;">
            <p style="margin:0;font-size:11px;color:#52525b;">
              Edmacars Import · El Salvador · © ${new Date().getFullYear()}
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendViaSmtp(
  sender: Sender,
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!user || !pass) return false;

  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: `"${sender.name}" <${user}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error("[order-email] smtp failed", err);
    return false;
  }
}

async function sendViaBrevo(
  sender: Sender,
  to: string,
  toName: string,
  subject: string,
  html: string
): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) return false;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to, name: toName }],
      subject,
      htmlContent: html,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    console.error("[order-email] brevo failed", await res.text());
    return false;
  }

  return true;
}

async function sendViaSendGrid(
  sender: Sender,
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY?.trim();
  if (!apiKey) return false;

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: sender.email, name: sender.name },
      subject,
      content: [{ type: "text/html", value: html }],
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    console.error("[order-email] sendgrid failed", await res.text());
    return false;
  }

  return true;
}

async function sendViaResend(
  sender: Sender,
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return false;

  const from = `${sender.name} <${sender.email}>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    console.error("[order-email] resend failed", await res.text());
    return false;
  }

  return true;
}

type StatusEmailParams = {
  orderNumber: string;
  status: string;
  customer: CheckoutCustomer;
  total: number;
  payment?: PaymentMethod;
  trackUrl: string;
  headline: string;
  body: string;
  subjectSuffix: string;
};

export function buildOrderStatusHtml(params: StatusEmailParams): string {
  const paymentLabel = params.payment ? PAYMENT_LABELS[params.payment] : "—";

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#07070f;font-family:Segoe UI,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07070f;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#12121f;border:1px solid #1e1e2e;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:28px 28px 12px;text-align:center;">
            <p style="margin:0;font-size:28px;font-weight:700;letter-spacing:2px;color:#fff;">
              EDMA<span style="color:#00f5ff;">CARS</span>
            </p>
            <p style="margin:8px 0 0;font-size:13px;color:#71717a;">${escapeHtml(params.headline)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 28px 24px;">
            <p style="margin:0 0 6px;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:1px;">Número de orden</p>
            <p style="margin:0;font-size:22px;font-weight:700;color:#00f5ff;font-family:monospace;">${escapeHtml(params.orderNumber)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 20px;">
            <p style="margin:0 0 12px;font-size:14px;color:#d4d4d8;">Hola <strong style="color:#fff;">${escapeHtml(params.customer.fullName)}</strong>,</p>
            <p style="margin:0;font-size:14px;line-height:1.6;color:#a1a1aa;">${escapeHtml(params.body)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:12px 16px;background:#0d0d18;border-radius:10px;width:50%;">
                  <p style="margin:0;font-size:11px;color:#71717a;">Pago</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#fff;">${escapeHtml(paymentLabel)}</p>
                </td>
                <td width="12"></td>
                <td style="padding:12px 16px;background:#0d0d18;border-radius:10px;width:50%;">
                  <p style="margin:0;font-size:11px;color:#71717a;">Total</p>
                  <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#00f5ff;">$${params.total.toFixed(2)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 28px 8px;">
            <p style="margin:0 0 6px;font-size:12px;color:#71717a;">Entrega</p>
            <p style="margin:0;font-size:13px;line-height:1.5;color:#d4d4d8;">${escapeHtml(params.customer.address)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 28px;text-align:center;">
            <a href="${params.trackUrl}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,rgba(0,245,255,0.2),rgba(255,0,128,0.15));border:1px solid rgba(0,245,255,0.4);border-radius:10px;color:#fff;font-size:14px;font-weight:600;text-decoration:none;">
              Rastrear mi pedido
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px;background:#0a0a12;text-align:center;border-top:1px solid #1e1e2e;">
            <p style="margin:0;font-size:11px;color:#52525b;">
              Edmacars Import · El Salvador · © ${new Date().getFullYear()}
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function dispatchEmail(
  sender: Sender,
  to: string,
  toName: string,
  subject: string,
  html: string
): Promise<boolean> {
  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase() || "auto";
  const hasSmtp = Boolean(process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim());

  if (provider === "sendgrid" || (provider === "auto" && process.env.SENDGRID_API_KEY)) {
    const ok = await sendViaSendGrid(sender, to, subject, html);
    if (ok) return true;
    if (provider === "sendgrid") return false;
  }

  if (provider === "smtp" || (provider === "auto" && hasSmtp)) {
    const ok = await sendViaSmtp(sender, to, subject, html);
    if (ok) return true;
    if (provider === "smtp") return false;
  }

  if (provider === "brevo" || (provider === "auto" && process.env.BREVO_API_KEY)) {
    const ok = await sendViaBrevo(sender, to, toName, subject, html);
    if (ok) return true;
    if (provider === "brevo") return false;
  }

  if (provider === "resend" || provider === "auto") {
    return sendViaResend(sender, to, subject, html);
  }

  return false;
}

export async function dispatchTransactionalEmail(params: {
  to: string;
  toName: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const sender = resolveSender();
  if (!sender) {
    console.error("[order-email] falta EMAIL_FROM_ADDRESS o SMTP_USER");
    return false;
  }

  try {
    return dispatchEmail(sender, params.to.trim(), params.toName, params.subject, params.html);
  } catch (err) {
    console.error("[order-email] transactional send failed", err);
    return false;
  }
}

export async function sendOrderStatusEmail(params: StatusEmailParams): Promise<boolean> {
  const sender = resolveSender();
  if (!sender) {
    console.error("[order-email] falta EMAIL_FROM_ADDRESS o SMTP_USER");
    return false;
  }

  const subject = `Pedido ${params.orderNumber} ${params.subjectSuffix} — Edmacars Store`;
  const html = buildOrderStatusHtml(params);
  const to = params.customer.email.trim();

  try {
    return dispatchEmail(sender, to, params.customer.fullName, subject, html);
  } catch (err) {
    console.error("[order-email] status send failed", err);
    return false;
  }
}

export async function sendOrderConfirmationEmail(
  orderNumber: string,
  payment: PaymentMethod,
  customer: CheckoutCustomer,
  items: OrderEmailItem[],
  total: number,
  trackToken?: string
): Promise<boolean> {
  const sender = resolveSender();
  if (!sender) {
    console.error("[order-email] falta EMAIL_FROM_ADDRESS o SMTP_USER");
    return false;
  }

  const subject = `Pedido confirmado ${orderNumber} — Edmacars Store`;
  const html = buildOrderConfirmationHtml(orderNumber, payment, customer, items, total, trackToken);
  const to = customer.email.trim();

  try {
    return dispatchEmail(sender, to, customer.fullName, subject, html);
  } catch (err) {
    console.error("[order-email] send failed", err);
    return false;
  }
}