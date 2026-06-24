import { BrandLogo } from "@/components/BrandLogo";
import { CategoryCard } from "@/components/CategoryCard";
import { ProductCard } from "@/components/ProductCard";
import { getCategories, getProducts } from "@/lib/store";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  const [categories, featuredProducts] = await Promise.all([
    getCategories(),
    getProducts({ limit: 4 }),
  ]);

  const productCountLabel =
    featuredProducts.length > 0 ? `${featuredProducts.length}+` : "—";

  return (
    <main className="flex-1">
      <section className="hero-edmacars relative overflow-hidden border-b border-white/5">
        <Image
          src="/hero-bg.jpg"
          alt=""
          fill
          className="object-cover opacity-35"
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
              Smartphones, laptops, gaming y accesorios con envío personalizado.
              Catálogo conectado a Supabase en tiempo real.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/catalogo" className="btn-neon px-8 py-3 text-sm">
                Explorar catálogo
              </Link>
              <Link href="/catalogo" className="btn-neon-outline px-8 py-3 text-sm">
                Ver productos
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-4 rounded-2xl border border-glass glass-surface p-6 backdrop-blur sm:gap-8">
            {[
              { value: productCountLabel, label: "Productos" },
              { value: "24h", label: "Respuesta" },
              { value: "5%", label: "Desc. fidelidad" },
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
              <p className="mt-1 text-sm text-zinc-500">Encuentra lo que buscas al instante</p>
            </div>
            <Link
              href="/catalogo"
              className="hidden text-sm text-neon-cyan transition hover:text-white sm:inline"
            >
              Ver todo →
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>
      )}

      <section className="border-t border-white/5 bg-surface/50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Destacados</h2>
              <p className="mt-1 text-sm text-zinc-500">Productos desde Supabase</p>
            </div>
            <Link
              href="/catalogo"
              className="text-sm text-neon-magenta transition hover:text-white"
            >
              Catálogo completo →
            </Link>
          </div>

          {featuredProducts.length === 0 ? (
            <p className="mt-8 text-center text-sm text-zinc-500">
              Aún no hay productos. Agrégalos en Supabase Table Editor.
            </p>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-neon-violet/20 bg-gradient-to-br from-neon-violet/10 via-transparent to-neon-cyan/10 p-8 sm:p-12">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-neon-magenta/10 blur-3xl animate-pulse-glow" />
          <div className="relative max-w-lg">
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">
              ¿Necesitas ayuda para elegir?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Pronto podrás chatear con nuestro asistente IA powered by Gemini.
            </p>
            <button type="button" className="btn-neon mt-6 px-6 py-2.5 text-sm opacity-80" disabled>
              Asistente IA — próximamente
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}