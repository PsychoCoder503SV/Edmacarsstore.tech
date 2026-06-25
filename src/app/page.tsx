import { BrandLogo } from "@/components/BrandLogo";
import { CategoryCard } from "@/components/CategoryCard";
import { CategoryProductsSection } from "@/components/CategoryProductsSection";
import { getCategories, getProducts, getProductsByCategory } from "@/lib/store";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  const [categories, categorySections, allProducts] = await Promise.all([
    getCategories(),
    getProductsByCategory(),
    getProducts(),
  ]);

  const productCountLabel = allProducts.length > 0 ? `${allProducts.length}+` : "—";

  return (
    <main className="flex-1">
      <section className="hero-edmacars relative overflow-hidden border-b border-white/5">
        <Image
          src="/fondoweb.webp"
          alt=""
          fill
          className="object-cover opacity-45"
          priority
          sizes="100vw"
        />
        <div className="hero-edmacars-overlay absolute inset-0" />
        <div className="cyber-grid absolute inset-0 opacity-40" />
        <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-neon-cyan/25 bg-neon-cyan/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-neon-cyan">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-cyan" />
              Tecnología de primera mano
            </p>

            <div className="flex flex-col items-center">
              <BrandLogo size="hero" />
              <p className="mt-4 text-2xl font-light tracking-normal text-zinc-300 sm:text-3xl">
                Tu tienda tech en El Salvador
              </p>
            </div>

            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-zinc-500 sm:text-lg">
              Explora por categoría, mira la galería de fotos y compra con stock en tiempo real.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/catalogo" className="btn-neon px-8 py-3 text-sm">
                Explorar catálogo
              </Link>
              <Link href="#productos-por-categoria" className="btn-neon-outline px-8 py-3 text-sm">
                Ver por categoría
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-4 rounded-2xl border border-glass glass-surface p-6 backdrop-blur sm:gap-8">
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

      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Categorías</h2>
              <p className="mt-1 text-sm text-zinc-500">Toca una categoría para ver todas sus fotos</p>
            </div>
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

      <div id="productos-por-categoria">
        {categorySections.length === 0 ? (
          <section className="border-t border-white/5 py-16 text-center">
            <p className="text-sm text-zinc-500">Aún no hay productos. Agrégalos desde la APK.</p>
          </section>
        ) : (
          categorySections.map((section) => (
            <CategoryProductsSection key={section.id} section={section} />
          ))
        )}
      </div>
    </main>
  );
}