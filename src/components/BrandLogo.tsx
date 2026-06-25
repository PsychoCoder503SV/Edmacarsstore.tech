import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  size?: "sm" | "md" | "lg" | "hero";
  linked?: boolean;
  showName?: boolean;
  className?: string;
};

const sizes = {
  sm: { width: 120, height: 40, className: "h-8 w-auto sm:h-9" },
  md: { width: 160, height: 52, className: "h-10 w-auto sm:h-11" },
  lg: { width: 220, height: 72, className: "h-14 w-auto sm:h-16" },
  hero: { width: 320, height: 104, className: "h-16 w-auto sm:h-24 md:h-28" },
};

const nameSizes = {
  sm: "text-lg sm:text-xl",
  md: "text-xl sm:text-2xl",
  lg: "text-2xl sm:text-3xl",
  hero: "text-3xl sm:text-5xl md:text-6xl",
};

export function BrandLogo({
  size = "md",
  linked = false,
  showName = false,
  className = "",
}: BrandLogoProps) {
  const config = sizes[size];

  const content = (
    <div className={`inline-flex items-center gap-2 sm:gap-3 ${className}`.trim()}>
      <Image
        src="/logo.png"
        alt="Edmacars"
        width={config.width}
        height={config.height}
        className={config.className}
        priority={size === "hero"}
      />
      {showName && (
        <span className={`font-brand leading-none tracking-wider text-white ${nameSizes[size]}`}>
          EDMA<span className="text-neon-cyan">CARS</span>
        </span>
      )}
    </div>
  );

  if (linked) {
    return (
      <Link href="/" className="inline-flex shrink-0 items-center">
        {content}
      </Link>
    );
  }

  return content;
}