export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  productCount: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  category: string;
  badge?: "nuevo" | "oferta" | "top";
  rating: number;
  imageGradient: string;
};

export const categories: Category[] = [
  { id: "1", name: "Smartphones", slug: "smartphones", icon: "📱", productCount: 48 },
  { id: "2", name: "Laptops", slug: "laptops", icon: "💻", productCount: 32 },
  { id: "3", name: "Audio", slug: "audio", icon: "🎧", productCount: 56 },
  { id: "4", name: "Gaming", slug: "gaming", icon: "🎮", productCount: 41 },
  { id: "5", name: "Accesorios", slug: "accesorios", icon: "🔌", productCount: 120 },
  { id: "6", name: "Smart Home", slug: "smart-home", icon: "🏠", productCount: 27 },
];

export const featuredProducts: Product[] = [
  {
    id: "p1",
    name: "Galaxy Ultra Pro 256GB",
    slug: "galaxy-ultra-pro",
    price: 899.99,
    originalPrice: 1099.99,
    category: "Smartphones",
    badge: "oferta",
    rating: 4.8,
    imageGradient: "from-cyan-500/40 via-violet-600/30 to-fuchsia-500/40",
  },
  {
    id: "p2",
    name: "MacBook Air M3 15\"",
    slug: "macbook-air-m3",
    price: 1249.0,
    category: "Laptops",
    badge: "top",
    rating: 4.9,
    imageGradient: "from-emerald-500/30 via-cyan-500/20 to-blue-600/40",
  },
  {
    id: "p3",
    name: "Sony WH-1000XM6",
    slug: "sony-wh-1000xm6",
    price: 349.99,
    category: "Audio",
    badge: "nuevo",
    rating: 4.7,
    imageGradient: "from-fuchsia-500/30 via-purple-600/25 to-cyan-400/35",
  },
  {
    id: "p4",
    name: "Razer DeathAdder V4",
    slug: "razer-deathadder-v4",
    price: 79.99,
    originalPrice: 99.99,
    category: "Gaming",
    badge: "oferta",
    rating: 4.6,
    imageGradient: "from-lime-400/25 via-cyan-500/30 to-violet-600/35",
  },
];