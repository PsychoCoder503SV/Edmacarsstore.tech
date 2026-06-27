import { BrandLogo } from "@/components/BrandLogo";
import { FooterValues } from "@/components/FooterValues";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <FooterValues />

        <div className="mt-10 grid gap-10 border-t border-white/10 pt-10 md:grid-cols-3">
          <div>
            <BrandLogo size="sm" showName />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-500">
              Tecnología de primera mano y accesorios. Envíos en El Salvador con atención
              personalizada.
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
                <Link href="/pedido/seguimiento" className="transition hover:text-neon-cyan">
                  Seguimiento de pedido
                </Link>
              </li>
              <li>
                <Link href="/cuenta/pedidos" className="transition hover:text-neon-cyan">
                  Mis pedidos (cuenta)
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
              <li className="text-xs text-zinc-600">Atención personalizada</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-8 text-center text-sm leading-relaxed text-white/40">
          <p>
            © {new Date().getFullYear()}{" "}
            <span className="font-medium tracking-[0.08em] text-red-500">
              EDMACAR&apos;S IMPORT &amp; SALES S.A. DE C.V.
            </span>{" "}
            Todos los derechos reservados.
            <br />
            Calidad y servicio personalizado en cada entrega.
          </p>
        </div>
      </div>
    </footer>
  );
}