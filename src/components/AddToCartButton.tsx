"use client";

import { useRef, useState } from "react";
import type { Product } from "@/lib/database.types";
import { useCart } from "@/components/CartProvider";

type Props = {
  product: Product;
  className?: string;
  label?: string;
};

export function AddToCartButton({ product, className = "btn-neon shrink-0 px-3 py-2 text-xs", label = "+ Carrito" }: Props) {
  const { addItem } = useCart();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pulse, setPulse] = useState(false);
  const disabled = product.stock <= 0;

  function flyToCart() {
    const btn = buttonRef.current;
    const cart = document.getElementById("cart-icon-anchor");
    if (!btn || !cart) return;

    const from = btn.getBoundingClientRect();
    const to = cart.getBoundingClientRect();
    const dot = document.createElement("div");
    dot.className = "cart-fly-dot";
    dot.style.left = `${from.left + from.width / 2}px`;
    dot.style.top = `${from.top + from.height / 2}px`;
    document.body.appendChild(dot);

    requestAnimationFrame(() => {
      dot.style.transform = `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(0.35)`;
      dot.style.opacity = "0.2";
    });

    window.setTimeout(() => dot.remove(), 650);
  }

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    const added = addItem(product);
    if (!added) return;

    setPulse(true);
    flyToCart();
    document.getElementById("cart-icon-anchor")?.classList.add("cart-bump");
    window.setTimeout(() => {
      setPulse(false);
      document.getElementById("cart-icon-anchor")?.classList.remove("cart-bump");
    }, 450);
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`${className} ${pulse ? "cart-btn-pulse" : ""}`.trim()}
      disabled={disabled}
      onClick={handleClick}
      aria-label={`Añadir ${product.name} al carrito`}
    >
      {disabled ? "Agotado" : label}
    </button>
  );
}