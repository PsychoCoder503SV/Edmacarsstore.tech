"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const links = [
  { href: "/cuenta", label: "Resumen" },
  { href: "/cuenta/perfil", label: "Mi perfil" },
  { href: "/cuenta/direcciones", label: "Direcciones" },
  { href: "/cuenta/pedidos", label: "Mis pedidos" },
];

export function AccountNav() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <nav className="space-y-1 rounded-2xl border border-glass glass-surface p-3">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`block rounded-xl px-4 py-2.5 text-sm transition ${
              active
                ? "bg-neon-cyan/10 font-medium text-neon-cyan"
                : "text-zinc-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => signOut()}
        className="mt-2 w-full rounded-xl px-4 py-2.5 text-left text-sm text-zinc-500 transition hover:bg-white/5 hover:text-red-400"
      >
        Cerrar sesión
      </button>
    </nav>
  );
}