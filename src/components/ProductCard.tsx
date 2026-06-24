import type { Product } from "@/lib/mock-data";
import Link from "next/link";

const badgeStyles = {
  nuevo: "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30",
  oferta: "bg-neon-magenta/20 text-neon-magenta border-neon-magenta/30",
  top: "bg-amber-400/20 text-amber-300 border-amber-400/30",
};

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group card-hover-cyan relative flex flex-col overflow-hidden rounded-2xl border border-glass glass-surface-elevated transition duration-300 hover:-translate-y-1 hover:border-neon-cyan/30">
      <Link href={`/producto/${product.slug}`} className="block">
        <div
          className={`relative aspect-[4/3] bg-gradient-to-br ${product.imageGradient} flex items-center justify-center`}
        >
          <div className="product-overlay absolute inset-0" />
          <span className="text-5xl opacity-60 transition group-hover:scale-110 group-hover:opacity-90">
            {product.category === "Smartphones"
              ? "📱"
              : product.category === "Laptops"
                ? "💻"
                : product.category === "Audio"
                  ? "🎧"
                  : "🎮"}
          </span>
          {product.badge && (
            <span
              className={`absolute left-3 top-3 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeStyles[product.badge]}`}
            >
              {product.badge}
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">{product.category}</p>
        <Link href={`/producto/${product.slug}`}>
          <h3 className="mt-1 line-clamp-2 text-sm font-medium text-zinc-100 transition group-hover:text-neon-cyan">
            {product.name}
          </h3>
        </Link>
        <div className="mt-2 flex items-center gap-1 text-xs text-amber-400/90">
          <span>★</span>
          <span>{product.rating}</span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div>
            {product.originalPrice && (
              <p className="text-xs text-zinc-600 line-through">
                ${product.originalPrice.toFixed(2)}
              </p>
            )}
            <p className="text-lg font-semibold text-white">
              ${product.price.toFixed(2)}
            </p>
          </div>
          <button
            type="button"
            className="btn-neon shrink-0 px-3 py-2 text-xs"
            aria-label={`Añadir ${product.name} al carrito`}
          >
            + Carrito
          </button>
        </div>
      </div>
    </article>
  );
}