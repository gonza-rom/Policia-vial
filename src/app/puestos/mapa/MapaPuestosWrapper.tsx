"use client";

import dynamic from "next/dynamic";

export type PuestoMapaDTO = {
  id: string;
  nombre: string;
  codigo: string | null;
  ubicacion: string | null;
  activo: boolean;
  lat: number;
  lng: number;
};

// Leaflet toca `window`/`document` al importarse — en SSR rompe aunque el
// componente ya sea "use client" (Next igual lo renderiza una vez en el
// servidor). `ssr: false` lo saca de ese primer render.
const MapaPuestos = dynamic(() => import("./MapaPuestos").then((m) => m.MapaPuestos), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 rounded-lg bg-surface-container-low border border-outline-variant flex items-center justify-center text-body-sm text-on-surface-variant">
      Cargando mapa…
    </div>
  ),
});

export function MapaPuestosWrapper({ puestos }: { puestos: PuestoMapaDTO[] }) {
  return <MapaPuestos puestos={puestos} />;
}
