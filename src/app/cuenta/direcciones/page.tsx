"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { buildMapUrl } from "@/lib/checkout";
import {
  DEFAULT_DELIVERY_LAT,
  DEFAULT_DELIVERY_LNG,
  saveDeliveryLocationCache,
} from "@/lib/delivery-location-cache";

const DeliveryMap = dynamic(() => import("@/components/DeliveryMap"), { ssr: false });

export default function DireccionesPage() {
  const { user, profile, refresh } = useAuth();
  const supabase = createSupabaseClient();

  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [lat, setLat] = useState(DEFAULT_DELIVERY_LAT);
  const [lng, setLng] = useState(DEFAULT_DELIVERY_LNG);
  const hasSavedMapLocation = profile?.default_lat != null && profile?.default_lng != null;
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setAddress(profile?.default_address ?? "");
    setNotes(profile?.address_notes ?? "");
    if (profile?.default_lat != null) setLat(profile.default_lat);
    if (profile?.default_lng != null) setLng(profile.default_lng);
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      default_address: address.trim(),
      address_notes: notes.trim(),
      default_lat: lat,
      default_lng: lng,
      role: "customer",
    });

    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    await refresh();
    saveDeliveryLocationCache({
      lat,
      lng,
      address: address.trim(),
      notes: notes.trim(),
      mapOnboardingDone: true,
    });
    setMessage("Dirección guardada");
  }

  return (
    <form onSubmit={handleSave} className="space-y-4 rounded-2xl border border-glass glass-surface p-6">
      <h2 className="text-lg font-semibold text-white">Dirección de entrega</h2>
      <textarea
        className="checkout-input min-h-20"
        placeholder="Calle, número, colonia, municipio…"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <textarea
        className="checkout-input min-h-16"
        placeholder="Referencias (opcional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <DeliveryMap
        lat={lat}
        lng={lng}
        onChange={(a, b) => {
          setLat(a);
          setLng(b);
        }}
        preferSavedLocation={hasSavedMapLocation}
      />
      <p className="text-xs text-zinc-500">
        <a href={buildMapUrl(lat, lng)} target="_blank" rel="noreferrer" className="text-neon-cyan">
          Ver en mapa
        </a>
      </p>
      {message && <p className="text-sm text-neon-cyan">{message}</p>}
      <button type="submit" className="btn-neon px-6 py-2.5 text-sm" disabled={saving}>
        {saving ? "Guardando…" : "Guardar dirección"}
      </button>
    </form>
  );
}