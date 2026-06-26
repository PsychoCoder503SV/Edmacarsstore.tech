import { createHash, randomInt } from "crypto";
import { dispatchTransactionalEmail } from "@/lib/order-email";

const OTP_TTL_MS = 15 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RATE_WINDOW_MS = 15 * 60 * 1000;
const OTP_RATE_MAX = 3;

export function normalizeResetEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function generateOtpCode(): string {
  return String(randomInt(100000, 1000000));
}

export function hashOtpCode(email: string, otp: string): string {
  const secret =
    process.env.PASSWORD_RESET_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "edmacars-dev-reset";
  return createHash("sha256").update(`${normalizeResetEmail(email)}:${otp}:${secret}`).digest("hex");
}

export function otpExpiresAt(): string {
  return new Date(Date.now() + OTP_TTL_MS).toISOString();
}

export { OTP_MAX_ATTEMPTS, OTP_RATE_MAX, OTP_RATE_WINDOW_MS, OTP_TTL_MS };

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildPasswordResetOtpHtml(fullName: string, otp: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#07070f;font-family:Segoe UI,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07070f;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#12121f;border:1px solid #1e1e2e;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:28px 28px 8px;text-align:center;">
            <p style="margin:0;font-size:24px;font-weight:700;color:#fff;">
              EDMA<span style="color:#00f5ff;">CARS</span>
            </p>
            <p style="margin:8px 0 0;font-size:13px;color:#71717a;">Recuperación de contraseña</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px 8px;">
            <p style="margin:0;font-size:14px;color:#d4d4d8;">Hola <strong style="color:#fff;">${escapeHtml(fullName || "cliente")}</strong>,</p>
            <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#a1a1aa;">
              Usa este código único para restablecer tu contraseña. Expira en 15 minutos.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 28px 24px;text-align:center;">
            <p style="margin:0;font-size:36px;font-weight:700;letter-spacing:8px;color:#00f5ff;font-family:monospace;">${escapeHtml(otp)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 24px;">
            <p style="margin:0;font-size:12px;line-height:1.5;color:#71717a;">
              Si no solicitaste este código, ignora este correo. Nadie de Edmacars te pedirá este número por teléfono o mensaje.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendPasswordResetOtpEmail(
  email: string,
  fullName: string,
  otp: string
): Promise<boolean> {
  return dispatchTransactionalEmail({
    to: email.trim(),
    toName: fullName || "Cliente Edmacars",
    subject: "Código de recuperación — Edmacars Store",
    html: buildPasswordResetOtpHtml(fullName, otp),
  });
}