import Link from "next/link";
import { esJefe, getJefeActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { Boton } from "@/components/ui/Boton";
import { JURISDICCION_LABEL } from "@/lib/formato";

export default async function PuestosPage() {
  const jefe = await getJefeActual();
  const puestos = await prisma.puesto.findMany({ orderBy: { orden: "asc" } });

  return (
    <>
      <AppHeader nombreApellido={jefe.nombreApellido} legajo={jefe.legajo} />
      <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-24 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-headline-md font-headline-md text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">location_on</span>
            Puestos
          </h1>
          <Boton as={Link} href="/puestos/mapa" icono="map" className="px-4">
            Ver Mapa
          </Boton>
        </div>
        <p className="text-body-sm text-on-surface-variant -mt-2">
          Registro centralizado de puestos: código, ubicación, coordenadas,
          jurisdicción municipal habitual y estado operativo.
        </p>

        <ul className="space-y-3">
          {puestos.map((p) => {
            const sinCoordenadas = p.latitud == null || p.longitud == null;
            return (
              <li
                key={p.id}
                className="bg-surface-container-lowest rounded-lg border border-outline-variant p-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-body-md font-semibold text-on-surface flex items-center gap-2">
                      {p.nombre}
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          p.activo ? "bg-emerald-500" : "bg-outline"
                        }`}
                        title={p.activo ? "Activo" : "Inactivo"}
                      />
                    </p>
                    <p className="text-body-sm text-on-surface-variant">
                      {p.codigo ?? "Sin código"} · {p.ubicacion ?? "Sin ubicación"}
                    </p>
                  </div>
                  <Link
                    href={`/puestos/${p.id}/editar`}
                    className="flex items-center gap-1 text-secondary text-label-sm font-label-sm uppercase"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    Editar
                  </Link>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {sinCoordenadas ? (
                    <span className="flex items-center gap-1 text-label-sm font-label-sm bg-error-container text-on-error-container px-2 py-0.5 rounded">
                      <span className="material-symbols-outlined text-[14px]">
                        location_off
                      </span>
                      Pendiente de geolocalización
                    </span>
                  ) : (
                    <span className="text-label-sm font-label-sm bg-surface-container px-2 py-0.5 rounded text-on-surface-variant">
                      {Number(p.latitud).toFixed(5)}, {Number(p.longitud).toFixed(5)}
                    </span>
                  )}
                  {p.jurisdiccionesMunicipales.length > 0 ? (
                    p.jurisdiccionesMunicipales.map((j) => (
                      <span
                        key={j}
                        className="text-label-sm font-label-sm bg-primary-container text-primary px-2 py-0.5 rounded"
                      >
                        {JURISDICCION_LABEL[j]}
                      </span>
                    ))
                  ) : (
                    <span className="text-label-sm font-label-sm text-on-surface-variant">
                      Sin jurisdicción municipal habitual
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </main>
      <BottomNav verAgentes={esJefe(jefe)} />
    </>
  );
}
