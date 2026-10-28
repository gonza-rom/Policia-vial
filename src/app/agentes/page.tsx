import Link from "next/link";
import { startOfMonth } from "date-fns";
import { getJefeActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { Boton } from "@/components/ui/Boton";
import { StatTile } from "@/components/ui/StatTile";
import { BadgeOtraJurisdiccion } from "@/components/ui/BadgeOtraJurisdiccion";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { formatoHora } from "@/lib/formato";

export default async function AgentesPage() {
  const jefe = await getJefeActual();
  const inicioMes = startOfMonth(new Date());

  const agentes = await prisma.agente.findMany({
    where: jefe.rol === "ADMIN" ? { id: { not: jefe.id } } : { jefeId: jefe.id },
    orderBy: [{ activo: "desc" }, { nombreApellido: "asc" }],
    include: {
      guardias: {
        where: { estado: "ACTIVA" },
        include: { puesto: true },
        take: 1,
      },
      _count: {
        select: {
          actas: { where: { fecha: { gte: inicioMes } } },
        },
      },
    },
  });

  const idsAgentes = agentes.map((a) => a.id);
  const [pendientesFirma, actasOtraJuris, procedimientosOtraJuris] = idsAgentes.length
    ? await Promise.all([
        prisma.acta.count({
          where: { agenteId: { in: idsAgentes }, estado: "PENDIENTE_FIRMA" },
        }),
        prisma.acta.groupBy({
          by: ["agenteId"],
          where: {
            agenteId: { in: idsAgentes },
            modalidadTrabajo: "OTRA_JURISDICCION",
            fecha: { gte: inicioMes },
          },
          _count: true,
        }),
        prisma.procedimiento.groupBy({
          by: ["agenteId"],
          where: {
            agenteId: { in: idsAgentes },
            modalidadTrabajo: "OTRA_JURISDICCION",
            fecha: { gte: inicioMes },
          },
          _count: true,
        }),
      ])
    : [0, [], []];

  const otraJurisdiccionPorAgente = new Map<string, number>();
  for (const g of actasOtraJuris) {
    otraJurisdiccionPorAgente.set(g.agenteId, g._count);
  }
  for (const g of procedimientosOtraJuris) {
    otraJurisdiccionPorAgente.set(
      g.agenteId,
      (otraJurisdiccionPorAgente.get(g.agenteId) ?? 0) + g._count,
    );
  }
  const otraJurisdiccionMes = [...otraJurisdiccionPorAgente.values()].reduce(
    (acc, n) => acc + n,
    0,
  );

  const activos = agentes.filter((a) => a.activo).length;
  const enGuardia = agentes.filter((a) => a.guardias.length > 0).length;
  const actasMes = agentes.reduce((acc, a) => acc + a._count.actas, 0);

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

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-headline-md font-headline-md text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">groups</span>
            Mis Agentes
          </h1>
          <Boton as={Link} href="/agentes/nuevo" icono="person_add" className="px-4">
            Nuevo Agente
          </Boton>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Agentes Activos" valor={`${activos} / ${agentes.length}`} />
          <StatTile label="En Guardia Ahora" valor={String(enGuardia)} />
          <StatTile label="Actas del Mes" valor={String(actasMes)} />
          <StatTile
            label="Pendientes de Firma"
            valor={String(pendientesFirma)}
            tono={pendientesFirma > 0 ? "error" : "primario"}
          />
        </div>

        {otraJurisdiccionMes > 0 && (
          <StatTile
            label="Otra Jurisdicción Este Mes — Para Revisar"
            valor={String(otraJurisdiccionMes)}
            icono="travel_explore"
            tono="secundario"
          />
        )}

        {agentes.length === 0 && (
          <EstadoVacio>
            Todavía no diste de alta a ningún agente. Usá «Nuevo Agente» para
            crear su usuario de acceso.
          </EstadoVacio>
        )}

        <ul className="space-y-3">
          {agentes.map((a) => {
            const guardia = a.guardias[0];
            return (
              <li key={a.id}>
                <Link
                  href={`/agentes/${a.id}`}
                  className={`block bg-surface-container-lowest rounded-lg border border-outline-variant p-3 shadow-sm hover:bg-surface-container transition-colors ${
                    a.activo ? "" : "opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-display text-label-md text-on-surface-variant">
                      Leg. {a.legajo}
                    </span>
                    {!a.activo ? (
                      <span className="text-label-sm font-label-sm px-2 py-0.5 rounded font-bold bg-error-container text-on-error-container">
                        Dado de baja
                      </span>
                    ) : guardia ? (
                      <span className="flex items-center gap-1 text-label-sm font-label-sm px-2 py-0.5 rounded font-bold bg-secondary-container/40 text-on-secondary-container">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden />
                        En guardia
                      </span>
                    ) : (
                      <span className="text-label-sm font-label-sm px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                        Fuera de turno
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-body-md font-semibold text-on-surface truncate">
                        {a.grado ? `${a.grado} ` : ""}
                        {a.nombreApellido}
                      </p>
                      <p className="text-body-sm text-on-surface-variant truncate">
                        {guardia
                          ? `${guardia.puesto.nombre} · desde ${formatoHora(guardia.turnoInicio)} Hs`
                          : a.rol === "AGENTE"
                            ? "Agente"
                            : a.rol === "JEFE"
                              ? "Jefe"
                              : "Administrador"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-label-sm font-label-sm bg-surface-container px-2 py-0.5 rounded">
                        {a._count.actas} actas este mes
                      </span>
                      {(otraJurisdiccionPorAgente.get(a.id) ?? 0) > 0 && (
                        <BadgeOtraJurisdiccion />
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
      <BottomNav verAgentes />
    </>
  );
}
