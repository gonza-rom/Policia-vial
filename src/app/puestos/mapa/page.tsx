import Link from "next/link";
import { esJefe, getJefeActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { MapaPuestosWrapper } from "./MapaPuestosWrapper";

export default async function MapaPuestosPage() {
  const jefe = await getJefeActual();
  const puestos = await prisma.puesto.findMany({ orderBy: { orden: "asc" } });

  const conCoordenadas = puestos
    .filter((p) => p.latitud != null && p.longitud != null)
    .map((p) => ({
      id: p.id,
      nombre: p.nombre,
      codigo: p.codigo,
      ubicacion: p.ubicacion,
      activo: p.activo,
      lat: Number(p.latitud),
      lng: Number(p.longitud),
    }));
  const sinCoordenadas = puestos.filter((p) => p.latitud == null || p.longitud == null);

  return (
    <>
      <AppHeader nombreApellido={jefe.nombreApellido} legajo={jefe.legajo} />
      <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-24 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-headline-md font-headline-md text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">map</span>
            Mapa de Puestos
          </h1>
          <Link href="/puestos" className="text-secondary text-label-sm font-label-sm uppercase">
            Ver Listado
          </Link>
        </div>

        {conCoordenadas.length === 0 ? (
          <EstadoVacio>Ningún puesto tiene coordenadas cargadas todavía.</EstadoVacio>
        ) : (
          <MapaPuestosWrapper puestos={conCoordenadas} />
        )}

        {sinCoordenadas.length > 0 && (
          <div className="bg-error-container/40 border border-error rounded-lg p-3">
            <p className="text-label-sm font-label-sm text-error uppercase font-bold mb-1">
              Pendientes de Geolocalización
            </p>
            <ul className="text-body-sm text-on-surface space-y-0.5">
              {sinCoordenadas.map((p) => (
                <li key={p.id}>{p.nombre}</li>
              ))}
            </ul>
          </div>
        )}
      </main>
      <BottomNav verAgentes={esJefe(jefe)} />
    </>
  );
}
