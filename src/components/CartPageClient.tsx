"use client";

import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { useCart } from "@/components/CartProvider";
import { cartTotal } from "@/lib/cart";

export function CartPageClient() {
  const { items, removeItem, updateQuantity, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="mt-12 rounded-2xl border border-glass glass-surface p-12 text-center">
        <p className="text-lg text-zinc-300">Tu carrito está vacío</p>
        <Link href="/catalogo" className="btn-neon mt-6 inline-block px-6 py-2.5 text-sm">
          Ir al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {items.map((item) => (
        <article
          key={item.id}
          className="flex gap-4 rounded-2xl border border-glass glass-surface-elevated p-4"
        >
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-950">
            {item.image ? (
              <ProductImage src={item.image} alt={item.name} fill fit="cover" />
            ) : (
              <span className="flex h-full items-center justify-center text-2xl opacity-40">📦</span>
            )}
          </div>

          <div className="flex flex-1 flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <Link href={`/producto/${item.slug}`} className="font-medium text-white hover:text-neon-cyan">
                {item.name}
              </Link>
              <p className="mt-1 text-sm text-zinc-500">${item.price.toFixed(2)} c/u</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-lg border border-white/10">
                <button
                  type="button"
                  className="px-3 py-1 text-zinc-300 hover:text-white"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  −
                </button>
                <span className="min-w-8 text-center text-sm">{item.quantity}</span>
                <button
                  type="button"
                  className="px-3 py-1 text-zinc-300 hover:text-white"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  disabled={item.quantity >= item.stock}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                className="text-xs text-red-400 hover:text-red-300"
                onClick={() => removeItem(item.id)}
              >
                Quitar
              </button>
            </div>
          </div>
        </article>
      ))}

      <div className="rounded-2xl border border-neon-cyan/20 bg-neon-cyan/5 p-6">
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Total</span>
          <span className="text-2xl font-bold text-white">${cartTotal(items).toFixed(2)}</span>
        </div>
        <Link href="/checkout" className="btn-neon mt-4 block w-full py-3 text-center text-sm">
          Confirmar pedido
        </Link>
        <button
          type="button"
          className="mt-3 w-full text-center text-xs text-zinc-500 hover:text-zinc-300"
          onClick={clearCart}
        >
          Vaciar carrito
        </button>
      </div>
    </div>
  );
}