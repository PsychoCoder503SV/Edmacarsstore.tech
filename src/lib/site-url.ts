/** URL pública de la tienda (correos, links externos). */
export function getPublicSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null,
  ];

  for (const raw of candidates) {
    const value = raw?.trim().replace(/\/$/, "");
    if (!value) continue;
    if (value.startsWith("http://") || value.startsWith("https://")) return value;
    return `https://${value}`;
  }

  return "https://edmacarsstore-tech.vercel.app";
}

export function buildOrderTrackUrl(orderNumber: string, trackToken?: string): string {
  const base = `${getPublicSiteUrl()}/pedido/seguimiento`;
  const params = new URLSearchParams({ orden: orderNumber });
  if (trackToken) params.set("t", trackToken);
  return `${base}?${params.toString()}`;
}