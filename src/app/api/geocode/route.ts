import { NextResponse } from "next/server";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "EdmacarsStore/1.0 (checkout geocode)";

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
};

export async function GET(request: Request) {
  try {
    const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (q.length < 3) {
      return NextResponse.json({ results: [] });
    }

    const params = new URLSearchParams({
      q,
      format: "json",
      limit: "6",
      countrycodes: "sv",
      addressdetails: "0",
    });

    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "No se pudo buscar la ubicación" }, { status: 502 });
    }

    const data = (await res.json()) as NominatimResult[];
    const results = data.map((row) => ({
      lat: Number(row.lat),
      lng: Number(row.lon),
      label: row.display_name,
    }));

    return NextResponse.json(
      { results },
      { headers: { "Cache-Control": "private, max-age=300" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}