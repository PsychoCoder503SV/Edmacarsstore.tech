import {
  buildShippingRecord,
  formatOrderMessage,
  type CheckoutCustomer,
  type PaymentMethod,
} from "@/lib/checkout";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { notifyStoreTelegram } from "@/lib/telegram-server";
import { NextResponse } from "next/server";

type OrderItemPayload = {
  productId: string;
  quantity: number;
  unitPrice: number;
  name: string;
};

type OrderPayload = {
  orderNumber: string;
  paymentMethod: PaymentMethod;
  customer: CheckoutCustomer;
  items: OrderItemPayload[];
  total: number;
  userId?: string | null;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function resolveOrderUserId(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  userId: string | null | undefined,
  customerName: string
): Promise<string | null> {
  const id = typeof userId === "string" ? userId.trim() : "";
  if (!id || !UUID_RE.test(id)) return null;

  const { error } = await supabase.from("profiles").upsert(
    { id, full_name: customerName, role: "customer" },
    { onConflict: "id" }
  );

  return error ? null : id;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OrderPayload;
    const { orderNumber, paymentMethod, customer, items, total, userId } = body;

    if (!orderNumber || !customer?.fullName || !items?.length) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const shipping_address = buildShippingRecord(orderNumber, paymentMethod, customer);
    const resolvedUserId = await resolveOrderUserId(supabase, userId, customer.fullName);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: resolvedUserId,
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

    const message = formatOrderMessage(
      orderNumber,
      paymentMethod,
      customer,
      items.map((i) => ({
        id: i.productId,
        slug: i.productId,
        name: i.name,
        price: i.unitPrice,
        quantity: i.quantity,
        image: null,
        stock: 0,
      })),
      total
    );

    await notifyStoreTelegram(message);

    return NextResponse.json({ ok: true, orderId: order.id, orderNumber });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}