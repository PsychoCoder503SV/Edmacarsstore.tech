"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useRef, useState } from "react";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

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
  const geolocateRef = useRef<maplibregl.GeolocateControl | null>(null);

  const [permission, setPermission] = useState<PermissionState>("idle");
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(true);

  onChangeRef.current = onChange;

  const placeMarker = useCallback((map: maplibregl.Map, latitude: number, longitude: number) => {
    if (markerRef.current) {
      markerRef.current.setLngLat([longitude, latitude]);
      return;
    }
    const el = document.createElement("div");
    el.className = "delivery-map-marker";
    el.setAttribute("aria-hidden", "true");
    markerRef.current = new maplibregl.Marker({ element: el, anchor: "bottom" })
      .setLngLat([longitude, latitude])
      .addTo(map);
  }, []);

  const applyPosition = useCallback(
    (latitude: number, longitude: number, acc: number, fly = false) => {
      const map = mapRef.current;
      if (map) {
        placeMarker(map, latitude, longitude);
        if (fly) {
          map.flyTo({ center: [longitude, latitude], zoom: 18, essential: true });
        }
      }
      onChangeRef.current(latitude, longitude);
      setAccuracy(acc);
      setGpsMessage(`Ubicación en tiempo real (±${Math.round(acc)} m)`);
      setPermission("tracking");
    },
    [placeMarker]
  );

  const startRealtimeTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setPermission("unsupported");
      setGpsMessage("Tu navegador no soporta geolocalización");
      return;
    }

    setPermission("asking");
    setGpsMessage("El navegador te pedirá permiso para usar tu ubicación…");
    setShowPermissionModal(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy: acc } = pos.coords;
        applyPosition(latitude, longitude, acc, true);

        geoWatchRef.current = navigator.geolocation.watchPosition(
          (watchPos) => {
            const { latitude: wLat, longitude: wLng, accuracy: wAcc } = watchPos.coords;
            applyPosition(wLat, wLng, wAcc, false);
          },
          () => {
            setPermission("denied");
            setGpsMessage("Se perdió el seguimiento GPS. Toca «Activar GPS» de nuevo.");
          },
          { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
        );
      },
      (err) => {
        setPermission("denied");
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "Debes permitir el acceso a ubicación en el aviso del navegador"
            : err.code === err.TIMEOUT
              ? "GPS tardó demasiado. Sal al exterior o activa ubicación precisa"
              : "No se pudo obtener tu ubicación";
        setGpsMessage(msg);
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
      pitch: 0,
      bearing: 0,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserLocation: true,
      showAccuracyCircle: true,
      fitBoundsOptions: { maxZoom: 18 },
    });

    geolocate.on("geolocate", (e) => {
      const coords = e.coords;
      applyPosition(coords.latitude, coords.longitude, coords.accuracy, true);
      setShowPermissionModal(false);
    });

    geolocate.on("error", () => {
      setPermission("denied");
      setGpsMessage("Permite ubicación en el navegador para seguimiento en vivo");
      setShowPermissionModal(true);
    });

    map.addControl(geolocate, "top-right");
    geolocateRef.current = geolocate;

    map.on("click", (e) => {
      const { lat: clickLat, lng: clickLng } = e.lngLat;
      placeMarker(map, clickLat, clickLng);
      onChangeRef.current(clickLat, clickLng);
      setGpsMessage("Punto de entrega ajustado manualmente");
    });

    placeMarker(map, lat, lng);
    mapRef.current = map;

    return () => {
      if (geoWatchRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchRef.current);
      }
      markerRef.current?.remove();
      markerRef.current = null;
      geolocateRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [applyPosition, lat, lng, placeMarker]);

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
                Para marcar tu punto exacto, el navegador te pedirá confirmar el acceso a tu
                ubicación. Luego el mapa te seguirá en tiempo real.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button type="button" className="btn-neon flex-1 py-2.5 text-xs" onClick={startRealtimeTracking}>
                  Sí, usar mi ubicación
                </button>
                <button
                  type="button"
                  className="btn-neon-outline flex-1 py-2.5 text-xs"
                  onClick={() => setShowPermissionModal(false)}
                >
                  Marcar manualmente
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
          aria-label="Activar GPS en tiempo real"
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
          <span>
            {permission === "asking"
              ? "Esperando permiso…"
              : permission === "tracking"
                ? "GPS activo"
                : "Activar GPS"}
          </span>
        </button>

        {permission === "tracking" && (
          <span className="delivery-map-live-badge" aria-live="polite">
            <span className="delivery-map-live-dot" />
            En vivo
          </span>
        )}
      </div>

      <div className="border-t border-white/5 bg-surface-elevated px-3 py-2.5 text-xs text-zinc-500">
        {gpsMessage ?? "Confirma tu ubicación con el botón GPS o toca el mapa para ajustar el punto."}
        {accuracy !== null && permission === "tracking" && (
          <span className="mt-1 block text-neon-cyan">Precisión actual: ±{Math.round(accuracy)} metros</span>
        )}
      </div>
    </div>
  );
}