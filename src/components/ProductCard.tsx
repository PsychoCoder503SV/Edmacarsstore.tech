import type { Product } from "@/lib/database.types";
import { categoryIcon, productGradient } from "@/lib/store";
import Link from "next/link";
import Image from "next/image";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const categoryName = product.categories?.name ?? "Producto";
  const categorySlug = product.categories?.slug ?? "";
  const gradient = productGradient(categorySlug);

  return (
    <article className="group card-hover-cyan relative flex flex-col overflow-hidden rounded-2xl border border-glass glass-surface-elevated transition duration-300 hover:-translate-y-1 hover:border-neon-cyan/30">
      <Link href={`/producto/${product.slug}`} className="block">
        <div
          className={`relative aspect-[4/3] bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}
        >
          <div className="product-overlay absolute inset-0" />
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover transition group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 25vw"
            />
          ) : (
            <span className="text-5xl opacity-60 transition group-hover:scale-110 group-hover:opacity-90">
              {categoryIcon(categorySlug)}
            </span>
          )}
          {product.stock <= 3 && product.stock > 0 && (
            <span className="absolute left-3 top-3 rounded-full border border-amber-400/30 bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
              últimas unidades
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">{categoryName}</p>
        <Link href={`/producto/${product.slug}`}>
          <h3 className="mt-1 line-clamp-2 text-sm font-medium text-zinc-100 transition group-hover:text-neon-cyan">
            {product.name}
          </h3>
        </Link>
        <p className="mt-2 text-xs text-zinc-500">
          Stock: {product.stock > 0 ? product.stock : "Agotado"}
        </p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <p className="text-lg font-semibold text-white">${Number(product.price).toFixed(2)}</p>
          <button
            type="button"
            className="btn-neon shrink-0 px-3 py-2 text-xs"
            disabled={product.stock <= 0}
            aria-label={`Añadir ${product.name} al carrito`}
          >
            + Carrito
          </button>
        </div>
      </div>
    </article>
  );
}