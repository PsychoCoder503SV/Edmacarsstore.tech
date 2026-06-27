import type { CustomerProfile } from "@/lib/auth";
import {
  isDefaultCoords,
  loadDeliveryLocationCache,
  saveDeliveryLocationCache,
} from "@/lib/delivery-location-cache";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ProfileDeliveryInput = {
  address: string;
  notes?: string;
  lat?: number | null;
  lng?: number | null;
  fullName?: string;
  phone?: string;
  preferredPayment?: string;
};

export async function getAccessToken(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function saveProfileDeliveryLocation(
  supabase: SupabaseClient,
  input: ProfileDeliveryInput
): Promise<{ ok: boolean; error?: string }> {
  const token = await getAccessToken(supabase);
  if (!token) return { ok: false, error: "Inicia sesión para guardar tu dirección." };

  const res = await fetch("/api/account/delivery-location", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.error ?? "No se pudo guardar" };

  const hasCoords =
    input.lat != null && input.lng != null && !isDefaultCoords(input.lat, input.lng);
  if (hasCoords) {
    saveDeliveryLocationCache({
      lat: input.lat!,
      lng: input.lng!,
      address: input.address,
      notes: input.notes,
      mapOnboardingDone: true,
    });
  }

  return { ok: true };
}

/** Si el perfil no tiene mapa pero el navegador sí, lo asigna al usuario. */
export async function syncBrowserCacheToProfile(
  supabase: SupabaseClient,
  profile: CustomerProfile | null,
  extra?: Partial<ProfileDeliveryInput>
): Promise<boolean> {
  const hasProfileLocation =
    profile?.default_lat != null &&
    profile?.default_lng != null &&
    profile.default_address?.trim();

  if (hasProfileLocation) return false;

  const cache = loadDeliveryLocationCache();
  if (!cache?.mapOnboardingDone || isDefaultCoords(cache.lat, cache.lng)) return false;

  const address = extra?.address?.trim() || cache.address?.trim() || "";
  if (!address) return false;

  const result = await saveProfileDeliveryLocation(supabase, {
    address,
    notes: extra?.notes?.trim() || cache.notes,
    lat: cache.lat,
    lng: cache.lng,
    fullName: extra?.fullName,
    phone: extra?.phone,
    preferredPayment: extra?.preferredPayment,
  });

  return result.ok;
}