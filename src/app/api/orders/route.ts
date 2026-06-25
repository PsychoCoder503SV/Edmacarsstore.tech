import { buildShippingRecord, type CheckoutCustomer, type PaymentMethod } from "@/lib/checkout";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

type OrderPayload = {
  orderNumber: string;
  paymentMethod: PaymentMethod;
  customer: CheckoutCustomer;
  items: { productId: string; quantity: number; unitPrice: number }[];
  total: number;
  userId?: string | null;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OrderPayload;
    const { orderNumber, paymentMethod, customer, items, total, userId } = body;

    if (!orderNumber || !customer?.fullName || !items?.length) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const shipping_address = buildShippingRecord(orderNumber, paymentMethod, customer);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId ?? null,
        status: "pending",
        total_amount: total,
        shipping_address,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: orderError?.message ?? "Error al crear orden" }, { status: 500 });
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, orderId: order.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}