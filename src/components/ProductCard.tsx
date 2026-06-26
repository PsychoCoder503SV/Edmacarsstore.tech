import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductCardMedia } from "@/components/ProductCardMedia";
import type { Product } from "@/lib/database.types";
import { productImages } from "@/lib/images";
import { productGradient } from "@/lib/store";
import Link from "next/link";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const categoryName = product.categories?.name ?? "Producto";
  const categorySlug = product.categories?.slug ?? "";
  const gradient = productGradient(categorySlug);
  const images = productImages(product);
  const productHref = `/producto/${product.slug}`;

  return (
    <article
      className={`group card-hover-cyan relative flex flex-col overflow-hidden rounded-2xl border border-glass glass-surface-elevated transition duration-300 hover:-translate-y-1 hover:border-neon-cyan/30 ${product.stock <= 0 ? "opacity-75" : ""}`}
    >
      <ProductCardMedia
        images={images}
        name={product.name}
        categorySlug={categorySlug}
        gradient={gradient}
        productHref={productHref}
        stock={product.stock}
      />

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