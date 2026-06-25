import type { Category } from "@/lib/database.types";
import { categoryIcon } from "@/lib/store";
import Link from "next/link";

type CategoryCardProps = {
  category: Category;
  productCount?: number;
};

export function CategoryCard({ category, productCount }: CategoryCardProps) {
  return (
    <Link
      href={`/categoria/${category.slug}`}
      className="group category-hover-magenta flex flex-col items-center rounded-2xl border border-glass glass-surface p-6 text-center transition hover:border-neon-magenta/40 hover:bg-neon-magenta/5"
    >
      <span className="text-3xl transition duration-300 group-hover:scale-110">
        {categoryIcon(category.slug)}
      </span>
      <h3 className="mt-3 text-sm font-medium text-zinc-200 group-hover:text-white">
        {category.name}
      </h3>
      {productCount !== undefined && (
        <p className="mt-1 text-xs text-zinc-600">{productCount} productos · ver galería</p>
      )}
    </Link>
  );
}