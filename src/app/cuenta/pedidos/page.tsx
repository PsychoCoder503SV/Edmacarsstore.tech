"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type OrderRow = {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  shipping_address: string | null;
};

export default function MisPedidosPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function loadOrders() {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      setLoggedIn(false);
      setLoading(false);
      return;
    }
    setLoggedIn(true);
    const { data } = await supabase
      .from("orders")
      .select("id, created_at, status, total_amount, shipping_address")
      .order("created_at", { ascending: false });
    setOrders((data as OrderRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
      return;
    }
    setLoading(true);
    await loadOrders();
  }

  function parseOrderNumber(addr: string | null): string {
    if (!addr) return "—";
    try {
      const j = JSON.parse(addr);
      return j.order_number ?? "—";
    } catch {
      return "—";
    }
  }

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-brand text-3xl text-white">
          MIS <span className="text-neon-cyan">PEDIDOS</span>
        </h1>

        {!loggedIn ? (
          <form onSubmit={handleLogin} className="mt-8 space-y-4 rounded-2xl border border-glass glass-surface p-6">
            <p className="text-sm text-zinc-400">Inicia sesión para ver tu historial y estado de pedidos</p>
            <input className="checkout-input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="checkout-input" type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="submit" className="btn-neon w-full py-2.5 text-sm">Ingresar</button>
          </form>
        ) : loading ? (
          <p className="mt-8 text-sm text-zinc-500">Cargando...</p>
        ) : orders.length === 0 ? (
          <p className="mt-8 text-sm text-zinc-500">Aún no tienes pedidos registrados con esta cuenta.</p>
        ) : (
          <ul className="mt-8 space-y-4">
            {orders.map((o) => (
              <li key={o.id} className="rounded-xl border border-glass glass-surface p-4">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">{parseOrderNumber(o.shipping_address)}</p>
                    <p className="mt-1 text-xs text-zinc-500">{new Date(o.created_at).toLocaleString("es-SV")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-neon-cyan">${Number(o.total_amount).toFixed(2)}</p>
                    <p className="mt-1 text-xs capitalize text-zinc-400">{o.status}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Link href="/" className="mt-8 inline-block text-sm text-neon-cyan hover:text-white">
          ← Volver al inicio
        </Link>
      </section>
    </main>
  );
}