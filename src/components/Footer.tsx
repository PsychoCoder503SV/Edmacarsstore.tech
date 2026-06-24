import { BrandLogo } from "@/components/BrandLogo";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <BrandLogo size="sm" />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-500">
              Tecnología de primera mano y accesorios. Envíos en El Salvador con atención personalizada.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Enlaces
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-zinc-500">
              <li>
                <Link href="/catalogo" className="transition hover:text-neon-cyan">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link href="/carrito" className="transition hover:text-neon-cyan">
                  Carrito
                </Link>
              </li>
              <li>
                <Link href="/auth/registro" className="transition hover:text-neon-cyan">
                  Crear cuenta
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Contacto
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-zinc-500">
              <li>San Salvador, El Salvador</li>
              <li>
                <a href="mailto:info@edmacars.com" className="transition hover:text-neon-magenta">
                  info@edmacars.com
                </a>
              </li>
              <li className="text-xs text-zinc-600">WhatsApp al confirmar pedido</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-xs text-zinc-600 sm:flex-row">
          <p>© {new Date().getFullYear()} Edmacars Import and Sales, S.A. de C.V.</p>
          <p className="rounded-full border border-neon-cyan/20 bg-neon-cyan/5 px-3 py-1 text-neon-cyan/80">
            Modo local · sin producción
          </p>
        </div>
      </div>
    </footer>
  );
}