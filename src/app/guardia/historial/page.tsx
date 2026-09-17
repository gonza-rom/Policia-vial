import Link from "next/link";
import { getAgenteActual, getGuardiaActiva } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { Boton } from "@/components/ui/Boton";
import {
  formatoFechaHora,
  formatoHora,
  formatoMoneda,
  numeroActa,
  ESTADO_ACTA_LABEL,
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
        <AppHeader nombreApellido={agente.nombreApellido} legajo={agente.legajo} />
        <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-24 space-y-4">
          <h1 className="text-headline-md font-headline-md text-primary">
            Historial de Guardias
          </h1>
          <p className="text-body-md text-on-surface-variant">
            No tenés una guardia activa en este momento.
          </p>
          <ListaGuardiasCerradas guardias={guardiasRecientes} />
        </main>
        <BottomNav />
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
      <AppHeader nombreApellido={agente.nombreApellido} legajo={agente.legajo} />
      <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-24 space-y-4">
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

        <div className="grid grid-cols-2 gap-3">
          <Metrica label="Actas Labradas" valor={String(actas.length)} tono="primario" />
          <Metrica
            label="Monto Total"
            valor={formatoMoneda(Number(agregados._sum.montoConDescuento ?? 0))}
            tono="primario"
          />
          <Metrica label="Retenciones Preventivas" valor={String(retenciones)} tono="error" />
          <Metrica label="Alcoholemias Positivas" valor={String(alcoholemias)} tono="error" />
        </div>

        <section className="space-y-2">
          <h2 className="text-label-lg font-label-lg text-primary uppercase">
            Actas Labradas en el Turno
          </h2>
          {actas.length === 0 && (
            <p className="text-body-sm text-on-surface-variant">
              Todavía no se labraron actas en esta guardia.
            </p>
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
                    {acta.conductorNombre} · {acta.vehiculoDominio}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span
                      className={`text-label-sm font-label-sm px-2 py-0.5 rounded font-bold ${
                        acta.estado === "PENDIENTE_FIRMA"
                          ? "bg-error-container text-on-error-container"
                          : "bg-secondary-container/40 text-on-secondary-container"
                      }`}
                    >
                      {ESTADO_ACTA_LABEL[acta.estado]}
                    </span>
                    <span className="font-display font-bold text-primary">
                      {formatoMoneda(Number(acta.montoConDescuento))}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-sm space-y-3">
          <h2 className="text-label-lg font-label-lg text-primary uppercase flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">
              assignment_turned_in
            </span>
            Cierre de Guardia
          </h2>
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
            <Boton type="submit" variante="destructivo" icono="lock" fullWidth>
              Cerrar Guardia
            </Boton>
          </form>
        </section>

        <ListaGuardiasCerradas guardias={guardiasRecientes} />
      </main>
      <BottomNav />
    </>
  );
}

function Metrica({
  label,
  valor,
  tono,
}: {
  label: string;
  valor: string;
  tono: "primario" | "error";
}) {
  return (
    <div
      className={`border-l-4 px-3 py-2 bg-surface-container-lowest rounded shadow-sm ${
        tono === "error" ? "border-error" : "border-primary"
      }`}
    >
      <span
        className={`text-label-sm font-label-sm block uppercase ${
          tono === "error" ? "text-error" : "text-on-surface-variant"
        }`}
      >
        {label}
      </span>
      <span
        className={`text-headline-sm font-display font-bold ${
          tono === "error" ? "text-error" : "text-primary"
        }`}
      >
        {valor}
      </span>
    </div>
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
