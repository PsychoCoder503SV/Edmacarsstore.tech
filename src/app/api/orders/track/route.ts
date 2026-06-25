import {
  ORDER_NUMBER_RE,
  normalizeOrderNumber,
  parseShippingAddress,
} from "@/lib/order-tracking";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

type TrackBody = {
  orderNumber?: string;
  email?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TrackBody;
    const orderNumber = normalizeOrderNumber(body.orderNumber ?? "");
    const email = body.email?.trim().toLowerCase() ?? "";

    if (!ORDER_NUMBER_RE.test(orderNumber)) {
      return NextResponse.json(
        { error: "Número de orden inválido. Ejemplo: EDMA-20260625-1234" },
        { status: 400 }
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Ingresa el email que usaste en el pedido" }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();

    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        created_at,
        status,
        total_amount,
        shipping_address,
        order_items (
          quantity,
          unit_price,
          products ( name, slug )
        )
      `
      )
      .ilike("shipping_address", `%${orderNumber}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("[track]", error.message);
      return NextResponse.json({ error: "No se pudo consultar el pedido" }, { status: 500 });
    }

    const match = (orders ?? []).find((row) => {
      const meta = parseShippingAddress(row.shipping_address as string);
      return meta?.order_number === orderNumber && meta.email?.toLowerCase() === email;
    });

    if (!match) {
      return NextResponse.json(
        {
          error:
            "No encontramos un pedido con ese número y email. Revisa los datos o contáctanos por WhatsApp.",
        },
        { status: 404 }
      );
    }

    const meta = parseShippingAddress(match.shipping_address as string);

    const items = (
      (match.order_items as {
        quantity: number;
        unit_price: number;
        products: { name: string; slug: string } | { name: string; slug: string }[] | null;
      }[]) ?? []
    ).map((item) => {
      const product = Array.isArray(item.products) ? item.products[0] : item.products;
      return {
        name: product?.name ?? "Producto",
        slug: product?.slug ?? null,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
      };
    });

    return NextResponse.json({
      order: {
        orderNumber: meta?.order_number ?? orderNumber,
        status: match.status,
        createdAt: match.created_at,
        total: Number(match.total_amount),
        paymentMethod: meta?.payment_method ?? null,
        customerName: meta?.customer_name ?? null,
        address: meta?.address ?? null,
        mapUrl: meta?.map_url ?? null,
        items,
      },
    });
  } catch (err) {
    console.error("[track]", err);
    return NextResponse.json({ error: "Error al consultar el pedido" }, { status: 500 });
  }
}