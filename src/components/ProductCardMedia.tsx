"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { categoryIcon } from "@/lib/store";

type Props = {
  images: string[];
  name: string;
  categorySlug: string;
  gradient: string;
  productHref: string;
  stock: number;
};

export function ProductCardMedia({
  images,
  name,
  categorySlug,
  gradient,
  productHref,
  stock,
}: Props) {
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCycle = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setHovering(false);
    setIndex(0);
  }, []);

  const startCycle = useCallback(() => {
    if (images.length <= 1) return;
    setHovering(true);
    intervalRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 850);
  }, [images.length]);

  const cover = images[0] ?? null;

  return (
    <Link
      href={productHref}
      className="block"
      onMouseEnter={startCycle}
      onMouseLeave={stopCycle}
      onFocus={startCycle}
      onBlur={stopCycle}
    >
      <div
        className={`relative aspect-[4/3] overflow-hidden bg-zinc-950/70 bg-gradient-to-br ${gradient}`}
      >
        <div className="product-overlay absolute inset-0 z-[1] pointer-events-none" />

        {cover ? (
          <div className="absolute inset-0 z-0 p-2 sm:p-3">
            <div className="relative h-full w-full">
              {images.map((url, i) => (
                <ProductImage
                  key={`${url}-${i}`}
                  src={url}
                  alt={name}
                  fill
                  fit="contain"
                  className={`transition-all duration-500 ease-out ${
                    i === index ? "opacity-100 scale-100" : "opacity-0 scale-[0.97]"
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <span className="absolute inset-0 z-[2] flex items-center justify-center text-5xl opacity-60 transition group-hover:scale-110 group-hover:opacity-90">
            {categoryIcon(categorySlug)}
          </span>
        )}

        {images.length > 1 && (
          <>
            <span className="absolute bottom-3 right-3 z-[2] rounded-full border border-white/20 bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white">
              {hovering ? `${index + 1}/${images.length}` : `+${images.length - 1} fotos`}
            </span>
            <div className="absolute bottom-3 left-3 z-[2] flex gap-1">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === index ? "w-4 bg-neon-cyan" : "w-1.5 bg-white/30"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {stock <= 0 ? (
          <span className="absolute left-3 top-3 z-[2] rounded-full border border-zinc-500/40 bg-zinc-800/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
            agotado
          </span>
        ) : stock <= 3 ? (
          <span className="absolute left-3 top-3 z-[2] rounded-full border border-amber-400/30 bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
            últimas unidades
          </span>
        ) : null}
      </div>
    </Link>
  );
}