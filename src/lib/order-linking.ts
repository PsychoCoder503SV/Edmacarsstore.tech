import type { SupabaseClient } from "@supabase/supabase-js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ShippingRecord = {
  track_token?: string;
};

/** Vincula todos los pedidos guest cuyo email en shipping_address coincide. */
export async function linkGuestOrdersByEmail(
  supabase: SupabaseClient,
  userId: string,
  email: string
): Promise<number> {
  const { data, error } = await supabase.rpc("link_guest_orders_by_email", {
    p_user_id: userId,
    p_email: email.trim(),
  });

  if (error) {
    console.error("[order-linking] rpc link_guest_orders_by_email failed", error);
    return 0;
  }

  return typeof data === "number" ? data : 0;
}

/** Vincula un pedido concreto verificando track_token (post-checkout inmediato). */
export async function linkOrderByIdAndToken(
  supabase: SupabaseClient,
  userId: string,
  orderId: string,
  trackToken: string
): Promise<boolean> {
  if (!UUID_RE.test(orderId)) return false;

  const { data: order } = await supabase
    .from("orders")
    .select("id, user_id, shipping_address")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.user_id) return false;

  try {
    const shipping = JSON.parse(order.shipping_address ?? "{}") as ShippingRecord;
    if (shipping.track_token !== trackToken) return false;
  } catch {
    return false;
  }

  const { error } = await supabase.from("orders").update({ user_id: userId }).eq("id", orderId);
  return !error;
}

/** Tras crear cuenta: vincula por email y refuerza el pedido actual con token. */
export async function linkOrdersToNewAccount(
  supabase: SupabaseClient,
  userId: string,
  email: string,
  orderId?: string,
  trackToken?: string
): Promise<void> {
  await linkGuestOrdersByEmail(supabase, userId, email);

  if (orderId && trackToken) {
    await linkOrderByIdAndToken(supabase, userId, orderId, trackToken);
  }
}