const STORAGE_KEY = "edmacars_delivery_location";

export const DEFAULT_DELIVERY_LAT = 13.798;
export const DEFAULT_DELIVERY_LNG = -88.91;

export type DeliveryLocationCache = {
  lat: number;
  lng: number;
  address?: string;
  notes?: string;
  mapOnboardingDone: boolean;
  updatedAt: string;
};

export function isDefaultCoords(lat: number, lng: number): boolean {
  return (
    Math.abs(lat - DEFAULT_DELIVERY_LAT) < 0.002 && Math.abs(lng - DEFAULT_DELIVERY_LNG) < 0.002
  );
}

export function loadDeliveryLocationCache(): DeliveryLocationCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as DeliveryLocationCache;
    if (typeof data.lat !== "number" || typeof data.lng !== "number") return null;
    return data;
  } catch {
    return null;
  }
}

export function saveDeliveryLocationCache(
  input: Partial<DeliveryLocationCache> & { lat: number; lng: number }
): void {
  if (typeof window === "undefined") return;
  const prev = loadDeliveryLocationCache();
  const next: DeliveryLocationCache = {
    lat: input.lat,
    lng: input.lng,
    address: input.address?.trim() || prev?.address,
    notes: input.notes?.trim() || prev?.notes,
    mapOnboardingDone:
      input.mapOnboardingDone ??
      prev?.mapOnboardingDone ??
      !isDefaultCoords(input.lat, input.lng),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function markMapOnboardingDone(): void {
  const prev = loadDeliveryLocationCache();
  saveDeliveryLocationCache({
    lat: prev?.lat ?? DEFAULT_DELIVERY_LAT,
    lng: prev?.lng ?? DEFAULT_DELIVERY_LNG,
    address: prev?.address,
    notes: prev?.notes,
    mapOnboardingDone: true,
  });
}

export function shouldShowMapOnboarding(
  lat: number,
  lng: number,
  preferSavedLocation: boolean
): boolean {
  if (preferSavedLocation) return false;
  if (!isDefaultCoords(lat, lng)) return false;
  const cache = loadDeliveryLocationCache();
  return !cache?.mapOnboardingDone;
}