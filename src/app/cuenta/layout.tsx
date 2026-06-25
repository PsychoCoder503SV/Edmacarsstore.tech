"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AccountNav } from "@/components/AccountNav";
import { useAuth } from "@/lib/auth";

export default function CuentaLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isAcceder = pathname === "/cuenta/acceder";

  useEffect(() => {
    if (!loading && !user && !isAcceder) {
      router.replace("/cuenta/acceder");
    }
  }, [loading, user, isAcceder, router]);

  if (isAcceder) {
    return <>{children}</>;
  }

  if (loading || !user) {
    return (
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-zinc-500">
          Cargando cuenta…
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/" className="text-xs text-neon-cyan hover:text-white">
          ← Volver a la tienda
        </Link>
        <h1 className="mt-4 font-brand text-3xl text-white">
          MI <span className="text-neon-cyan">CUENTA</span>
        </h1>
        <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
          <AccountNav />
          <div>{children}</div>
        </div>
      </section>
    </main>
  );
}