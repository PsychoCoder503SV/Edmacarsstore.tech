"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { PAYMENT_LABELS, type PaymentMethod } from "@/lib/checkout";

type OrderRow = {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  shipping_address: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  processing: "En proceso",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export default function MisPedidosPage() {
  const supabase = createSupabaseClient();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("orders")
        .select("id, created_at, status, total_amount, shipping_address")
        .order("created_at", { ascending: false });
      setOrders((data as OrderRow[]) ?? []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  function parseShipping(addr: string | null) {
    if (!addr) return { orderNumber: "—", payment: "" };
    try {
      const j = JSON.parse(addr);
      const payment = j.payment_method as PaymentMethod | undefined;
      return {
        orderNumber: j.order_number ?? "—",
        payment: payment && PAYMENT_LABELS[payment] ? PAYMENT_LABELS[payment] : "",
        address: j.address ?? "",
      };
    } catch {
      return { orderNumber: "—", payment: "", address: "" };
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-white">Historial de pedidos</h2>
      {loading ? (
        <p className="mt-6 text-sm text-zinc-500">Cargando…</p>
      ) : orders.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">Aún no tienes pedidos con esta cuenta.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((o) => {
            const meta = parseShipping(o.shipping_address);
            return (
              <li key={o.id} className="rounded-xl border border-glass glass-surface p-4">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">{meta.orderNumber}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {new Date(o.created_at).toLocaleString("es-SV")}
                    </p>
                    {meta.payment && <p className="mt-1 text-xs text-zinc-400">{meta.payment}</p>}
                    {meta.address && (
                      <p className="mt-2 text-xs text-zinc-500 line-clamp-2">{meta.address}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-neon-cyan">${Number(o.total_amount).toFixed(2)}</p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {STATUS_LABELS[o.status] ?? o.status}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}