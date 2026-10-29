import Link from "next/link";
import { notFound } from "next/navigation";
import { esJefe, getAgenteActual, puedeEditarRegistroPropio } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { BotonImprimir } from "@/components/ui/BotonImprimir";
import { BotonEliminarConConfirmacion } from "@/components/ui/BotonEliminarConConfirmacion";
import { EncabezadoImprimible } from "@/components/ui/EncabezadoImprimible";
import { AvisoOtraJurisdiccion } from "@/components/ui/AvisoOtraJurisdiccion";
import {
  formatoFecha,
  formatoFechaHora,
  formatoHora,
  numeroActa,
  TIPO_PROCEDIMIENTO_LABEL,
} from "@/lib/formato";
import { eliminarProcedimiento } from "../actions";

export default async function DetalleProcedimientoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agente = await getAgenteActual();

  const procedimiento = await prisma.procedimiento.findUnique({
    where: { id },
    include: { agente: true, puesto: true, puestoTrabajo: true },
  });
  if (!procedimiento) notFound();

  const puedeEditar = puedeEditarRegistroPropio(agente, procedimiento);
  const esOtraJurisdiccion = procedimiento.modalidadTrabajo === "OTRA_JURISDICCION";

  return (
    <>
      <AppHeader />
      <main className="imprimible w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-24 space-y-4">
        <EncabezadoImprimible
          titulo={`Procedimiento — ${TIPO_PROCEDIMIENTO_LABEL[procedimiento.tipo]}`}
          lugar={esOtraJurisdiccion ? (procedimiento.puestoTrabajo?.nombre ?? procedimiento.puesto.nombre) : procedimiento.puesto.nombre}
          fecha={formatoFecha(procedimiento.fecha)}
          hora={formatoHora(procedimiento.fecha)}
        />

        <div className="flex items-center justify-between print:hidden">
          <Link
            href="/procedimientos"
            className="flex items-center gap-1 text-secondary text-label-sm font-label-sm uppercase"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Volver
          </Link>
          <div className="flex items-center gap-2">
            {puedeEditar && (
               
              <a
                href={`/procedimientos/${procedimiento.id}/editar`}
                className="flex items-center gap-1 text-secondary text-label-sm font-label-sm uppercase"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Editar
              </a>
            )}
            {esJefe(agente) && (
              <form action={eliminarProcedimiento}>
                <input type="hidden" name="id" value={procedimiento.id} />
                <BotonEliminarConConfirmacion
                  mensaje={`¿Eliminar el procedimiento N° ${numeroActa(procedimiento.numero)}? Esta acción no se puede deshacer.`}
                />
              </form>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end print:hidden">
          <BotonImprimir />
        </div>

        {esOtraJurisdiccion && (
          <AvisoOtraJurisdiccion
            titulo="Realizado"
            puestoOrigen={procedimiento.puesto.nombre}
            puestoTrabajo={procedimiento.puestoTrabajo?.nombre}
            motivo={procedimiento.motivoOtraJurisdiccion}
          />
        )}

        <div className="bg-error-container text-on-error-container rounded-lg p-pad-lg flex items-center justify-between">
          <div>
            <span className="text-body-sm uppercase block">Procedimiento N°</span>
            <span className="text-label-sm">
              {TIPO_PROCEDIMIENTO_LABEL[procedimiento.tipo]} · {procedimiento.puesto.nombre}
            </span>
          </div>
          <span className="font-display text-xl tracking-widest">
            {numeroActa(procedimiento.numero)}
          </span>
        </div>

        <section className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-sm space-y-3">
          <Campo titulo="Descripción" valor={procedimiento.descripcion} />
          {procedimiento.personaNombre && (
            <Campo titulo="Persona" valor={procedimiento.personaNombre} />
          )}
          {procedimiento.personaDni && (
            <Campo titulo="D.N.I." valor={procedimiento.personaDni} />
          )}
          {procedimiento.vehiculoDominio && (
            <Campo titulo="Vehículo (Dominio)" valor={procedimiento.vehiculoDominio} />
          )}
          {procedimiento.datosOrden && (
            <Campo titulo="Datos de la Orden" valor={procedimiento.datosOrden} />
          )}
          {procedimiento.observaciones && (
            <Campo titulo="Observaciones" valor={procedimiento.observaciones} />
          )}
        </section>

        <section className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-sm print:hidden">
          <p className="text-body-sm text-on-surface-variant">
            Cargado por {procedimiento.agente.nombreApellido} (Leg.{" "}
            {procedimiento.agente.legajo}) el {formatoFechaHora(procedimiento.fecha)} Hs
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
