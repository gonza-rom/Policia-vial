import Link from "next/link";
import { notFound } from "next/navigation";
import { startOfMonth } from "date-fns";
import { getAgenteACargo, getJefeActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { Boton } from "@/components/ui/Boton";
import { TarjetaSeccion } from "@/components/ui/Tarjeta";
import { StatTile } from "@/components/ui/StatTile";
import { BadgeEstadoActa } from "@/components/ui/BadgeEstadoActa";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import {
  formatoFechaHora,
  formatoHora,
  formatoMoneda,
  numeroActa,
} from "@/lib/formato";
import { cambiarEstadoAgente, cerrarGuardiaDeAgente } from "../actions";
import { ContrasenaForm, EditarAgenteForm } from "./FormulariosAgente";

export default async function AgentePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jefe = await getJefeActual();
  const agente = await getAgenteACargo(jefe, id);
  if (!agente) notFound();

  const inicioMes = startOfMonth(new Date());

  const [guardiaActiva, guardias, actas, resumenMes, pendientesFirma] =
    await Promise.all([
      prisma.guardia.findFirst({
        where: { agenteId: agente.id, estado: "ACTIVA" },
        include: { puesto: true, _count: { select: { actas: true } } },
      }),
      prisma.guardia.findMany({
        where: { agenteId: agente.id, estado: "CERRADA" },
        orderBy: { turnoFin: "desc" },
        take: 5,
        include: { puesto: true, _count: { select: { actas: true } } },
      }),
      prisma.acta.findMany({
        where: { agenteId: agente.id },
        orderBy: { fecha: "desc" },
        take: 10,
      }),
      prisma.acta.aggregate({
        where: { agenteId: agente.id, fecha: { gte: inicioMes } },
        _count: true,
        _sum: { montoConDescuento: true },
      }),
      prisma.acta.count({
        where: { agenteId: agente.id, estado: "PENDIENTE_FIRMA" },
      }),
    ]);

  return (
    <>
      <AppHeader nombreApellido={jefe.nombreApellido} legajo={jefe.legajo} />
      <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-24 space-y-4">
        <Link
          href="/agentes"
          className="flex items-center gap-1 text-secondary text-label-sm font-label-sm uppercase"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Mis Agentes
        </Link>

        <div>
          <p className="font-display text-label-md text-on-surface-variant">
            Leg. {agente.legajo}
          </p>
          <h1 className="text-headline-md font-headline-md text-primary">
            {agente.grado ? `${agente.grado} ` : ""}
            {agente.nombreApellido}
          </h1>
          {!agente.activo && (
            <p className="mt-2 text-body-sm text-error bg-error-container/40 border border-error rounded p-2">
              Agente dado de baja: no puede ingresar al sistema.
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatTile label="Actas del Mes" valor={String(resumenMes._count)} />
          <StatTile
            label="Monto del Mes"
            valor={formatoMoneda(Number(resumenMes._sum.montoConDescuento ?? 0))}
          />
          <StatTile
            label="Sin Firmar"
            valor={String(pendientesFirma)}
            tono={pendientesFirma > 0 ? "error" : "primario"}
          />
        </div>

        <TarjetaSeccion
          icono="shield"
          titulo="Guardia"
          badge={guardiaActiva ? "En curso" : "Fuera de turno"}
          badgeTono={guardiaActiva ? "primario" : "secundario"}
        >
          {guardiaActiva ? (
            <>
              <p className="text-body-md text-on-surface">
                {guardiaActiva.puesto.nombre} · desde{" "}
                {formatoFechaHora(guardiaActiva.turnoInicio)} Hs ·{" "}
                {guardiaActiva._count.actas} actas
              </p>
              <form action={cerrarGuardiaDeAgente}>
                <input type="hidden" name="agenteId" value={agente.id} />
                <Boton type="submit" variante="destructivo" icono="lock" fullWidth>
                  Cerrar su Guardia
                </Boton>
              </form>
            </>
          ) : (
            <p className="text-body-sm text-on-surface-variant">
              No tiene una guardia activa en este momento.
            </p>
          )}

          {guardias.length > 0 && (
            <ul className="space-y-2 pt-1">
              {guardias.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center justify-between gap-2 bg-surface-container-low rounded p-2"
                >
                  <div className="min-w-0">
                    <p className="text-body-sm font-semibold text-on-surface truncate">
                      {g.puesto.nombre}
                    </p>
                    <p className="text-body-sm text-on-surface-variant">
                      {formatoFechaHora(g.turnoInicio)}
                      {g.turnoFin ? ` — ${formatoHora(g.turnoFin)}` : ""} Hs
                    </p>
                  </div>
                  <span className="text-label-sm font-label-sm bg-surface-container px-2 py-0.5 rounded shrink-0">
                    {g._count.actas} actas
                  </span>
                </li>
              ))}
            </ul>
          )}
        </TarjetaSeccion>

        <TarjetaSeccion icono="task_alt" titulo="Últimas Actas">
          {actas.length === 0 && <EstadoVacio>Todavía no labró actas.</EstadoVacio>}
          <ul className="space-y-2">
            {actas.map((acta) => (
              <li key={acta.id}>
                <Link
                  href={`/actas/${acta.id}/firma`}
                  className="block bg-surface-container-low rounded p-2 hover:bg-surface-container"
                >
                  <div className="flex items-center justify-between text-label-sm font-label-sm">
                    <span className="font-display text-on-surface-variant">
                      ACTA N° {numeroActa(acta.numero)}
                    </span>
                    <span className="text-on-surface-variant">
                      {formatoFechaHora(acta.fecha)} Hs
                    </span>
                  </div>
                  <p className="text-body-md font-semibold text-on-surface">
                    {acta.conductorNombre} · {acta.vehiculoDominio}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <BadgeEstadoActa estado={acta.estado} />
                    <span className="font-display font-bold text-primary">
                      {formatoMoneda(Number(acta.montoConDescuento))}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </TarjetaSeccion>

        <TarjetaSeccion icono="edit" titulo="Datos del Agente">
          <EditarAgenteForm
            agenteId={agente.id}
            nombreApellido={agente.nombreApellido}
            grado={agente.grado}
          />
        </TarjetaSeccion>

        <TarjetaSeccion icono="key" titulo="Acceso">
          <ContrasenaForm agenteId={agente.id} />
          <form action={cambiarEstadoAgente} className="pt-2 border-t border-outline-variant">
            <input type="hidden" name="agenteId" value={agente.id} />
            {agente.activo ? (
              <Boton type="submit" variante="destructivo" icono="person_off" fullWidth>
                Dar de Baja
              </Boton>
            ) : (
              <Boton type="submit" variante="secundario" icono="person_check" fullWidth>
                Reactivar Agente
              </Boton>
            )}
          </form>
          {agente.activo && (
            <p className="text-body-sm text-on-surface-variant">
              Al darlo de baja no puede volver a ingresar y se cierra su guardia
              activa. Sus actas se conservan.
            </p>
          )}
        </TarjetaSeccion>
      </main>
      <BottomNav verAgentes />
    </>
  );
}
