"use client";

export function ChatbotFab() {
  return (
    <button
      type="button"
      onClick={() => {
        // Gemini chatbot — próxima fase
      }}
      className="shadow-neon-cyan-strong fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-neon-cyan to-neon-magenta text-white transition hover:scale-105 hover:shadow-neon-magenta-strong"
      aria-label="Abrir asistente Edmacars"
      title="Asistente IA (próximamente)"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
}