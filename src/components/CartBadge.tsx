"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";

export function CartBadge() {
  const { count } = useCart();

  return (
    <Link
      id="cart-icon-anchor"
      href="/carrito"
      className="relative rounded-lg border border-white/10 p-2 text-zinc-400 transition hover:border-neon-magenta/40 hover:text-neon-magenta"
      aria-label="Carrito"
    >
      <CartIcon />
      <span className="absolute -right-1 -top-1 flex h-4 w-4 min-w-4 items-center justify-center rounded-full bg-neon-magenta px-0.5 text-[10px] font-bold text-white">
        {count > 9 ? "9+" : count}
      </span>
    </Link>
  );
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}