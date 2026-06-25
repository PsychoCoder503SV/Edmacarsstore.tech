import { ProductCard } from "@/components/ProductCard";
import { getCategories, getProducts } from "@/lib/store";
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
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          {activeCategory ? (
            <>
              <Link href="/" className="text-xs text-neon-cyan hover:text-white">
                ← Inicio
              </Link>
              <h1 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">{activeCategory.name}</h1>
            </>
          ) : (
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">Catálogo completo</h1>
          )}
        </div>

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
            <p className="text-lg font-medium text-zinc-300">No hay productos en esta categoría</p>
            <Link href="/catalogo" className="btn-neon-outline mt-4 inline-block px-5 py-2 text-sm">
              Ver todo el catálogo
            </Link>
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