export type CartItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
  stock: number;
};

export const CART_STORAGE_KEY = "edmacars-cart";

export function parseCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as CartItem[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}