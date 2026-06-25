"use client";

import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER: [number, number] = [13.798, -88.91];

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type Props = {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
};

function MapClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function DeliveryMap({ lat, lng, onChange }: Props) {
  useEffect(() => {
    // Leaflet default icon fix en bundlers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <MapContainer
        center={[lat, lng]}
        zoom={10}
        className="z-0 h-64 w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={markerIcon} />
        <MapClickHandler onChange={onChange} />
      </MapContainer>
      <p className="bg-surface px-3 py-2 text-xs text-zinc-500">
        Toca el mapa para marcar tu ubicación de entrega ·{" "}
        <a
          href={`https://www.openstreetmap.org/#map=10/${DEFAULT_CENTER[0]}/${DEFAULT_CENTER[1]}`}
          target="_blank"
          rel="noreferrer"
          className="text-neon-cyan hover:underline"
        >
          Abrir OpenStreetMap
        </a>
      </p>
    </div>
  );
}