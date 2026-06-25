import { BrandLogo } from "@/components/BrandLogo";
import { ProductCard } from "@/components/ProductCard";
import { getCategoryBySlug, getProducts } from "@/lib/store";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CategoriaPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const products = await getProducts({ categorySlug: slug });

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
            <BrandLogo size="lg" showName />
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-white">{category.name}</h1>
          <p className="mt-2 text-sm text-zinc-400">
            {products.length} producto{products.length !== 1 ? "s" : ""} disponible
            {products.length !== 1 ? "s" : ""} en esta categoría
          </p>
          <Link href="/catalogo" className="btn-neon-outline mt-6 inline-block px-5 py-2 text-sm">
            Ver catálogo completo
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {products.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">
            Esta categoría aún no tiene productos publicados.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}