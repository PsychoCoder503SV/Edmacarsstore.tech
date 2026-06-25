import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductImage } from "@/components/ProductImage";
import type { Product } from "@/lib/database.types";
import { productCover, productImages } from "@/lib/images";
import { categoryIcon, productGradient } from "@/lib/store";
import Link from "next/link";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const categoryName = product.categories?.name ?? "Producto";
  const categorySlug = product.categories?.slug ?? "";
  const gradient = productGradient(categorySlug);
  const cover = productCover(product);
  const imageCount = productImages(product).length;
  const productHref = `/producto/${product.slug}`;

  return (
    <article
      className={`group card-hover-cyan relative flex flex-col overflow-hidden rounded-2xl border border-glass glass-surface-elevated transition duration-300 hover:-translate-y-1 hover:border-neon-cyan/30 ${product.stock <= 0 ? "opacity-75" : ""}`}
    >
      <Link href={productHref} className="block">
        <div
          className={`relative aspect-[4/3] bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}
        >
          <div className="product-overlay absolute inset-0 z-[1]" />
          {cover ? (
            <ProductImage
              src={cover}
              alt={product.name}
              fill
              className="z-0 object-cover transition duration-300 group-hover:scale-105"
              priority={false}
            />
          ) : (
            <span className="z-[2] text-5xl opacity-60 transition group-hover:scale-110 group-hover:opacity-90">
              {categoryIcon(categorySlug)}
            </span>
          )}
          {imageCount > 1 && (
            <span className="absolute bottom-3 right-3 z-[2] rounded-full border border-white/20 bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white">
              +{imageCount - 1} fotos
            </span>
          )}
          {product.stock <= 0 ? (
            <span className="absolute left-3 top-3 z-[2] rounded-full border border-zinc-500/40 bg-zinc-800/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
              agotado
            </span>
          ) : product.stock <= 3 ? (
            <span className="absolute left-3 top-3 z-[2] rounded-full border border-amber-400/30 bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
              últimas unidades
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">{categoryName}</p>
        <Link href={productHref}>
          <h3 className="mt-1 line-clamp-2 text-sm font-medium text-zinc-100 transition group-hover:text-neon-cyan">
            {product.name}
          </h3>
        </Link>
        <p className="mt-2 text-xs text-zinc-500">
          Stock: {product.stock > 0 ? product.stock : "Agotado"}
        </p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <p className="text-lg font-semibold text-white">${Number(product.price).toFixed(2)}</p>
          <AddToCartButton product={product} />
        </div>
      </div>
    </article>
  );
}