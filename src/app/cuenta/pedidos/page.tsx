"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { OrderStatusBar } from "@/components/OrderStatusBar";
import { useAuth } from "@/lib/auth";
import { createSupabaseClient } from "@/lib/supabase";
import { PAYMENT_LABELS, type PaymentMethod } from "@/lib/checkout";

type OrderRow = {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  shipping_address: string | null;
  user_id: string | null;
};

export default function MisPedidosPage() {
  const { user } = useAuth();
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const linkedRef = useRef(false);

  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;
    let cancelled = false;

    async function load() {
      setLoading(true);

      if (!linkedRef.current) {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (accessToken) {
          await fetch("/api/auth/link-my-orders", {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
          }).catch(() => null);
        }
        linkedRef.current = true;
      }

      const { data, error } = await supabase
        .from("orders")
        .select("id, created_at, status, total_amount, shipping_address, user_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        console.error("[pedidos] load failed", error);
        setOrders([]);
      } else {
        setOrders((data as OrderRow[]) ?? []);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase, user?.id]);

  function parseShipping(addr: string | null) {
    if (!addr) return { orderNumber: "—", payment: "", trackToken: "" };
    try {
      const j = JSON.parse(addr);
      const payment = j.payment_method as PaymentMethod | undefined;
      return {
        orderNumber: j.order_number ?? "—",
        payment: payment && PAYMENT_LABELS[payment] ? PAYMENT_LABELS[payment] : "",
        address: j.address ?? "",
        email: j.email ?? "",
        trackToken: typeof j.track_token === "string" ? j.track_token : "",
      };
    } catch {
      return { orderNumber: "—", payment: "", address: "", trackToken: "" };
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-white">Historial de pedidos</h2>
      <p className="mt-1 text-xs text-zinc-500">Tus compras en Edmacars Store</p>
      {loading ? (
        <LoadingIndicator className="mt-2" />
      ) : orders.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">
          Aún no hay pedidos en tu cuenta. Cuando compres con el mismo email, aparecerán aquí
          automáticamente.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((o) => {
            const meta = parseShipping(o.shipping_address);
            return (
              <li key={o.id} className="rounded-xl border border-glass glass-surface p-4">
                <div className="flex justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-white">{meta.orderNumber}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {new Date(o.created_at).toLocaleString("es-SV")}
                    </p>
                    {meta.payment && <p className="mt-1 text-xs text-zinc-400">{meta.payment}</p>}
                    {meta.address && (
                      <p className="mt-2 text-xs text-zinc-500 line-clamp-2">{meta.address}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold text-neon-cyan">${Number(o.total_amount).toFixed(2)}</p>
                  </div>
                </div>

                <div className="mt-4 border-t border-white/10 pt-4">
                  <OrderStatusBar status={o.status} compact />
                </div>

                {meta.orderNumber !== "—" && (
                  <Link
                    href={
                      meta.trackToken
                        ? `/pedido/seguimiento?orden=${encodeURIComponent(meta.orderNumber)}&t=${encodeURIComponent(meta.trackToken)}`
                        : `/pedido/seguimiento?orden=${encodeURIComponent(meta.orderNumber)}`
                    }
                    className="mt-3 inline-block text-xs text-neon-cyan hover:text-white"
                  >
                    Ver detalle y seguimiento →
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}