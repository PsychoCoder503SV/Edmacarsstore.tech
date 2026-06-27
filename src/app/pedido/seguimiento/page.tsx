"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { PAYMENT_LABELS, type PaymentMethod } from "@/lib/checkout";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { OrderStatusBar } from "@/components/OrderStatusBar";
import { ORDER_STATUS_LABELS } from "@/lib/order-tracking";

type TrackedItem = {
  name: string;
  slug: string | null;
  quantity: number;
  unitPrice: number;
};

type TrackedOrder = {
  orderNumber: string;
  status: string;
  createdAt: string;
  total: number;
  paymentMethod: PaymentMethod | null;
  customerName: string | null;
  address: string | null;
  mapUrl: string | null;
  items: TrackedItem[];
};

function SeguimientoContent() {
  const params = useSearchParams();
  const tokenFromUrl = params.get("t") ?? "";
  const [orderNumber, setOrderNumber] = useState(params.get("orden") ?? "");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const hasSecureLink = Boolean(tokenFromUrl && orderNumber);

  const fetchTrack = useCallback(
    async (num: string, mail: string, token?: string) => {
      setError(null);
      setOrder(null);
      setLoading(true);

      try {
        const res = await fetch("/api/orders/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderNumber: num,
            email: mail || undefined,
            token: token || undefined,
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "No se encontró el pedido");
          return;
        }

        setOrder(data.order as TrackedOrder);
      } catch {
        setError("Error de conexión. Intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (hasSecureLink) {
      fetchTrack(orderNumber, "", tokenFromUrl);
    }
  }, [hasSecureLink, orderNumber, tokenFromUrl, fetchTrack]);

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    await fetchTrack(orderNumber, email);
  }



  return (
    <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href="/" className="text-xs text-neon-cyan hover:text-white">
        ← Volver a la tienda
      </Link>
      <h1 className="mt-4 font-brand text-3xl text-white">
        SEGUIMIENTO <span className="text-neon-cyan">DE PEDIDO</span>
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Revisa el estado y el detalle de tu compra en Edmacars Store.
      </p>

      {loading && !order && !error && <LoadingIndicator className="mt-4" />}

      {!hasSecureLink && (
        <form
          onSubmit={handleTrack}
          className="mt-8 space-y-4 rounded-2xl border border-glass glass-surface p-6"
        >
          <input
            className="checkout-input font-mono"
            placeholder="Número de orden (EDMA-20260625-1234)"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            required
          />
          <input
            className="checkout-input"
            type="email"
            placeholder="Email usado en el pedido"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" className="btn-neon w-full py-2.5 text-sm" disabled={loading}>
            {loading ? "Consultando…" : "Consultar estado"}
          </button>
        </form>
      )}

      {hasSecureLink && error && (
        <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </p>
      )}

      {order && (
        <div className="mt-8 space-y-6 rounded-2xl border border-glass glass-surface-elevated p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Orden</p>
              <p className="font-mono text-lg text-neon-cyan">{order.orderNumber}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {new Date(order.createdAt).toLocaleString("es-SV")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Total</p>
              <p className="text-xl font-bold text-white">${order.total.toFixed(2)}</p>
              <p className="mt-1 text-xs text-zinc-400">
                {ORDER_STATUS_LABELS[order.status] ?? order.status}
              </p>
            </div>
          </div>

          <OrderStatusBar status={order.status} />

          {order.paymentMethod && (
            <p className="text-sm text-zinc-400">
              Pago: {PAYMENT_LABELS[order.paymentMethod]}
            </p>
          )}

          {order.address && (
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Entrega</p>
              <p className="mt-1 text-sm text-zinc-300">{order.address}</p>
              {order.mapUrl && (
                <a
                  href={order.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs text-neon-cyan hover:text-white"
                >
                  Ver ubicación →
                </a>
              )}
            </div>
          )}

          <ul className="space-y-2 border-t border-white/10 pt-4 text-sm text-zinc-300">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span>
                  {item.slug ? (
                    <Link href={`/producto/${item.slug}`} className="hover:text-neon-cyan">
                      {item.name}
                    </Link>
                  ) : (
                    item.name
                  )}{" "}
                  ×{item.quantity}
                </span>
                <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-zinc-500">
        ¿Tienes cuenta?{" "}
        <Link href="/cuenta/pedidos" className="text-neon-cyan hover:text-white">
          Ver todos mis pedidos
        </Link>
      </p>
    </section>
  );
}

export default function SeguimientoPedidoPage() {
  return (
    <main className="flex-1">
      <Suspense
        fallback={
          <section className="mx-auto max-w-2xl px-4 py-16">
            <LoadingIndicator />
          </section>
        }
      >
        <SeguimientoContent />
      </Suspense>
    </main>
  );
}