import {
  buildSystemPrompt,
  buildWhatsAppSolicitudUrl,
  callNvidiaChat,
  loadSupportContext,
  parseAssistantReply,
} from "@/lib/support-agent";
import { NextResponse } from "next/server";

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { messages?: ChatMessage[] };
    const history = body.messages ?? [];

    if (!history.length || history[history.length - 1]?.role !== "user") {
      return NextResponse.json({ error: "Mensaje inválido" }, { status: 400 });
    }

    const catalogContext = await loadSupportContext();
    const systemPrompt = buildSystemPrompt(catalogContext);

    const raw = await callNvidiaChat([
      { role: "system", content: systemPrompt },
      ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    ]);

    const parsed = parseAssistantReply(raw);
    const whatsappUrl = parsed.whatsappMessage
      ? buildWhatsAppSolicitudUrl(parsed.whatsappMessage)
      : null;

    return NextResponse.json({
      reply: parsed.text,
      whatsappSolicitud: whatsappUrl
        ? { url: whatsappUrl, preview: parsed.whatsappMessage }
        : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error del asistente";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}