import type { CheckoutCustomer, PaymentMethod } from "@/lib/checkout";
import { PAYMENT_LABELS } from "@/lib/checkout";

type OrderEmailItem = {
  name: string;
  quantity: number;
  unitPrice: number;
};

function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "https://edmacarsstore-tech.vercel.app";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildOrderConfirmationHtml(
  orderNumber: string,
  payment: PaymentMethod,
  customer: CheckoutCustomer,
  items: OrderEmailItem[],
  total: number
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

  const trackUrl = `${siteUrl()}/pedido/seguimiento?orden=${encodeURIComponent(orderNumber)}`;

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

export async function sendOrderConfirmationEmail(
  orderNumber: string,
  payment: PaymentMethod,
  customer: CheckoutCustomer,
  items: OrderEmailItem[],
  total: number
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return false;

  const from =
    process.env.RESEND_FROM_EMAIL?.trim() || "Edmacars Store <onboarding@resend.dev>";

  const html = buildOrderConfirmationHtml(orderNumber, payment, customer, items, total);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [customer.email.trim()],
        subject: `Pedido confirmado ${orderNumber} — Edmacars Store`,
        html,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.error("[order-email] resend failed", await res.text());
      return false;
    }

    return true;
  } catch (err) {
    console.error("[order-email] send failed", err);
    return false;
  }
}