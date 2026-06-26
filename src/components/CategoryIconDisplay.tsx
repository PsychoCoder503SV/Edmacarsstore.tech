import type { Category } from "@/lib/database.types";
import { categoryIcon } from "@/lib/store";
import Image from "next/image";

type Props = {
  category: Pick<Category, "slug" | "icon_url">;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  sm: { box: "h-10 w-10", emoji: "text-2xl", img: 40 },
  md: { box: "h-14 w-14", emoji: "text-3xl", img: 56 },
  lg: { box: "h-20 w-20", emoji: "text-5xl", img: 80 },
};

export function CategoryIconDisplay({ category, size = "md", className = "" }: Props) {
  const s = sizeMap[size];

  if (category.icon_url) {
    const isSvg = /\.svg(\?|$)/i.test(category.icon_url);
    return (
      <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 ${s.box} ${className}`}>
        {isSvg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={category.icon_url} alt="" className="h-full w-full object-contain p-1" />
        ) : (
          <Image
            src={category.icon_url}
            alt=""
            fill
            className="object-contain p-1"
            sizes={`${s.img}px`}
          />
        )}
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center justify-center ${s.emoji} ${className}`}>
      {categoryIcon(category.slug)}
    </span>
  );
}