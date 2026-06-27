"use client";

import { usePathname } from "next/navigation";

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

export function FooterValues() {
  const pathname = usePathname();
  if (pathname !== "/") return null;

  return (
    <>
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

      <div className="mb-2 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
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
    </>
  );
}