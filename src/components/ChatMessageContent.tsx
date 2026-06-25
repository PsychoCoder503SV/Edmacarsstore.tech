import { parseAssistantChat } from "@/lib/chat-format";
import Link from "next/link";

type Props = {
  text: string;
  onNavigate?: () => void;
};

export function ChatMessageContent({ text, onNavigate }: Props) {
  const { body, links } = parseAssistantChat(text);

  return (
    <div className="space-y-2">
      {body && <p className="whitespace-pre-wrap">{body}</p>}
      {links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-2.5 py-1 text-xs font-medium text-neon-cyan transition hover:border-neon-cyan/50 hover:bg-neon-cyan/20 hover:text-white"
              onClick={onNavigate}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}