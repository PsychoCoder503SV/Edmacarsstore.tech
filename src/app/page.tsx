import { BrandLogo } from "@/components/BrandLogo";
import { CategoryCard } from "@/components/CategoryCard";
import { ProductCard } from "@/components/ProductCard";
import { getCategories, getProducts, getProductsByCategory } from "@/lib/store";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  const [categories, categorySections, allProducts] = await Promise.all([
    getCategories(),
    getProductsByCategory(),
    getProducts(),
  ]);

  const productCountLabel = allProducts.length > 0 ? String(allProducts.length) : "0";

  return (
    <main className="flex-1">
      <section className="hero-edmacars relative isolate min-h-[calc(100dvh-4rem)] overflow-hidden border-b border-white/5">
        <Image
          src="/fondoweb.webp"
          alt=""
          fill
          className="object-cover opacity-45"
          priority
          sizes="100vw"
        />
        <div className="hero-edmacars-overlay absolute inset-0" />
        <div className="cyber-grid absolute inset-0 opacity-30" />

        <div className="relative flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-3xl text-center">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-neon-cyan/25 bg-neon-cyan/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-neon-cyan">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-cyan" />
              Tecnología de primera mano
            </p>

            <div className="flex flex-col items-center justify-center">
              <BrandLogo size="hero" showName />
              <p className="mt-5 text-xl font-light text-zinc-300 sm:text-2xl">
                Tu tienda tech en El Salvador
              </p>
            </div>

            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-zinc-500">
              Smartphones, laptops, gaming y accesorios con envío personalizado.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="#todos-los-productos" className="btn-neon px-8 py-3 text-sm">
                Ver productos
              </Link>
              <Link href="#categorias" className="btn-neon-outline px-8 py-3 text-sm">
                Por categoría
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-14 grid w-full max-w-2xl grid-cols-3 gap-4 rounded-2xl border border-glass glass-surface p-6 backdrop-blur sm:gap-8">
            {[
              { value: productCountLabel, label: "Productos" },
              { value: String(categories.length), label: "Categorías" },
              { value: "24h", label: "Respuesta" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-brand text-2xl text-neon-cyan sm:text-3xl">{stat.value}</p>
                <p className="mt-1 text-xs text-zinc-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="todos-los-productos" className="border-t border-white/5 bg-surface/40 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Todos los productos</h2>
              <p className="mt-1 text-sm text-zinc-500">Catálogo completo de la tienda</p>
            </div>
            <Link href="/catalogo" className="text-sm text-neon-magenta transition hover:text-white">
              Ver catálogo →
            </Link>
          </div>

          {allProducts.length === 0 ? (
            <p className="mt-10 text-center text-sm text-zinc-500">Pronto habrá productos disponibles.</p>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {allProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {categories.length > 0 && (
        <section id="categorias" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div>
            <h2 className="text-2xl font-semibold text-white">Categorías</h2>
            <p className="mt-1 text-sm text-zinc-500">Explora por tipo de producto y ver galería de fotos</p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                productCount={
                  categorySections.find((s) => s.slug === category.slug)?.products.length ?? 0
                }
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}