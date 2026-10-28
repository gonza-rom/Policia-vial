"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PuestoMapaDTO } from "./MapaPuestosWrapper";

/** Marcador propio (círculo de color) en vez del ícono por defecto de
 * Leaflet: evita el problema clásico de bundling de sus PNG, y de paso
 * resuelve el requisito de "distinguir visualmente activos e inactivos"
 * directamente por color, sin depender de otro elemento en el popup. */
function iconoPuesto(activo: boolean) {
  const color = activo ? "#10b981" : "#79747e"; // emerald-500 / outline
  return L.divIcon({
    className: "",
    html: `<div style="width:22px;height:22px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

export function MapaPuestos({ puestos }: { puestos: PuestoMapaDTO[] }) {
  const centro: [number, number] =
    puestos.length > 0
      ? [
          puestos.reduce((acc, p) => acc + p.lat, 0) / puestos.length,
          puestos.reduce((acc, p) => acc + p.lng, 0) / puestos.length,
        ]
      : [-28.4, -65.7];

  return (
    <div className="space-y-2">
      <div className="w-full h-80 rounded-lg overflow-hidden border border-outline-variant">
        <MapContainer center={centro} zoom={9} scrollWheelZoom className="w-full h-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {puestos.map((p) => (
            <Marker key={p.id} position={[p.lat, p.lng]} icon={iconoPuesto(p.activo)}>
              <Popup>
                <div className="space-y-1">
                  <p className="font-bold">{p.nombre}</p>
                  {p.codigo && <p className="text-sm">Código: {p.codigo}</p>}
                  {p.ubicacion && <p className="text-sm">{p.ubicacion}</p>}
                  <p className="text-sm">
                    Estado: <strong>{p.activo ? "Activo" : "Inactivo"}</strong>
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${p.lat},${p.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm underline"
                  >
                    Abrir en Google Maps
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <div className="flex items-center gap-4 text-body-sm text-on-surface-variant">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Activo
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-outline inline-block" /> Inactivo
        </span>
      </div>
    </div>
  );
}
