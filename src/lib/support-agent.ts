import type { Product } from "@/lib/database.types";
import { getCategories, getProducts } from "@/lib/store";

export const STORE_INFO = {
  name: "Edmacars Store",
  legal: "EDMACARS IMPORT",
  country: "El Salvador",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "50379490586",
  hours: "24 horas, 7 días a la semana",
  email: "ventas@edmacars.store",
} as const;

const WA_MARKER = "WA_SOLICITUD::";

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

export function buildCatalogContext(products: Product[]): string {
  if (!products.length) return "Catálogo vacío en este momento.";

  return products
    .map((p) => {
      const cat = p.categories?.name ?? "General";
      const desc = truncate(stripHtml(p.description ?? ""), 280);
      const stock = p.stock > 0 ? `${p.stock} en stock` : "agotado";
      return [
        `- ${p.name}`,
        `  Categoría: ${cat}`,
        `  Precio: $${Number(p.price).toFixed(2)}`,
        `  Stock: ${stock}`,
        `  URL: /producto/${p.slug}`,
        desc ? `  Descripción: ${desc}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

export async function loadSupportContext(): Promise<string> {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  const categoryList = categories.map((c) => `- ${c.name} (/categoria/${c.slug})`).join("\n");

  return [
    `EMPRESA: ${STORE_INFO.name} (${STORE_INFO.legal})`,
    `País: ${STORE_INFO.country}`,
    `Atención: ${STORE_INFO.hours}`,
    `WhatsApp: +${STORE_INFO.whatsapp}`,
    `Email: ${STORE_INFO.email}`,
    "",
    "CATEGORÍAS:",
    categoryList || "(sin categorías)",
    "",
    "CATÁLOGO DE PRODUCTOS (usa solo esta información, no inventes):",
    buildCatalogContext(products),
  ].join("\n");
}

export function buildSystemPrompt(catalogContext: string): string {
  return `Eres el asistente virtual oficial de Edmacars Store en El Salvador.
Responde siempre en español, tono profesional, cercano y claro.
Solo recomienda productos que existan en el catálogo provisto.
Cita precios exactos del catálogo y menciona si hay stock o está agotado.
Si el cliente busca algo que NO está en catálogo, responde con honestidad y al final agrega EXACTAMENTE una línea:
${WA_MARKER}mensaje corto y profesional para WhatsApp pidiendo si podemos conseguir ese producto para el cliente.
No inventes productos, precios ni disponibilidad.
Horario de atención: 24/7.
Puedes sugerir rutas como /catalogo o /producto/slug cuando aplique.

CONTEXTO DE LA TIENDA:
${catalogContext}`;
}

export function parseAssistantReply(raw: string): {
  text: string;
  whatsappMessage: string | null;
} {
  const lines = raw.split("\n");
  const clean: string[] = [];
  let whatsappMessage: string | null = null;

  for (const line of lines) {
    if (line.startsWith(WA_MARKER)) {
      whatsappMessage = line.slice(WA_MARKER.length).trim();
    } else {
      clean.push(line);
    }
  }

  return {
    text: clean.join("\n").trim(),
    whatsappMessage,
  };
}

export function buildWhatsAppSolicitudUrl(message: string): string | null {
  const digits = STORE_INFO.whatsapp.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export const CHAT_FALLBACK_REPLY =
  "Disculpa, no pude procesar tu consulta en este momento. Nuestro equipo atiende 24/7 — escríbenos por WhatsApp y con gusto te ayudamos con productos, precios y disponibilidad.";

export const CHAT_FALLBACK_WHATSAPP =
  "Hola Edmacars, necesito ayuda para encontrar un producto. ¿Me pueden apoyar?";

export function resolveNvidiaApiKey(): string | null {
  const candidates = [
    process.env.NVIDIA_API_KEY,
    process.env.NVAPI_API_KEY,
    process.env.NVAPI_KEY,
    process.env.NVIDIA_NVAPI_KEY,
  ];

  for (const value of candidates) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

export class ChatServiceError extends Error {
  readonly code: string;

  constructor(code: string, technicalMessage: string) {
    super(technicalMessage);
    this.name = "ChatServiceError";
    this.code = code;
  }
}

export async function callNvidiaChat(
  messages: { role: "system" | "user" | "assistant"; content: string }[]
): Promise<string> {
  const apiKey = resolveNvidiaApiKey();
  if (!apiKey) {
    throw new ChatServiceError(
      "missing_api_key",
      "NVIDIA API key missing (checked NVIDIA_API_KEY, NVAPI_API_KEY, NVAPI_KEY, NVIDIA_NVAPI_KEY)"
    );
  }

  const model =
    process.env.NVIDIA_MODEL?.trim() || "meta/llama-3.1-8b-instruct";
  const base = process.env.NVIDIA_API_BASE?.trim() || "https://integrate.api.nvidia.com/v1";

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.35,
      max_tokens: 1024,
      stream: false,
    }),
    signal: AbortSignal.timeout(45000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new ChatServiceError("nvidia_http_error", `NVIDIA HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new ChatServiceError("nvidia_empty_response", "NVIDIA returned empty content");
  }

  return content;
}