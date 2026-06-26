import type { SupabaseClient } from "@supabase/supabase-js";

export async function applyStockDelta(
  supabase: SupabaseClient,
  productId: string,
  delta: number
): Promise<{ ok: boolean; nextStock?: number; error?: string }> {
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("id, stock")
    .eq("id", productId)
    .single();

  if (fetchError || !product) {
    return { ok: false, error: fetchError?.message ?? "Producto no encontrado" };
  }

  const nextStock = Math.max(0, Number(product.stock) + delta);
  const { error: updateError } = await supabase
    .from("products")
    .update({ stock: nextStock })
    .eq("id", productId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  return { ok: true, nextStock };
}