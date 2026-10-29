import Link from "next/link";
import { notFound } from "next/navigation";
import { esJefe, getAgenteActual, puedeEditarRegistroPropio } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { BotonImprimir } from "@/components/ui/BotonImprimir";
import { BotonEliminarConConfirmacion } from "@/components/ui/BotonEliminarConConfirmacion";
import { EncabezadoImprimible } from "@/components/ui/EncabezadoImprimible";
import { formatoFecha, formatoFechaHora, formatoHora, numeroActa } from "@/lib/formato";
import { eliminarRequerimiento } from "../actions";

const TIPO_LABEL = { PERSONA: "Persona", VEHICULO: "Vehículo" } as const;

export default async function DetalleRequerimientoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agente = await getAgenteActual();

  const requerimiento = await prisma.requerimiento.findUnique({
    where: { id },
    include: { agente: true, puesto: true },
  });
  if (!requerimiento) notFound();

  const puedeEditar = puedeEditarRegistroPropio(agente, requerimiento);

  return (
    <>
      <AppHeader />
      <main className="imprimible w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-24 space-y-4">
        <EncabezadoImprimible
          titulo={`Requerimiento — ${TIPO_LABEL[requerimiento.tipo]}`}
          lugar={requerimiento.puesto.nombre}
          fecha={formatoFecha(requerimiento.fecha)}
          hora={formatoHora(requerimiento.fecha)}
        />

        <div className="flex items-center justify-between print:hidden">
          <Link
            href="/requerimientos"
            className="flex items-center gap-1 text-secondary text-label-sm font-label-sm uppercase"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            Volver
          </Link>
          <div className="flex items-center gap-2">
            {puedeEditar && (
               
              <a
                href={`/requerimientos/${requerimiento.id}/editar`}
                className="flex items-center gap-1 text-secondary text-label-sm font-label-sm uppercase"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Editar
              </a>
            )}
            {esJefe(agente) && (
              <form action={eliminarRequerimiento}>
                <input type="hidden" name="id" value={requerimiento.id} />
                <BotonEliminarConConfirmacion
                  mensaje={`¿Eliminar el requerimiento N° ${numeroActa(requerimiento.numero)}? Esta acción no se puede deshacer.`}
                />
              </form>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end print:hidden">
          <BotonImprimir />
        </div>

        <div className="bg-error-container text-on-error-container rounded-lg p-pad-lg flex items-center justify-between">
          <div>
            <span className="text-body-sm uppercase block">
              Requerimiento N°
            </span>
            <span className="text-label-sm">
              {TIPO_LABEL[requerimiento.tipo]} · {requerimiento.puesto.nombre}
            </span>
          </div>
          <span className="font-display text-xl tracking-widest">
            {numeroActa(requerimiento.numero)}
          </span>
        </div>

        <section className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-sm space-y-3">
          <Campo titulo="Descripción / Identificación" valor={requerimiento.descripcion} />
          {requerimiento.datosOrden && (
            <Campo titulo="Datos de la Orden" valor={requerimiento.datosOrden} />
          )}
          {requerimiento.motivo && <Campo titulo="Motivo" valor={requerimiento.motivo} />}
          {requerimiento.observaciones && (
            <Campo titulo="Observaciones" valor={requerimiento.observaciones} />
          )}
        </section>

        <section className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-sm">
          <p className="text-body-sm text-on-surface-variant">
            Cargado por {requerimiento.agente.nombreApellido} (Leg.{" "}
            {requerimiento.agente.legajo}) el {formatoFechaHora(requerimiento.fecha)}{" "}
            Hs
          </p>
        </section>
      </main>
      <BottomNav verAgentes={esJefe(agente)} />
    </>
  );
}

function Campo({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <p className="text-label-sm font-label-sm text-on-surface-variant uppercase mb-1">
        {titulo}
      </p>
      <p className="text-body-md text-on-surface whitespace-pre-wrap">{valor}</p>
    </div>
  );
}
