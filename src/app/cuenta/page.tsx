"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { PAYMENT_LABELS, type PaymentMethod } from "@/lib/checkout";

export default function CuentaResumenPage() {
  const { user, profile } = useAuth();

  const paymentLabel =
    profile?.preferred_payment &&
    profile.preferred_payment in PAYMENT_LABELS
      ? PAYMENT_LABELS[profile.preferred_payment as PaymentMethod]
      : "Sin configurar";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-glass glass-surface-elevated p-6">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Bienvenido</p>
        <h2 className="mt-1 text-xl font-semibold text-white">
          {profile?.full_name ?? user?.email ?? "Cliente"}
        </h2>
        <p className="mt-2 text-sm text-zinc-400">{user?.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 p-4">
          <p className="text-xs text-zinc-500">Teléfono</p>
          <p className="mt-1 text-sm text-white">{profile?.phone ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-white/10 p-4">
          <p className="text-xs text-zinc-500">Pago preferido</p>
          <p className="mt-1 text-sm text-white">{paymentLabel}</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 p-4">
        <p className="text-xs text-zinc-500">Dirección principal</p>
        <p className="mt-1 text-sm text-zinc-300">{profile?.default_address ?? "Sin dirección guardada"}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/cuenta/perfil" className="btn-neon-outline px-4 py-2 text-sm">
          Editar perfil
        </Link>
        <Link href="/cuenta/direcciones" className="btn-neon-outline px-4 py-2 text-sm">
          Mis direcciones
        </Link>
        <Link href="/cuenta/pedidos" className="btn-neon px-4 py-2 text-sm">
          Ver pedidos
        </Link>
      </div>
    </div>
  );
}