import Link from "next/link";
import type { ReactNode } from "react";

function internalPathRegex() {
  return /\/producto\/[a-z0-9-]+|\/categoria\/[a-z0-9-]+|\/catalogo(?:\?[^\s]*)?/gi;
}

function linkLabel(href: string): string {
  if (href.startsWith("/producto/")) return "Ver producto →";
  if (href.startsWith("/categoria/")) return "Ver categoría →";
  if (href.startsWith("/catalogo")) return "Ver catálogo →";
  return "Abrir enlace →";
}

type Props = {
  text: string;
  onNavigate?: () => void;
};

export function ChatMessageContent({ text, onNavigate }: Props) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(internalPathRegex())) {
    const href = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index));
    }

    nodes.push(
      <Link
        key={`${index}-${href}`}
        href={href.split("?")[0]}
        className="font-medium text-neon-cyan underline decoration-neon-cyan/50 underline-offset-2 transition hover:text-white"
        onClick={onNavigate}
      >
        {linkLabel(href)}
      </Link>
    );

    lastIndex = index + href.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return <p className="whitespace-pre-wrap">{nodes.length ? nodes : text}</p>;
}