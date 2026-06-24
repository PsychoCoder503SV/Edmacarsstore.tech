import Link from "next/link";

const navLinks = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/catalogo?filter=nuevo", label: "Novedades" },
  { href: "/catalogo?filter=ofertas", label: "Ofertas" },
];

export function Header() {
  return (
    <header className="header-blur sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2">
          <span className="font-brand text-xl tracking-wider text-white sm:text-2xl">
            EDMA<span className="text-neon-cyan">CARS</span>
          </span>
          <span className="hidden rounded border border-neon-magenta/40 bg-neon-magenta/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-neon-magenta sm:inline">
            Store
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            aria-label="Buscar"
            className="rounded-lg border border-white/10 p-2 text-zinc-400 transition hover:border-neon-cyan/40 hover:text-neon-cyan"
          >
            <SearchIcon />
          </button>
          <Link
            href="/carrito"
            className="relative rounded-lg border border-white/10 p-2 text-zinc-400 transition hover:border-neon-magenta/40 hover:text-neon-magenta"
            aria-label="Carrito"
          >
            <CartIcon />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-neon-magenta text-[10px] font-bold text-white">
              0
            </span>
          </Link>
          <Link
            href="/auth/login"
            className="hidden rounded-lg bg-gradient-to-r from-neon-cyan/20 to-neon-magenta/20 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/10 transition hover:from-neon-cyan/30 hover:to-neon-magenta/30 sm:inline-block"
          >
            Ingresar
          </Link>
        </div>
      </div>
    </header>
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

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}