import { verifyAdminRequest } from "@/lib/admin-auth";
import { notifyOrderStatusChange, type OrderStatus } from "@/lib/order-status-notify";
import { parseShippingAddress } from "@/lib/order-tracking";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { applyStockDelta, revalidateStockPaths } from "@/lib/stock-sync";
import { NextResponse } from "next/server";

const VALID_STATUSES: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

type RouteCtx = { params: Promise<{ id: string }> };

async function restoreStockOnCancel(orderId: string): Promise<string[]> {
  const supabase = createSupabaseAdmin();
  const { data: items } = await supabase
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", orderId);

  if (!items?.length) return [];

  const slugs: string[] = [];
  for (const item of items) {
    if (!item.product_id) continue;
    const result = await applyStockDelta(supabase, item.product_id, item.quantity);
    if (result.slug) slugs.push(result.slug);
  }
  return slugs;
}

export async function PATCH(request: Request, ctx: RouteCtx) {
  try {
    const auth = await verifyAdminRequest(request);
    if (!auth.ok) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const body = (await request.json()) as { status?: string };
    const status = body.status?.trim() as OrderStatus | undefined;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, status, total_amount, shipping_address")
      .eq("id", id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    if (order.status === status) {
      return NextResponse.json({ ok: true, status, unchanged: true });
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (status === "cancelled" && order.status !== "cancelled") {
      const slugs = await restoreStockOnCancel(id);
      await revalidateStockPaths(slugs);
    }

    const meta = parseShippingAddress(order.shipping_address);
    const orderNumber = meta?.order_number ?? id.slice(0, 8).toUpperCase();

    if (status !== "pending") {
      await notifyOrderStatusChange({
        orderNumber,
        status,
        shippingAddressRaw: order.shipping_address,
        total: Number(order.total_amount),
        trackToken: meta?.track_token,
      });
    }

    return NextResponse.json({ ok: true, status, orderNumber });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}