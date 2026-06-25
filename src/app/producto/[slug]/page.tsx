import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductGallery } from "@/components/ProductGallery";
import { productImages } from "@/lib/images";
import { productDisplayDescription } from "@/lib/product-description";
import { getProductBySlug } from "@/lib/store";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductoPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const images = productImages(product);
  const description = productDisplayDescription(product.description);
  const categoryName = product.categories?.name ?? "Producto";
  const categorySlug = product.categories?.slug ?? "";

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href={categorySlug ? `/catalogo?categoria=${categorySlug}` : "/catalogo"} className="text-xs text-neon-cyan hover:text-white">
          ← Volver al catálogo
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <ProductGallery images={images} name={product.name} />

          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-500">{categoryName}</p>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">{product.name}</h1>
            <p className="mt-4 text-3xl font-bold text-neon-cyan">${Number(product.price).toFixed(2)}</p>

            <p className="mt-4 text-sm text-zinc-400">
              Stock:{" "}
              <span className={product.stock <= 0 ? "text-red-400" : "text-zinc-200"}>
                {product.stock > 0 ? `${product.stock} disponibles` : "Agotado"}
              </span>
            </p>

            {description && (
              <p className="mt-6 text-sm leading-relaxed text-zinc-400">{description}</p>
            )}

            <div className="mt-8">
              <AddToCartButton
                product={product}
                className="btn-neon px-8 py-3 text-sm"
                label={product.stock <= 0 ? "Agotado" : "Agregar al carrito"}
              />
            </div>

            {images.length > 1 && (
              <p className="mt-4 text-xs text-zinc-500">{images.length} fotos en la galería de este producto</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}