"use client";

type ProductImageProps = {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
};

export function ProductImage({
  src,
  alt,
  fill,
  className = "",
  priority,
  fit = "contain",
}: ProductImageProps) {
  return (
    // Supabase storage: img nativo evita fallos del optimizador de Next.js
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={className}
      style={
        fill
          ? {
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: fit,
              objectPosition: "center",
            }
          : undefined
      }
    />
  );
}