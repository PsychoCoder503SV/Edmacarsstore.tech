"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  whatsappUrl?: string | null;
};

const WELCOME =
  "Hola, soy el asistente de Edmacars. Pregúntame por productos, precios, stock o recomendaciones según nuestro catálogo. Atención 24/7.";

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: WELCOME },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const nextHistory: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextHistory
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al consultar");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          whatsappUrl: data.whatsappSolicitud?.url ?? null,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            err instanceof Error
              ? err.message
              : "No pude responder ahora. Intenta de nuevo en un momento.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="support-car-fab shadow-neon-cyan-strong fixed bottom-6 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-full border border-neon-cyan/30 bg-surface-elevated/95 backdrop-blur transition hover:scale-105"
          aria-label="Abrir asistente Edmacars"
          title="Asistente Edmacars"
        >
          <span className="support-car-smoke support-car-smoke-1" />
          <span className="support-car-smoke support-car-smoke-2" />
          <Image
            src="/icon.png"
            alt=""
            width={40}
            height={40}
            className="support-car-walk relative z-10 h-10 w-10 object-contain"
          />
        </button>
      )}

      {open && (
        <div className="fixed bottom-4 right-4 z-50 flex w-[min(100vw-2rem,380px)] flex-col overflow-hidden rounded-2xl border border-neon-cyan/25 bg-surface-elevated/95 shadow-neon-cyan-strong backdrop-blur-xl">
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <Image src="/icon.png" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
              <div>
                <p className="text-sm font-semibold text-white">Asistente Edmacars</p>
                <p className="text-[10px] text-neon-cyan">24/7 · IA + catálogo real</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-1 text-xs text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              Cerrar
            </button>
          </header>

          <div ref={scrollRef} className="flex max-h-[min(60vh,420px)] flex-col gap-3 overflow-y-auto px-4 py-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[92%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "ml-auto bg-neon-cyan/15 text-white"
                    : "mr-auto border border-white/10 bg-white/5 text-zinc-200"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.whatsappUrl && (
                  <a
                    href={msg.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#25D366]/15 px-2.5 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-[#25D366]/25"
                  >
                    Solicitar producto por WhatsApp →
                  </a>
                )}
              </div>
            ))}
            {loading && (
              <p className="mr-auto text-xs text-zinc-500">El asistente está pensando…</p>
            )}
          </div>

          <form
            className="flex gap-2 border-t border-white/10 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
          >
            <input
              className="checkout-input flex-1 py-2 text-sm"
              placeholder="Ej: audífonos con cancelación de ruido"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="btn-neon px-4 py-2 text-sm" disabled={loading}>
              →
            </button>
          </form>
        </div>
      )}
    </>
  );
}