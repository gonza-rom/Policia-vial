import Link from "next/link";
import { esJefe, getAgenteActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { Boton } from "@/components/ui/Boton";
import { formatoFechaHora, numeroActa } from "@/lib/formato";

const TIPO_LABEL = { PERSONA: "Persona", VEHICULO: "Vehículo" } as const;
const TIPO_ICONO = { PERSONA: "person", VEHICULO: "directions_car" } as const;

export default async function RequerimientosPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const agente = await getAgenteActual();

  const filtroTipo = tipo === "PERSONA" || tipo === "VEHICULO" ? tipo : undefined;

  const requerimientos = await prisma.requerimiento.findMany({
    where: filtroTipo ? { tipo: filtroTipo } : undefined,
    orderBy: { fecha: "desc" },
    include: { agente: true, puesto: true },
    take: 100,
  });

  return (
    <>
      <AppHeader nombreApellido={agente.nombreApellido} legajo={agente.legajo} />
      <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-24 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-headline-md font-headline-md text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">
              gpp_maybe
            </span>
            Requerimientos
          </h1>
          <Boton as={Link} href="/requerimientos/nuevo" icono="add" className="px-4">
            Nuevo
          </Boton>
        </div>
        <p className="text-body-sm text-on-surface-variant -mt-2">
          Pedidos de captura o secuestro sobre personas o vehículos.
        </p>

        <div className="flex gap-2">
          <Link
            href="/requerimientos"
            className={`px-3 py-1.5 rounded text-label-sm font-label-sm border ${
              !filtroTipo
                ? "bg-primary-container text-on-primary border-primary"
                : "border-outline-variant text-on-surface-variant"
            }`}
          >
            Todos
          </Link>
          <Link
            href="/requerimientos?tipo=PERSONA"
            className={`px-3 py-1.5 rounded text-label-sm font-label-sm border ${
              filtroTipo === "PERSONA"
                ? "bg-primary-container text-on-primary border-primary"
                : "border-outline-variant text-on-surface-variant"
            }`}
          >
            Personas
          </Link>
          <Link
            href="/requerimientos?tipo=VEHICULO"
            className={`px-3 py-1.5 rounded text-label-sm font-label-sm border ${
              filtroTipo === "VEHICULO"
                ? "bg-primary-container text-on-primary border-primary"
                : "border-outline-variant text-on-surface-variant"
            }`}
          >
            Vehículos
          </Link>
        </div>

        {requerimientos.length === 0 && (
          <p className="text-body-md text-on-surface-variant text-center py-8">
            No hay requerimientos cargados todavía.
          </p>
        )}

        <ul className="space-y-3">
          {requerimientos.map((r) => (
            <li key={r.id}>
              <Link
                href={`/requerimientos/${r.id}`}
                className="block bg-surface-container-lowest rounded-lg border border-outline-variant p-3 shadow-sm hover:bg-surface-container transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-display text-label-md text-on-surface-variant">
                    REQ. N° {numeroActa(r.numero)}
                  </span>
                  <span className="flex items-center gap-1 text-label-sm font-label-sm bg-error-container text-on-error-container px-2 py-0.5 rounded font-bold">
                    <span className="material-symbols-outlined text-[16px]">
                      {TIPO_ICONO[r.tipo]}
                    </span>
                    {TIPO_LABEL[r.tipo]}
                  </span>
                </div>
                <p className="text-body-md font-semibold text-on-surface line-clamp-2">
                  {r.descripcion}
                </p>
                <p className="text-body-sm text-on-surface-variant mt-1">
                  {formatoFechaHora(r.fecha)} Hs · {r.puesto.nombre} ·{" "}
                  {r.agente.nombreApellido}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <BottomNav verAgentes={esJefe(agente)} />
    </>
  );
}
