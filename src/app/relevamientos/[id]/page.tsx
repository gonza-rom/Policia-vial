import Link from "next/link";
import { notFound } from "next/navigation";
import { esJefe, getAgenteActual, puedeEditarRegistroPropio } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
import { BotonImprimir } from "@/components/ui/BotonImprimir";
import { BotonEliminarConConfirmacion } from "@/components/ui/BotonEliminarConConfirmacion";
import { EncabezadoImprimible } from "@/components/ui/EncabezadoImprimible";
import { formatoFecha, formatoHora } from "@/lib/formato";
import { NOMBRE_RELEVAMIENTOS } from "@/lib/config";
import { MEDIO_TRANSPORTE_LABEL, SEXO_LABEL } from "@/lib/relevamientos";
import { eliminarRelevamiento } from "../actions";

const MODALIDAD_LABEL: Record<string, string> = {
  FINES_LARGOS: "Fines Largos",
  DIA_VIRGEN: "Día de la Virgen",
};

export default async function DetalleRelevamientoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agente = await getAgenteActual();

  const relevamiento = await prisma.relevamiento.findUnique({
    where: { id },
    include: { agente: true, puesto: true },
  });
  if (!relevamiento) notFound();

  const puedeEditar = puedeEditarRegistroPropio(agente, relevamiento);
  const esDiaVirgen = relevamiento.modalidad === "DIA_VIRGEN";

  return (
    <>
      <AppHeader nombreApellido={agente.nombreApellido} legajo={agente.legajo} />
      <main className="imprimible w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-10 space-y-4">
        <EncabezadoImprimible
          titulo={`${NOMBRE_RELEVAMIENTOS} — ${MODALIDAD_LABEL[relevamiento.modalidad]}`}
          lugar={relevamiento.puesto.nombre}
          fecha={formatoFecha(relevamiento.fecha)}
          hora={formatoHora(relevamiento.fecha)}
        />

        <div className="flex items-center justify-between print:hidden">
          <Link
            href="/relevamientos"
            className="flex items-center gap-1 text-secondary text-label-sm font-label-sm uppercase"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Volver
          </Link>
          <div className="flex items-center gap-2">
            {puedeEditar && (
              <Link
                href={`/relevamientos/${relevamiento.id}/editar`}
                className="flex items-center gap-1 text-secondary text-label-sm font-label-sm uppercase"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Editar
              </Link>
            )}
            {esJefe(agente) && (
              <form action={eliminarRelevamiento}>
                <input type="hidden" name="id" value={relevamiento.id} />
                <BotonEliminarConConfirmacion mensaje="¿Eliminar este registro? Esta acción no se puede deshacer." />
              </form>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end print:hidden">
          <BotonImprimir />
        </div>

        <div className="bg-primary-container text-on-primary rounded-lg p-pad-lg flex items-center justify-between">
          <div>
            <span className="text-body-sm uppercase block">
              {MODALIDAD_LABEL[relevamiento.modalidad]}
            </span>
            <span className="text-label-sm">{relevamiento.puesto.nombre}</span>
          </div>
          <span className="font-display text-2xl font-bold">
            {relevamiento.cantidadPersonas}
          </span>
        </div>

        <section className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-sm space-y-3">
          <Campo titulo="Cantidad de Personas" valor={String(relevamiento.cantidadPersonas)} />
          {relevamiento.procedencia && (
            <Campo titulo="Procedencia" valor={relevamiento.procedencia} />
          )}
          {esDiaVirgen && relevamiento.medioTransporte && (
            <Campo
              titulo="Medio de Transporte"
              valor={MEDIO_TRANSPORTE_LABEL[relevamiento.medioTransporte]}
            />
          )}
          {esDiaVirgen && relevamiento.sexo && (
            <Campo titulo="Sexo" valor={SEXO_LABEL[relevamiento.sexo]} />
          )}
        </section>

        <section className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-sm print:hidden">
          <p className="text-body-sm text-on-surface-variant">
            Cargado por {relevamiento.agente.nombreApellido} (Leg.{" "}
            {relevamiento.agente.legajo})
          </p>
        </section>
      </main>
    </>
  );
}

function Campo({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <p className="text-label-sm font-label-sm text-on-surface-variant uppercase mb-1">
        {titulo}
      </p>
      <p className="text-body-md text-on-surface">{valor}</p>
    </div>
  );
}
