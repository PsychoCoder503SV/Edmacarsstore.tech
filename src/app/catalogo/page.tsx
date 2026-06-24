import { BrandLogo } from "@/components/BrandLogo";
import { ProductCard } from "@/components/ProductCard";
import { getCategories, getProducts } from "@/lib/store";
import Image from "next/image";
import Link from "next/link";

type PageProps = {
  searchParams: Promise<{ categoria?: string }>;
};

export default async function CatalogoPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const categorySlug = params.categoria;

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ categorySlug }),
  ]);

  const activeCategory = categories.find((c) => c.slug === categorySlug);

  return (
    <main className="flex-1">
      <section className="relative overflow-hidden border-b border-white/5">
        <Image src="/fondoapk.png" alt="" fill className="object-cover opacity-20" sizes="100vw" />
        <div className="hero-edmacars-overlay absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-neon-cyan">Catálogo</p>
          <div className="mt-3">
            <BrandLogo size="lg" />
          </div>
          <p className="mt-3 max-w-xl text-sm text-zinc-500">
            {activeCategory
              ? `Productos en ${activeCategory.name}`
              : "Todos los productos disponibles — datos en vivo desde Supabase"}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/catalogo"
            className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
              !categorySlug
                ? "border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan"
                : "border-white/10 text-zinc-400 hover:border-neon-cyan/30 hover:text-white"
            }`}
          >
            Todos
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/catalogo?categoria=${cat.slug}`}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                categorySlug === cat.slug
                  ? "border-neon-magenta/40 bg-neon-magenta/10 text-neon-magenta"
                  : "border-white/10 text-zinc-400 hover:border-neon-magenta/30 hover:text-white"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {products.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-glass glass-surface p-12 text-center">
            <p className="text-lg font-medium text-zinc-300">No hay productos todavía</p>
            <p className="mt-2 text-sm text-zinc-500">
              Agrega productos desde Supabase Table Editor o la APK admin (próximamente).
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}