"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { buildMapUrl } from "@/lib/checkout";
import {
  DEFAULT_DELIVERY_LAT,
  DEFAULT_DELIVERY_LNG,
  isDefaultCoords,
} from "@/lib/delivery-location-cache";
import { saveProfileDeliveryLocation } from "@/lib/profile-delivery";

const DeliveryMap = dynamic(() => import("@/components/DeliveryMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-40 items-center justify-center rounded-2xl border border-neon-cyan/20 bg-surface text-xs text-zinc-500">
      Cargando mapa…
    </div>
  ),
});

function toCoord(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export default function DireccionesPage() {
  const { user, profile, loading, refresh } = useAuth();
  const supabase = useMemo(() => createSupabaseClient(), []);

  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [lat, setLat] = useState(DEFAULT_DELIVERY_LAT);
  const [lng, setLng] = useState(DEFAULT_DELIVERY_LNG);
  const [mapMounted, setMapMounted] = useState(false);
  const [preferSavedLocation, setPreferSavedLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (loading || !user) return;
    if (hydratedRef.current) return;

    const profileLat = profile?.default_lat;
    const profileLng = profile?.default_lng;
    const hasCoords = profileLat != null && profileLng != null;

    setAddress(profile?.default_address ?? "");
    setNotes(profile?.address_notes ?? "");
    setLat(hasCoords ? toCoord(profileLat, DEFAULT_DELIVERY_LAT) : DEFAULT_DELIVERY_LAT);
    setLng(hasCoords ? toCoord(profileLng, DEFAULT_DELIVERY_LNG) : DEFAULT_DELIVERY_LNG);
    setPreferSavedLocation(hasCoords);
    setMapMounted(true);
    hydratedRef.current = true;
  }, [loading, user, profile]);

  const handleMapChange = useCallback((a: number, b: number) => {
    setLat(a);
    setLng(b);
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (!address.trim()) {
      setMessage("Escribe la dirección antes de guardar");
      return;
    }
    if (isDefaultCoords(lat, lng)) {
      setMessage("Marca tu ubicación en el mapa antes de guardar");
      return;
    }

    setSaving(true);
    setMessage(null);

    const result = await saveProfileDeliveryLocation(supabase, {
      address: address.trim(),
      notes: notes.trim() || undefined,
      lat,
      lng,
      fullName: profile?.full_name ?? undefined,
      phone: profile?.phone ?? undefined,
      preferredPayment: profile?.preferred_payment ?? undefined,
    });

    setSaving(false);
    if (!result.ok) {
      setMessage(result.error ?? "No se pudo guardar");
      return;
    }

    await refresh();
    setPreferSavedLocation(true);
    setMessage("Dirección guardada en tu cuenta");
  }

  if (loading || !mapMounted) {
    return (
      <div className="rounded-2xl border border-glass glass-surface p-6 text-sm text-zinc-500">
        Cargando tu dirección…
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-4 rounded-2xl border border-glass glass-surface p-6">
      <h2 className="text-lg font-semibold text-white">Dirección de entrega</h2>
      <p className="text-xs text-zinc-500">
        Ajusta el pin en el mapa y pulsa guardar. La ubicación queda asignada a tu cuenta.
      </p>
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
        key={`direcciones-map-${user?.id ?? "anon"}`}
        lat={lat}
        lng={lng}
        onChange={handleMapChange}
        preferSavedLocation={preferSavedLocation}
      />
      <p className="text-xs text-zinc-500">
        <a href={buildMapUrl(lat, lng)} target="_blank" rel="noreferrer" className="text-neon-cyan">
          Ver en mapa
        </a>
      </p>
      {message && (
        <p className={`text-sm ${message.includes("guardad") ? "text-neon-cyan" : "text-red-400"}`}>
          {message}
        </p>
      )}
      <button type="submit" className="btn-neon px-6 py-2.5 text-sm" disabled={saving}>
        {saving ? "Guardando…" : "Guardar dirección"}
      </button>
    </form>
  );
}