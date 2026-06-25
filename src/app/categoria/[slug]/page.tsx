import { BrandLogo } from "@/components/BrandLogo";
import { ProductImage } from "@/components/ProductImage";
import {
  getCategoryBySlug,
  getCategoryGalleryImages,
  getProducts,
} from "@/lib/store";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CategoriaGalleryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const products = await getProducts({ categorySlug: slug });
  const gallery = getCategoryGalleryImages(products);

  return (
    <main className="flex-1">
      <section className="relative overflow-hidden border-b border-white/5">
        <Image src="/fondoweb.webp" alt="" fill className="object-cover opacity-25" sizes="100vw" />
        <div className="hero-edmacars-overlay absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Link href="/" className="text-xs text-neon-cyan transition hover:text-white">
            ← Inicio
          </Link>
          <div className="mt-4">
            <BrandLogo size="md" />
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-white">{category.name}</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Galería de fotos — {gallery.length} imagen{gallery.length !== 1 ? "es" : ""}
          </p>
          <Link
            href={`/catalogo?categoria=${slug}`}
            className="btn-neon-outline mt-6 inline-block px-5 py-2 text-sm"
          >
            Ver catálogo con precios
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {gallery.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">
            Esta categoría aún no tiene fotos. Súbelas desde la APK.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {gallery.map((item, index) => (
              <figure
                key={`${item.url}-${index}`}
                className="group relative aspect-square overflow-hidden rounded-xl border border-glass glass-surface-elevated"
              >
                <ProductImage
                  src={item.url}
                  alt={item.productName}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-[11px] text-zinc-200">
                  {item.productName}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}