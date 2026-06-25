"use client";

import Image from "next/image";
import { useState } from "react";

type ProductImageProps = {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

export function ProductImage({ src, alt, fill, className, sizes, priority }: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={className}
        style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" } : undefined}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
    />
  );
}