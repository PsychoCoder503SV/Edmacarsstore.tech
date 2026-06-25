"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useRef, useState } from "react";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const CAR_MARKER_SRC = "/icon.png";

type PermissionState = "idle" | "asking" | "tracking" | "denied" | "unsupported";

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

  const [permission, setPermission] = useState<PermissionState>("idle");
  const [showPermissionModal, setShowPermissionModal] = useState(true);

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

    markerRef.current = new maplibregl.Marker({ element: el, anchor: "center" })
      .setLngLat([longitude, latitude])
      .addTo(map);
  }, []);

  const applyPosition = useCallback(
    (latitude: number, longitude: number, fly = false) => {
      const map = mapRef.current;
      if (map) {
        placeMarker(map, latitude, longitude);
        if (fly) {
          map.flyTo({ center: [longitude, latitude], zoom: 18, essential: true });
        }
      }
      onChangeRef.current(latitude, longitude);
      setPermission("tracking");
    },
    [placeMarker]
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
        <div ref={containerRef} className="delivery-map-canvas h-[22rem] w-full sm:h-[26rem]" />

        {showPermissionModal && (
          <div className="delivery-map-permission-overlay">
            <div className="delivery-map-permission-card">
              <p className="text-sm font-semibold text-white">Ubicación de entrega</p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                Marca el punto exacto donde recibirás tu pedido.
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