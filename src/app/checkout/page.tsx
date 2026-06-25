"use client";

import Link from "next/link";
import { CheckoutForm } from "@/components/CheckoutForm";
import { useCart } from "@/components/CartProvider";

export default function CheckoutPage() {
  const { items } = useCart();

  if (items.length === 0) {
    return (
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <p className="text-lg text-zinc-300">No hay productos en el carrito</p>
          <Link href="/catalogo" className="btn-neon mt-6 inline-block px-6 py-2.5 text-sm">
            Ir al catálogo
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/carrito" className="text-xs text-neon-cyan hover:text-white">
          ← Volver al carrito
        </Link>
        <h1 className="mt-4 font-brand text-3xl tracking-wide text-white">
          CONFIRMAR <span className="text-neon-cyan">PEDIDO</span>
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Completa tus datos, elige el pago y enviamos la orden a WhatsApp de Edmacars
        </p>
        <CheckoutForm />
      </section>
    </main>
  );
}