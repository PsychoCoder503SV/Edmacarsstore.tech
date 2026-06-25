"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  BANK_DETAILS,
  PAYMENT_LABELS,
  buildMapUrl,
  loadOrderConfirmation,
  type OrderConfirmationData,
  type PaymentMethod,
} from "@/lib/checkout";
import { buildWhatsAppProofUrl, formatWhatsAppProofMessage } from "@/lib/whatsapp-client";

function ConfirmadoContent() {
  const params = useSearchParams();
  const orden = params.get("orden");
  const [data, setData] = useState<OrderConfirmationData | null>(null);

  useEffect(() => {
    setData(loadOrderConfirmation(orden));
  }, [orden]);

  if (!data) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <p className="text-zinc-400">No hay datos del pedido en esta sesión.</p>
        <Link href="/catalogo" className="btn-neon mt-6 inline-block px-6 py-2.5 text-sm">
          Ir al catálogo
        </Link>
      </section>
    );
  }

  const waMessage = formatWhatsAppProofMessage(
    data.orderNumber,
    data.paymentMethod,
    data.customer,
    data.items,
    data.total
  );
  const waUrl = buildWhatsAppProofUrl(waMessage);
  const isTransfer = data.paymentMethod === "transferencia";

  return (
    <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-neon-cyan/30 bg-neon-cyan/5 p-6 text-center">
        <p className="text-4xl">✓</p>
        <h1 className="mt-3 font-brand text-3xl text-white">
          PEDIDO <span className="text-neon-cyan">CONFIRMADO</span>
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Tu orden <span className="font-mono text-neon-cyan">{data.orderNumber}</span> fue registrada
        </p>
      </div>

      <div className="mt-6 space-y-4 rounded-2xl border border-glass glass-surface-elevated p-6">
        <div className="flex justify-between border-b border-white/10 pb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Método de pago</p>
            <p className="mt-1 text-sm text-white">{PAYMENT_LABELS[data.paymentMethod]}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Total</p>
            <p className="mt-1 text-xl font-bold text-neon-cyan">${data.total.toFixed(2)}</p>
          </div>
        </div>

        {isTransfer && (
          <div className="rounded-xl border border-neon-magenta/25 bg-neon-magenta/5 p-4 text-sm text-zinc-300">
            <p className="font-semibold text-white">Datos para transferir</p>
            <ul className="mt-2 space-y-1">
              <li>Titular: {BANK_DETAILS.client}</li>
              <li>Cuenta BAC: {BANK_DETAILS.accountNumber}</li>
              <li>Tipo: {BANK_DETAILS.accountType}</li>
              <li>Banco: {BANK_DETAILS.bank}</li>
            </ul>
          </div>
        )}

        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Entrega</p>
          <p className="mt-1 text-sm text-zinc-200">{data.customer.address}</p>
          {data.customer.notes && (
            <p className="mt-1 text-xs text-zinc-500">Ref: {data.customer.notes}</p>
          )}
          <a
            href={buildMapUrl(data.customer.lat, data.customer.lng)}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-xs text-neon-cyan hover:text-white"
          >
            Ver ubicación en mapa →
          </a>
        </div>

        <ul className="space-y-2 border-t border-white/10 pt-4 text-sm text-zinc-300">
          {data.items.map((item, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span>
                {item.name} ×{item.quantity}
              </span>
              <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </div>

      {waUrl && (
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
          <p className="text-sm font-medium text-white">
            {isTransfer ? "Siguiente paso: envía tu comprobante" : "Confirma tu pedido por WhatsApp"}
          </p>
          <p className="mt-2 text-xs text-zinc-400">
            {isTransfer
              ? "Abre WhatsApp, adjunta la captura del comprobante y envía el mensaje con todos los detalles de tu pedido."
              : "Envía el detalle de tu pedido con ubicación para coordinar la entrega en efectivo."}
          </p>
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <WhatsAppIcon />
            {isTransfer ? "Enviar comprobante por WhatsApp" : "Enviar confirmación por WhatsApp"}
          </a>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href="/cuenta/pedidos" className="btn-neon-outline flex-1 py-2.5 text-center text-sm">
          Ver mis pedidos
        </Link>
        <Link href="/catalogo" className="btn-neon flex-1 py-2.5 text-center text-sm">
          Seguir comprando
        </Link>
      </div>
    </section>
  );
}

export default function PedidoConfirmadoPage() {
  return (
    <main className="flex-1">
      <Suspense
        fallback={
          <section className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-zinc-500">
            Cargando confirmación…
          </section>
        }
      >
        <ConfirmadoContent />
      </Suspense>
    </main>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}