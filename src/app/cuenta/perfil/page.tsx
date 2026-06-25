"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { PAYMENT_LABELS, type PaymentMethod } from "@/lib/checkout";

const PAYMENT_OPTIONS = Object.entries(PAYMENT_LABELS).filter(
  ([k]) => k === "contra_entrega" || k === "transferencia"
) as [PaymentMethod, string][];

export default function PerfilPage() {
  const { user, profile, refresh } = useAuth();
  const supabase = createSupabaseClient();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredPayment, setPreferredPayment] = useState<PaymentMethod>("contra_entrega");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
    if (profile?.preferred_payment === "transferencia" || profile?.preferred_payment === "contra_entrega") {
      setPreferredPayment(profile.preferred_payment);
    }
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName.trim(),
      phone: phone.trim(),
      preferred_payment: preferredPayment,
      role: "customer",
    });

    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    await refresh();
    setMessage("Perfil actualizado");
  }

  return (
    <form onSubmit={handleSave} className="space-y-4 rounded-2xl border border-glass glass-surface p-6">
      <h2 className="text-lg font-semibold text-white">Información personal</h2>
      <input
        className="checkout-input"
        placeholder="Nombre completo"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />
      <input className="checkout-input" value={user?.email ?? ""} disabled />
      <input
        className="checkout-input"
        placeholder="Teléfono"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <div>
        <p className="mb-2 text-sm text-zinc-400">Método de pago preferido</p>
        <select
          className="checkout-input"
          value={preferredPayment}
          onChange={(e) => setPreferredPayment(e.target.value as PaymentMethod)}
        >
          {PAYMENT_OPTIONS.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {message && <p className="text-sm text-neon-cyan">{message}</p>}
      <button type="submit" className="btn-neon px-6 py-2.5 text-sm" disabled={saving}>
        {saving ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}