"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useRef, useState } from "react";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const CAR_MARKER_SRC = "/icon.png";

type PermissionState = "idle" | "asking" | "tracking" | "denied" | "unsupported";

type GeocodeResult = {
  lat: number;
  lng: number;
  label: string;
};

type Props = {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
};

export default function DeliveryMap({ lat, lng, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const geoWatchRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [permission, setPermission] = useState<PermissionState>("idle");
  const [showPermissionModal, setShowPermissionModal] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  onChangeRef.current = onChange;

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
      if (pos) onChangeRef.current(pos.lat, pos.lng);
    });
  }, []);

  const applyPosition = useCallback(
    (latitude: number, longitude: number, fly = false) => {
      const map = mapRef.current;
      if (map) {
        placeMarker(map, latitude, longitude);
        if (fly) {
          map.flyTo({ center: [longitude, latitude], zoom: 17, essential: true });
        }
      }
      onChangeRef.current(latitude, longitude);
      setPermission("tracking");
    },
    [placeMarker]
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
      applyPosition(result.lat, result.lng, true);
    },
    [applyPosition]
  );

  const startRealtimeTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setPermission("unsupported");
      return;
    }

    setPermission("asking");
    setShowPermissionModal(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        applyPosition(latitude, longitude, true);

        geoWatchRef.current = navigator.geolocation.watchPosition(
          (watchPos) => {
            applyPosition(watchPos.coords.latitude, watchPos.coords.longitude, false);
          },
          () => setPermission("denied"),
          { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
        );
      },
      () => {
        setPermission("denied");
        setShowPermissionModal(true);
      },
      { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 }
    );
  }, [applyPosition]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [lng, lat],
      zoom: 13,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("click", (e) => {
      const { lat: clickLat, lng: clickLng } = e.lngLat;
      placeMarker(map, clickLat, clickLng);
      onChangeRef.current(clickLat, clickLng);
    });

    placeMarker(map, lat, lng);
    mapRef.current = map;

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      if (geoWatchRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchRef.current);
      }
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once; lat/lng synced below
  }, [placeMarker]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || permission === "tracking") return;
    placeMarker(map, lat, lng);
  }, [lat, lng, permission, placeMarker]);

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

        <div ref={containerRef} className="delivery-map-canvas h-[22rem] w-full sm:h-[26rem]" />

        {showPermissionModal && (
          <div className="delivery-map-permission-overlay">
            <div className="delivery-map-permission-card">
              <p className="text-sm font-semibold text-white">Ubicación de entrega</p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                Busca un lugar aproximado o marca el punto exacto donde recibirás tu pedido.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button type="button" className="btn-neon flex-1 py-2.5 text-xs" onClick={startRealtimeTracking}>
                  Usar mi ubicación
                </button>
                <button
                  type="button"
                  className="btn-neon-outline flex-1 py-2.5 text-xs"
                  onClick={() => setShowPermissionModal(false)}
                >
                  Marcar en el mapa
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={startRealtimeTracking}
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