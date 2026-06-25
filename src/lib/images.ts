import type { Product } from "@/lib/database.types";
import { resolveGallery } from "@/lib/product-description";

export function productImages(product: Product): string[] {
  return resolveGallery(product.image_url, product.description, product.gallery_urls);
}

export function productCover(product: Product): string | null {
  return productImages(product)[0] ?? null;
}