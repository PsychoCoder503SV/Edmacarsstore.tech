"use client";

import { BrandLogo } from "@/components/BrandLogo";
import { CartBadge } from "@/components/CartBadge";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/#categorias", label: "Categorías", hash: "categorias" },
  { href: "/catalogo?filter=ofertas", label: "Ofertas" },
];

export function Header() {
  const { user } = useAuth();
  const pathname = usePathname();

  function scrollToHash(hash: string) {
    const el = document.getElementById(hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(null, "", `#${hash}`);
    }
  }

  return (
    <header className="header-blur sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <BrandLogo size="sm" linked showName />

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"
              onClick={
                link.hash && pathname === "/"
                  ? (e) => {
                      e.preventDefault();
                      scrollToHash(link.hash!);
                    }
                  : undefined
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href={user ? "/cuenta" : "/cuenta/acceder"}
            aria-label={user ? "Mi cuenta" : "Acceder"}
            className="inline-flex min-h-10 min-w-10 items-center justify-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-2 text-sm text-zinc-400 transition hover:border-neon-cyan/40 hover:text-neon-cyan sm:min-h-0 sm:min-w-0 sm:px-3"
          >
            <UserIcon className="h-[18px] w-[18px] shrink-0 sm:hidden" />
            <span className="hidden sm:inline">{user ? "Mi cuenta" : "Acceder"}</span>
          </Link>
          <button
            type="button"
            aria-label="Buscar"
            className="rounded-lg border border-white/10 p-2 text-zinc-400 transition hover:border-neon-cyan/40 hover:text-neon-cyan"
          >
            <SearchIcon />
          </button>
          <CartBadge />
        </div>
      </div>
    </header>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}