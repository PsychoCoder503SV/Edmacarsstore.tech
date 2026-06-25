import Link from "next/link";

type BrandLogoProps = {
  size?: "sm" | "md" | "lg" | "hero";
  linked?: boolean;
  showName?: boolean;
  className?: string;
};

const nameSizes = {
  sm: "text-2xl sm:text-3xl",
  md: "text-3xl sm:text-4xl",
  lg: "text-4xl sm:text-5xl md:text-6xl",
  hero: "text-5xl sm:text-7xl md:text-8xl",
};

export function BrandLogo({
  size = "md",
  linked = false,
  showName = true,
  className = "",
}: BrandLogoProps) {
  const content = (
    <div className={`inline-flex items-center ${className}`.trim()}>
      {showName && (
        <span
          className={`font-brand leading-none tracking-[0.08em] text-white drop-shadow-[0_0_28px_rgba(0,245,255,0.35)] ${nameSizes[size]}`}
        >
          EDMA<span className="text-neon-cyan drop-shadow-[0_0_32px_rgba(0,245,255,0.55)]">CARS</span>
        </span>
      )}
    </div>
  );

  if (linked) {
    return (
      <Link href="/" className="inline-flex shrink-0 items-center transition hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}