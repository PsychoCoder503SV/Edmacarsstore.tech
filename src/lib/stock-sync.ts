import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function applyStockDelta(
  supabase: SupabaseClient,
  productId: string,
  delta: number
): Promise<{ ok: boolean; nextStock?: number; slug?: string; error?: string }> {
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("id, stock, slug")
    .eq("id", productId)
    .single();

  if (fetchError || !product) {
    return { ok: false, error: fetchError?.message ?? "Producto no encontrado" };
  }

  const currentStock = Number(product.stock);
  const nextStock = Math.max(0, currentStock + delta);

  if (delta < 0 && currentStock + delta < 0) {
    return { ok: false, error: `Stock insuficiente (${currentStock} disponibles)` };
  }

  const { error: updateError } = await supabase
    .from("products")
    .update({ stock: nextStock })
    .eq("id", productId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  return { ok: true, nextStock, slug: product.slug as string };
}

export async function revalidateStockPaths(slugs: string[]): Promise<void> {
  revalidatePath("/", "page");
  revalidatePath("/catalogo", "page");
  for (const slug of [...new Set(slugs)]) {
    if (slug) revalidatePath(`/producto/${slug}`, "page");
  }
}