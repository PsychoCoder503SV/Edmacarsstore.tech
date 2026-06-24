import { createSupabaseClient } from "@/lib/supabase";
import type { Category, Product } from "@/lib/database.types";

export async function getCategories(): Promise<Category[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description")
    .order("name");

  if (error) {
    console.error("getCategories:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getProducts(options?: {
  categorySlug?: string;
  limit?: number;
}): Promise<Product[]> {
  const supabase = createSupabaseClient();

  let categoryId: string | undefined;
  if (options?.categorySlug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", options.categorySlug)
      .maybeSingle();
    categoryId = (cat as { id: string } | null)?.id;
    if (!categoryId) return [];
  }

  let query = supabase
    .from("products")
    .select("id, name, slug, description, price, image_url, stock, category_id, is_active, categories(name, slug)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getProducts:", error.message);
    return [];
  }
  return (data ?? []) as Product[];
}

export function categoryIcon(slug: string): string {
  const icons: Record<string, string> = {
    smartphones: "📱",
    laptops: "💻",
    audio: "🎧",
    gaming: "🎮",
    accesorios: "🔌",
    "smart-home": "🏠",
  };
  return icons[slug] ?? "📦";
}

export function productGradient(slug: string): string {
  const gradients: Record<string, string> = {
    smartphones: "from-cyan-500/40 via-violet-600/30 to-fuchsia-500/40",
    laptops: "from-emerald-500/30 via-cyan-500/20 to-blue-600/40",
    audio: "from-fuchsia-500/30 via-purple-600/25 to-cyan-400/35",
    gaming: "from-lime-400/25 via-cyan-500/30 to-violet-600/35",
  };
  return gradients[slug] ?? "from-violet-500/25 via-cyan-500/20 to-fuchsia-500/25";
}