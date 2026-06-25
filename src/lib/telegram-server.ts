/**
 * Envío interno a Telegram — invisible para el cliente.
 * Soporta varios destinatarios (TELEGRAM_CHAT_IDS=id1,id2).
 */

function telegramToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || null;
}

function telegramChatIds(): string[] {
  const multi =
    process.env.TELEGRAM_CHAT_IDS?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  const single = process.env.TELEGRAM_CHAT_ID?.trim();
  if (multi.length) return [...new Set(multi)];
  return single ? [single] : [];
}

async function sendToChat(token: string, chatId: string, message: string): Promise<void> {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
      disable_notification: true,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const fallback = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message.replace(/<[^>]+>/g, ""),
        disable_notification: true,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!fallback.ok) {
      console.error(`[telegram] chat ${chatId} failed`, await fallback.text());
    }
  }
}

export async function notifyStoreTelegram(message: string): Promise<void> {
  const token = telegramToken();
  const chatIds = telegramChatIds();
  if (!token || !chatIds.length) return;

  try {
    await Promise.allSettled(chatIds.map((chatId) => sendToChat(token, chatId, message)));
  } catch (err) {
    console.error("[telegram] notify failed", err);
  }
}