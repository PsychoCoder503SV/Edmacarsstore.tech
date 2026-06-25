export type ProductDescriptionData = {
  text: string;
  gallery: string[];
};

export function parseProductDescription(raw: string | null): ProductDescriptionData {
  if (!raw) return { text: "", gallery: [] };
  try {
    const parsed = JSON.parse(raw) as Partial<ProductDescriptionData>;
    if (parsed && typeof parsed.text === "string") {
      return {
        text: parsed.text,
        gallery: Array.isArray(parsed.gallery)
          ? parsed.gallery.filter((u): u is string => typeof u === "string" && u.length > 0)
          : [],
      };
    }
  } catch {
    /* texto plano legacy */
  }
  return { text: raw, gallery: [] };
}

export function resolveGallery(
  imageUrl: string | null,
  description: string | null,
  galleryUrls?: string[] | null
): string[] {
  if (galleryUrls && galleryUrls.length > 0) return galleryUrls;
  const { gallery } = parseProductDescription(description);
  if (gallery.length > 0) return gallery;
  if (imageUrl) return [imageUrl];
  return [];
}

export function productDisplayDescription(description: string | null): string {
  return parseProductDescription(description).text;
}