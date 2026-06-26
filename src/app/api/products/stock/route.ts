import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  try {
    const idsParam = new URL(request.url).searchParams.get("ids") ?? "";
    const ids = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter((id) => UUID_RE.test(id));

    if (!ids.length) {
      return NextResponse.json({ stocks: {} as Record<string, number> });
    }

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase.from("products").select("id, stock").in("id", ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const stocks: Record<string, number> = {};
    for (const row of data ?? []) {
      stocks[row.id] = Number(row.stock);
    }

    return NextResponse.json(
      { stocks },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}