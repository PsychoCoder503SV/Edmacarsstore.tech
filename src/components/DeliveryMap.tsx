"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  markMapOnboardingDone,
  saveDeliveryLocationCache,
  shouldShowMapOnboarding,
} from "@/lib/delivery-location-cache";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const CAR_MARKER_SRC = "/icon.png";

type PermissionState = "idle" | "asking" | "denied" | "unsupported";

type GeocodeResult = {
  lat: number;
  lng: number;
  label: string;
};

type Props = {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  /** Perfil o cache del navegador ya tiene ubicación — no mostrar modal inicial */
  preferSavedLocation?: boolean;
};

export default function DeliveryMap({ lat, lng, onChange, preferSavedLocation = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const internalUpdateRef = useRef(false);
  const initCoordsRef = useRef({ lat, lng });

  const [permission, setPermission] = useState<PermissionState>("idle");
  const [showPermissionModal, setShowPermissionModal] = useState(() =>
    shouldShowMapOnboarding(lat, lng, preferSavedLocation)
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  onChangeRef.current = onChange;

  const emitChange = useCallback((latitude: number, longitude: number) => {
    internalUpdateRef.current = true;
    onChangeRef.current(latitude, longitude);
  }, []);

  const persistLocation = useCallback((latitude: number, longitude: number) => {
    if (persistDebounceRef.current) clearTimeout(persistDebounceRef.current);
    persistDebounceRef.current = setTimeout(() => {
      saveDeliveryLocationCache({
        lat: latitude,
        lng: longitude,
        mapOnboardingDone: true,
      });
    }, 300);
  }, []);

  const placeMarker = useCallback((map: maplibregl.Map, latitude: number, longitude: number) => {
    if (markerRef.current) {
      markerRef.current.setLngLat([longitude, latitude]);
      return;
    }

    const el = document.createElement("div");
    el.className = "delivery-map-car-marker";
    const img = document.createElement("img");
    img.src = CAR_MARKER_SRC;
    img.alt = "";
    img.draggable = false;
    el.appendChild(img);

    markerRef.current = new maplibregl.Marker({ element: el, anchor: "center", draggable: true })
      .setLngLat([longitude, latitude])
      .addTo(map);

    markerRef.current.on("dragend", () => {
      const pos = markerRef.current?.getLngLat();
      if (pos) {
        emitChange(pos.lat, pos.lng);
        persistLocation(pos.lat, pos.lng);
      }
    });
  }, [emitChange, persistLocation]);

  const applyPosition = useCallback(
    (latitude: number, longitude: number, fly = false) => {
      const map = mapRef.current;
      if (map) {
        placeMarker(map, latitude, longitude);
        if (fly) {
          map.flyTo({ center: [longitude, latitude], zoom: 17, essential: true });
        }
      }
      emitChange(latitude, longitude);
      persistLocation(latitude, longitude);
      setPermission("idle");
    },
    [placeMarker, emitChange, persistLocation]
  );

  const runSearch = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setSearching(true);
    setSearchError(null);

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al buscar");

      const results = (data.results ?? []) as GeocodeResult[];
      setSearchResults(results);
      setShowResults(results.length > 0);

      if (!results.length) {
        setSearchError("No encontramos ese lugar. Prueba con otro nombre o marca en el mapa.");
      }
    } catch (e) {
      setSearchResults([]);
      setShowResults(false);
      setSearchError(e instanceof Error ? e.message : "Error al buscar");
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      setSearchError(null);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => runSearch(value), 450);
    },
    [runSearch]
  );

  const selectSearchResult = useCallback(
    (result: GeocodeResult) => {
      setSearchQuery(result.label.split(",")[0] ?? result.label);
      setShowResults(false);
      setSearchResults([]);
      markMapOnboardingDone();
      setShowPermissionModal(false);
      applyPosition(result.lat, result.lng, true);
    },
    [applyPosition]
  );

  const dismissOnboarding = useCallback(() => {
    markMapOnboardingDone();
    setShowPermissionModal(false);
  }, []);

  const requestCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setPermission("unsupported");
      return;
    }

    setPermission("asking");
    setShowPermissionModal(false);
    markMapOnboardingDone();

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        applyPosition(latitude, longitude, true);
      },
      () => {
        setPermission("denied");
        setShowPermissionModal(shouldShowMapOnboarding(lat, lng, preferSavedLocation));
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 300_000 }
    );
  }, [applyPosition, lat, lng, preferSavedLocation]);

  useEffect(() => {
    if (shouldShowMapOnboarding(lat, lng, preferSavedLocation)) return;
    setShowPermissionModal(false);
  }, [lat, lng, preferSavedLocation]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const start = initCoordsRef.current;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [start.lng, start.lat],
      zoom: preferSavedLocation ? 15 : 13,
      attributionControl: false,
    });

    map.on("error", (e) => {
      console.error("[DeliveryMap] error", e);
      setMapError("No se pudo cargar el mapa. Revisa tu conexión e intenta recargar.");
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("click", (e) => {
      const { lat: clickLat, lng: clickLng } = e.lngLat;
      placeMarker(map, clickLat, clickLng);
      emitChange(clickLat, clickLng);
      markMapOnboardingDone();
      persistLocation(clickLat, clickLng);
    });

    map.once("load", () => {
      placeMarker(map, start.lat, start.lng);
    });

    mapRef.current = map;

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      if (persistDebounceRef.current) clearTimeout(persistDebounceRef.current);
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once per mount
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    placeMarker(map, lat, lng);

    if (internalUpdateRef.current) {
      internalUpdateRef.current = false;
      return;
    }

    map.flyTo({ center: [lng, lat], zoom: 15, essential: true, duration: 500 });
  }, [lat, lng, placeMarker]);

  return (
    <div className="delivery-map-wrap overflow-hidden rounded-2xl border border-neon-cyan/20 bg-surface shadow-neon-cyan">
      <div className="relative">
        <div className="delivery-map-search-bar">
          <input
            type="search"
            className="delivery-map-search-input"
            placeholder="Buscar lugar (ej. hospital zacamil)"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            aria-label="Buscar ubicación aproximada"
          />
          {searching && <span className="delivery-map-search-spinner" aria-hidden />}
        </div>

        {showResults && searchResults.length > 0 && (
          <ul className="delivery-map-search-results" role="listbox">
            {searchResults.map((result) => (
              <li key={`${result.lat}-${result.lng}-${result.label}`}>
                <button
                  type="button"
                  role="option"
                  className="delivery-map-search-result"
                  onClick={() => selectSearchResult(result)}
                >
                  {result.label}
                </button>
              </li>
            ))}
          </ul>
        )}

        {searchError && <p className="delivery-map-search-error">{searchError}</p>}
        {mapError && <p className="delivery-map-search-error">{mapError}</p>}

        <div ref={containerRef} className="delivery-map-canvas h-[22rem] w-full sm:h-[26rem]" />

        {showPermissionModal && (
          <div className="delivery-map-permission-overlay">
            <div className="delivery-map-permission-card">
              <p className="text-sm font-semibold text-white">Ubicación de entrega</p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                Solo la primera vez: busca un lugar, usa tu ubicación o marca el punto en el mapa. Después lo
                recordamos en este navegador.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button type="button" className="btn-neon flex-1 py-2.5 text-xs" onClick={requestCurrentLocation}>
                  Usar mi ubicación
                </button>
                <button type="button" className="btn-neon-outline flex-1 py-2.5 text-xs" onClick={dismissOnboarding}>
                  Marcar en el mapa
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={requestCurrentLocation}
          disabled={permission === "asking"}
          className="delivery-map-gps-btn"
          aria-label="Usar mi ubicación"
        >
          {permission === "asking" ? (
            <span className="delivery-map-gps-spinner" aria-hidden />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
              <path
                d="M12 2v3M12 19v3M2 12h3M19 12h3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
          <span>{permission === "asking" ? "Localizando…" : "Mi ubicación"}</span>
        </button>
      </div>
    </div>
  );
}