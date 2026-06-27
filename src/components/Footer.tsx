import { BrandLogo } from "@/components/BrandLogo";
import Link from "next/link";

const COMPANY_VALUES = [
  {
    title: "Integridad",
    description: "Actuamos con honestidad y transparencia en cada negociación.",
  },
  {
    title: "Responsabilidad",
    description: "Cumplimos nuestros compromisos con clientes, proveedores y colaboradores.",
  },
  {
    title: "Calidad",
    description: "Buscamos ofrecer productos y servicios que satisfagan las expectativas de nuestros clientes.",
  },
  {
    title: "Compromiso",
    description: "Trabajamos con dedicación para alcanzar los objetivos de la empresa y de nuestros clientes.",
  },
  {
    title: "Innovación",
    description: "Buscamos constantemente nuevas oportunidades y mejores soluciones para el mercado.",
  },
  {
    title: "Trabajo en equipo",
    description: "Fomentamos la colaboración y el respeto entre todos los miembros de la organización.",
  },
  {
    title: "Orientación al cliente",
    description: "Las necesidades de nuestros clientes son el centro de nuestras decisiones.",
  },
  {
    title: "Excelencia",
    description: "Procuramos mejorar continuamente nuestros procesos y resultados.",
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 text-center sm:mb-8">
          <div className="mb-3 text-xs uppercase tracking-[0.25em] text-neon-cyan/70">
            Nuestros valores
          </div>
          <h3 className="mb-2 font-brand text-2xl tracking-tight text-white sm:text-3xl">
            Lo que nos define
          </h3>
          <p className="mx-auto max-w-md text-sm text-white/60 sm:text-base">
            Edmacars se caracteriza por su alto grado de espíritu de servicio profesional y
            empresarial.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {COMPANY_VALUES.map((value) => (
            <div
              key={value.title}
              className="group rounded-xl border border-white/10 bg-white/[0.02] p-6 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.04]"
            >
              <div className="mb-3 text-lg font-semibold tracking-tight text-white transition-colors group-hover:text-neon-cyan">
                {value.title}
              </div>
              <p className="text-sm leading-relaxed text-white/70">{value.description}</p>
            </div>
          ))}
        </div>

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