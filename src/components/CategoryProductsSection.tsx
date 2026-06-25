import { ProductCard } from "@/components/ProductCard";
import type { CategoryWithProducts } from "@/lib/store";
import Link from "next/link";

type Props = {
  section: CategoryWithProducts;
};

export function CategoryProductsSection({ section }: Props) {
  return (
    <section className="border-t border-white/5 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">{section.name}</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {section.products.length} producto{section.products.length !== 1 ? "s" : ""} en esta categoría
            </p>
          </div>
          <Link
            href={`/categoria/${section.slug}`}
            className="text-sm text-neon-cyan transition hover:text-white"
          >
            Ver galería de fotos →
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {section.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}