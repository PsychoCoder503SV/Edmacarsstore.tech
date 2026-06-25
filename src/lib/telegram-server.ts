/**
 * Envío interno a Telegram — invisible para el cliente.
 * Usa Bot API directo desde el servidor (Vercel).
 */

function telegramConfig(): { token: string; chatId: string } | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return null;
  return { token, chatId };
}

export async function notifyStoreTelegram(message: string): Promise<void> {
  const config = telegramConfig();
  if (!config) return;

  const url = `https://api.telegram.org/bot${config.token}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: message,
        parse_mode: "Markdown",
        disable_notification: true,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const fallback = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: config.chatId,
          text: message,
          disable_notification: true,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!fallback.ok) {
        console.error("[telegram] sendMessage failed", await fallback.text());
      }
    }
  } catch (err) {
    console.error("[telegram] notify failed", err);
    // Pedido ya guardado en Supabase.
  }
}