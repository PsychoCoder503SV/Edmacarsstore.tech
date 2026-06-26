"use client";

import { useState } from "react";
import { ProductImage } from "@/components/ProductImage";

type Props = {
  images: string[];
  name: string;
};

export function ProductGallery({ images, name }: Props) {
  const [active, setActive] = useState(0);
  const list = images.length > 0 ? images : [];

  if (list.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-glass glass-surface text-6xl opacity-40">
        📦
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-glass bg-zinc-950/70 glass-surface-elevated">
        <div className="absolute inset-0 p-3 sm:p-4">
          <div className="relative h-full w-full">
            <ProductImage src={list[active]} alt={name} fill fit="contain" priority />
          </div>
        </div>
      </div>
      {list.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
          {list.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={`relative aspect-square overflow-hidden rounded-lg border bg-zinc-950/60 transition ${
                active === index
                  ? "border-neon-cyan ring-1 ring-neon-cyan/40"
                  : "border-white/10 opacity-70 hover:opacity-100"
              }`}
            >
              <div className="absolute inset-0 p-1">
                <div className="relative h-full w-full">
                  <ProductImage src={url} alt={`${name} ${index + 1}`} fill fit="contain" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}