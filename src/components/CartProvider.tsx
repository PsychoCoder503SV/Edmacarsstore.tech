"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CART_STORAGE_KEY, cartCount, parseCart, type CartItem } from "@/lib/cart";
import type { Product } from "@/lib/database.types";
import { productCover } from "@/lib/images";

type CartContextValue = {
  items: CartItem[];
  count: number;
  addItem: (product: Product) => boolean;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(parseCart(localStorage.getItem(CART_STORAGE_KEY)));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("edmacars-cart-updated"));
  }, [items, ready]);

  const addItem = useCallback((product: Product) => {
    if (product.stock <= 0) return false;

    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1, stock: product.stock } : i
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: Number(product.price),
          image: productCover(product),
          quantity: 1,
          stock: product.stock,
        },
      ];
    });
    return true;
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) =>
      prev.flatMap((i) => {
        if (i.id !== id) return [i];
        if (quantity <= 0) return [];
        const q = Math.min(quantity, i.stock);
        return [{ ...i, quantity: q }];
      })
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      count: cartCount(items),
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [items, addItem, removeItem, updateQuantity, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}