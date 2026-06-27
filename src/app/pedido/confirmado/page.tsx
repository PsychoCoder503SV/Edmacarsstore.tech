import { Suspense } from "react";
import { ConfirmadoContent } from "@/app/pedido/confirmado/ConfirmadoContent";
import { resolveWhatsAppDigits } from "@/lib/whatsapp-config";

export const dynamic = "force-dynamic";

export default function PedidoConfirmadoPage() {
  const whatsappDigits = resolveWhatsAppDigits();

  return (
    <main className="flex-1">
      <Suspense
        fallback={
          <section className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-zinc-500">
            Cargando confirmación…
          </section>
        }
      >
        <ConfirmadoContent whatsappDigits={whatsappDigits} />
      </Suspense>
    </main>
  );
}