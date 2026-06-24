import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  size?: "sm" | "md" | "lg" | "hero";
  linked?: boolean;
  className?: string;
};

const sizes = {
  sm: { width: 120, height: 40, className: "h-8 w-auto sm:h-9" },
  md: { width: 160, height: 52, className: "h-10 w-auto sm:h-11" },
  lg: { width: 220, height: 72, className: "h-14 w-auto sm:h-16" },
  hero: { width: 320, height: 104, className: "h-20 w-auto sm:h-28 md:h-32" },
};

export function BrandLogo({ size = "md", linked = false, className = "" }: BrandLogoProps) {
  const config = sizes[size];
  const image = (
    <Image
      src="/logo.png"
      alt="Edmacars Store"
      width={config.width}
      height={config.height}
      className={`${config.className} ${className}`.trim()}
      priority={size === "hero"}
    />
  );

  if (linked) {
    return (
      <Link href="/" className="inline-flex shrink-0 items-center">
        {image}
      </Link>
    );
  }

  return image;
}