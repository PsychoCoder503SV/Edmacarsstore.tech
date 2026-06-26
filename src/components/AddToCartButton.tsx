"use client";

import { useRef, useState } from "react";
import type { Product } from "@/lib/database.types";
import { useCart } from "@/components/CartProvider";
import { animateFlyToCart } from "@/lib/cart-fly";
import { productCover } from "@/lib/images";

type Props = {
  product: Product;
  className?: string;
  label?: string;
};

export function AddToCartButton({
  product,
  className = "btn-neon shrink-0 px-3 py-2 text-xs",
  label = "+ Carrito",
}: Props) {
  const { addItem } = useCart();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pulse, setPulse] = useState(false);
  const disabled = product.stock <= 0;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || !buttonRef.current) return;

    const added = addItem(product);
    if (!added) return;

    setPulse(true);
    animateFlyToCart(buttonRef.current, productCover(product));

    const cartAnchor = document.getElementById("cart-icon-anchor");
    cartAnchor?.classList.add("cart-bump");
    window.setTimeout(() => {
      setPulse(false);
      cartAnchor?.classList.remove("cart-bump");
    }, 700);
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