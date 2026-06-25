/**
 * Envío interno a WhatsApp — invisible para el cliente.
 * Usa el puente propio (whatsapp-bridge) con tu sesión de WhatsApp, sin API de Meta.
 */

function notifyNumber(): string | null {
  const raw = process.env.WHATSAPP_NOTIFY_NUMBER ?? "";
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 8 ? digits : null;
}

async function sendViaInternalBridge(message: string): Promise<boolean> {
  const base = process.env.WHATSAPP_BRIDGE_URL?.replace(/\/$/, "");
  const secret = process.env.WHATSAPP_BRIDGE_SECRET;
  if (!base || !secret) return false;

  const res = await fetch(`${base}/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-bridge-secret": secret,
    },
    body: JSON.stringify({ message }),
    signal: AbortSignal.timeout(15000),
  });

  return res.ok;
}

export async function notifyStoreOrder(message: string): Promise<void> {
  if (!notifyNumber()) return;

  try {
    await sendViaInternalBridge(message);
  } catch {
    // Pedido ya guardado en Supabase.
  }
}