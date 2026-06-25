import { CartPageClient } from "@/components/CartPageClient";

export default function CarritoPage() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-brand text-3xl tracking-wide text-white">
          TU <span className="text-neon-cyan">CARRITO</span>
        </h1>
        <p className="mt-2 text-sm text-zinc-500">Revisa tus productos antes de confirmar</p>
        <CartPageClient />
      </section>
    </main>
  );
}