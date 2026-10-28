import Link from "next/link";
import { esJefe, getAgenteActual, getGuardiaActiva } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { BotonCerrarGuardiaConConfirmacion } from "@/components/ui/BotonCerrarGuardiaConConfirmacion";
import { StatTile } from "@/components/ui/StatTile";
import { BadgeEstadoActa } from "@/components/ui/BadgeEstadoActa";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { TarjetaSeccion } from "@/components/ui/Tarjeta";
import { BotonImprimir } from "@/components/ui/BotonImprimir";
import { EncabezadoImprimible } from "@/components/ui/EncabezadoImprimible";
import {
  formatoFecha,
  formatoFechaHora,
  formatoHora,
  formatoMoneda,
  numeroActa,
  nombreConductorActa,
} from "@/lib/formato";
import { cerrarGuardia } from "../actions";

export default async function HistorialGuardiaPage() {
  const agente = await getAgenteActual();
  const guardia = await getGuardiaActiva(agente.id);

  const guardiasRecientes = await prisma.guardia.findMany({
    where: { agenteId: agente.id, estado: "CERRADA" },
    orderBy: { turnoFin: "desc" },
    take: 5,
    include: { puesto: true, _count: { select: { actas: true } } },
  });

  if (!guardia) {
    return (
      <>
        <AppHeader />
        <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-24 space-y-4">
          <Link
            href="/guardia"
            className="flex items-center gap-1 text-secondary text-label-sm font-label-sm uppercase"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Volver
          </Link>
          <h1 className="text-headline-md font-headline-md text-primary">
            Historial de Guardias
          </h1>
          <p className="text-body-md text-on-surface-variant">
            No tenés una guardia activa en este momento.
          </p>
          <ListaGuardiasCerradas guardias={guardiasRecientes} />
        </main>
        <BottomNav verAgentes={esJefe(agente)} />
      </>
    );
  }

  const [actas, agregados, retenciones, alcoholemias] = await Promise.all([
    prisma.acta.findMany({
      where: { guardiaId: guardia.id },
      orderBy: { fecha: "desc" },
      include: { infracciones: { include: { infraccion: true } } },
    }),
    prisma.acta.aggregate({
      where: { guardiaId: guardia.id },
      _sum: { montoConDescuento: true },
    }),
    prisma.acta.count({
      where: { guardiaId: guardia.id, retencionPreventiva: true },
    }),
    prisma.acta.count({
      where: { guardiaId: guardia.id, alcoholemiaGraduacion: { gt: 0 } },
    }),
  ]);

  const pendientesFirma = actas.filter(
    (a) => a.estado === "PENDIENTE_FIRMA",
  ).length;

  return (
    <>
      <AppHeader />
      <main className="imprimible w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-24 space-y-4">
        <EncabezadoImprimible
          titulo="Parte de Guardia"
          lugar={guardia.puesto.nombre}
          fecha={formatoFecha(guardia.turnoInicio)}
          hora={formatoHora(guardia.turnoInicio)}
        />

        <Link
          href="/guardia"
          className="flex items-center gap-1 text-secondary text-label-sm font-label-sm uppercase print:hidden"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver
        </Link>

        <div className="flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-headline-md font-headline-md text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">
                history
              </span>
              Historial y Cierre de Guardia
            </h1>
            <p className="text-body-sm text-on-surface-variant">
              Turno iniciado {formatoFechaHora(guardia.turnoInicio)} Hs ·{" "}
              {guardia.puesto.nombre}
            </p>
          </div>
          <BotonImprimir texto="PDF" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Actas Labradas" valor={String(actas.length)} />
          <StatTile
            label="Monto Total"
            valor={formatoMoneda(Number(agregados._sum.montoConDescuento ?? 0))}
          />
          <StatTile label="Retenciones Preventivas" valor={String(retenciones)} tono="error" />
          <StatTile label="Alcoholemias Positivas" valor={String(alcoholemias)} tono="error" />
        </div>

        <section className="space-y-2">
          <h2 className="text-label-lg font-label-lg text-primary uppercase">
            Actas Labradas en el Turno
          </h2>
          {actas.length === 0 && (
            <EstadoVacio>Todavía no se labraron actas en esta guardia.</EstadoVacio>
          )}
          <ul className="space-y-2">
            {actas.map((acta) => (
              <li key={acta.id}>
                <Link
                  href={`/actas/${acta.id}/firma`}
                  className="block bg-surface-container-lowest rounded-lg border border-outline-variant p-3 shadow-sm hover:bg-surface-container"
                >
                  <div className="flex items-center justify-between text-label-sm font-label-sm">
                    <span className="font-display text-on-surface-variant">
                      ACTA N° {numeroActa(acta.numero)}
                    </span>
                    <span className="text-on-surface-variant">
                      {formatoHora(acta.fecha)} Hs
                    </span>
                  </div>
                  <p className="text-body-md font-semibold text-on-surface">
                    {nombreConductorActa(acta)}
                    {acta.tipo === "MUNICIPAL" ? ` · ${acta.vehiculoDominio}` : " · Contravencional"}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <BadgeEstadoActa estado={acta.estado} />
                    {acta.tipo === "MUNICIPAL" && (
                      <span className="font-display font-bold text-primary">
                        {formatoMoneda(Number(acta.montoConDescuento ?? 0))}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <TarjetaSeccion icono="assignment_turned_in" titulo="Cierre de Guardia" className="print:hidden">
          {pendientesFirma > 0 && (
            <p className="text-body-sm text-error bg-error-container/40 border border-error rounded p-2">
              Hay {pendientesFirma} acta(s) pendiente(s) de firma. Podés cerrar
              la guardia igual, pero quedarán marcadas así en el historial.
            </p>
          )}
          <form action={cerrarGuardia} className="space-y-3">
            <div>
              <label
                htmlFor="notasCierre"
                className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-1"
              >
                Notas de Relevo (opcional)
              </label>
              <textarea
                id="notasCierre"
                name="notasCierre"
                rows={3}
                placeholder="Novedades para el próximo turno…"
                className="w-full bg-surface-container-low border border-outline rounded text-body-md p-3"
              />
            </div>
            <BotonCerrarGuardiaConConfirmacion
              puestoNombre={guardia.puesto.nombre}
              variante="destructivo"
            />
          </form>
        </TarjetaSeccion>

        <ListaGuardiasCerradas guardias={guardiasRecientes} />
      </main>
      <BottomNav verAgentes={esJefe(agente)} />
    </>
  );
}

function ListaGuardiasCerradas({
  guardias,
}: {
  guardias: {
    id: string;
    turnoInicio: Date;
    turnoFin: Date | null;
    puesto: { nombre: string };
    _count: { actas: number };
  }[];
}) {
  if (guardias.length === 0) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-label-lg font-label-lg text-primary uppercase">
        Guardias Anteriores
      </h2>
      <ul className="space-y-2">
        {guardias.map((g) => (
          <li
            key={g.id}
            className="bg-surface-container-lowest rounded-lg border border-outline-variant p-3 flex items-center justify-between"
          >
            <div>
              <p className="text-body-sm font-semibold text-on-surface">
                {g.puesto.nombre}
              </p>
              <p className="text-body-sm text-on-surface-variant">
                {formatoFechaHora(g.turnoInicio)}
                {g.turnoFin ? ` — ${formatoHora(g.turnoFin)}` : ""} Hs
              </p>
            </div>
            <span className="text-label-sm font-label-sm bg-surface-container px-2 py-0.5 rounded">
              {g._count.actas} actas
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
