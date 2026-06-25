/** Notificación interna a la tienda — solo servidor, nunca expuesto al cliente. */

function notifyNumber(): string | null {
  const raw =
    process.env.WHATSAPP_NOTIFY_NUMBER ??
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ??
    "";
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 8 ? digits : null;
}

async function sendViaCloudApi(message: string, to: string): Promise<boolean> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return false;

  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    }),
  });

  return res.ok;
}

async function sendViaCallMeBot(message: string, to: string): Promise<boolean> {
  const apiKey = process.env.WHATSAPP_CALLMEBOT_APIKEY;
  if (!apiKey) return false;

  const url = new URL("https://api.callmebot.com/whatsapp.php");
  url.searchParams.set("phone", `+${to}`);
  url.searchParams.set("text", message);
  url.searchParams.set("apikey", apiKey);

  const res = await fetch(url.toString(), { method: "GET" });
  return res.ok;
}

/** Envía el pedido a la tienda en segundo plano. No lanza error al cliente si falla el canal. */
export async function notifyStoreOrder(message: string): Promise<void> {
  const to = notifyNumber();
  if (!to) return;

  try {
    if (await sendViaCloudApi(message, to)) return;
    await sendViaCallMeBot(message, to);
  } catch {
    // Canal interno: el pedido ya quedó en Supabase.
  }
}