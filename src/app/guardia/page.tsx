import Link from "next/link";
import { getAgenteActual, getGuardiaActiva } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { Boton } from "@/components/ui/Boton";
import { formatoMoneda } from "@/lib/formato";
import { cerrarSesion, iniciarGuardia } from "./actions";

export default async function GuardiaPage() {
  const agente = await getAgenteActual();
  const guardia = await getGuardiaActiva(agente.id);

  if (!guardia) {
    const puestos = await prisma.puesto.findMany({ where: { activo: true } });
    return (
      <>
        <AppHeader nombreApellido={agente.nombreApellido} legajo={agente.legajo} />
        <main className="flex-1 max-w-2xl w-full mx-auto px-pad-lg py-pad-xl space-y-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-pad-xl text-center space-y-4">
            <span className="material-symbols-outlined text-5xl text-secondary">
              shield
            </span>
            <h1 className="text-headline-md font-headline-md text-primary">
              No tenés una guardia activa
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Iniciá tu turno seleccionando el puesto caminero para comenzar a
              labrar actas.
            </p>
            <form action={iniciarGuardia} className="space-y-3">
              <select
                name="puestoId"
                required
                className="w-full bg-surface-container-low border border-outline rounded text-body-md px-3 py-2.5 min-h-touch-min"
              >
                <option value="">Seleccioná un puesto…</option>
                {puestos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
              <Boton type="submit" icono="play_arrow" fullWidth>
                Iniciar Guardia
              </Boton>
            </form>
          </div>
          <form action={cerrarSesion}>
            <Boton type="submit" variante="fantasma" fullWidth icono="logout">
              Cerrar sesión
            </Boton>
          </form>
        </main>
      </>
    );
  }

  const [actasHoy, agregados, alcoholemias] = await Promise.all([
    prisma.acta.count({ where: { guardiaId: guardia.id } }),
    prisma.acta.aggregate({
      where: { guardiaId: guardia.id },
      _sum: { montoConDescuento: true },
    }),
    prisma.acta.count({
      where: {
        guardiaId: guardia.id,
        alcoholemiaGraduacion: { gt: 0 },
      },
    }),
  ]);

  const totalEstimado = Number(agregados._sum.montoConDescuento ?? 0);

  return (
    <>
      <AppHeader nombreApellido={agente.nombreApellido} legajo={agente.legajo} />
      <main className="flex-1 max-w-2xl w-full mx-auto px-pad-lg py-pad-lg pb-24 space-y-pad-xl">
        <section
          aria-label="Resumen de Guardia"
          className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden"
        >
          <div className="bg-surface-container-low px-pad-lg py-pad-sm border-b border-outline-variant flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-label-lg font-label-lg text-primary tracking-wide uppercase">
                Guardia en Curso
              </span>
            </div>
            <span className="text-label-sm font-label-sm font-display text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded">
              Desde {new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(guardia.turnoInicio)} Hs
            </span>
          </div>
          <div className="p-pad-lg flex flex-col md:flex-row md:items-center justify-between gap-pad-lg">
            <div className="space-y-1">
              <p className="text-label-sm font-label-sm text-on-surface-variant uppercase">
                Oficial Actuante a Cargo
              </p>
              <p className="text-headline-sm font-headline-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">
                  badge
                </span>
                {agente.grado ? `${agente.grado} ` : ""}
                {agente.nombreApellido} · Leg. {agente.legajo}
              </p>
              <p className="text-body-sm font-body-sm text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">
                  location_on
                </span>
                {guardia.puesto.nombre}
                {guardia.puesto.kmRuta ? ` · ${guardia.puesto.kmRuta}` : ""}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-4 bg-surface-container-low p-2.5 rounded-lg border border-outline-variant">
              <div className="border-l-4 border-secondary px-3 py-1 bg-surface-container-lowest rounded">
                <span className="text-label-sm font-label-sm text-on-surface-variant block uppercase">
                  Actas
                </span>
                <span className="text-headline-md font-display font-bold text-primary">
                  {actasHoy}
                </span>
              </div>
              <div className="border-l-4 border-primary px-3 py-1 bg-surface-container-lowest rounded">
                <span className="text-label-sm font-label-sm text-on-surface-variant block uppercase">
                  Aforo Estim.
                </span>
                <span className="text-headline-md font-display font-bold text-primary whitespace-nowrap">
                  {formatoMoneda(totalEstimado)}
                </span>
              </div>
              <div className="border-l-4 border-error px-3 py-1 bg-surface-container-lowest rounded">
                <span className="text-label-sm font-label-sm text-error block uppercase">
                  Alcoholemias
                </span>
                <span className="text-headline-md font-display font-bold text-error">
                  {alcoholemias}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Menú Operativo Principal" className="space-y-pad-md">
          <h2 className="flex items-center gap-2 text-label-lg font-label-lg text-primary uppercase tracking-wide">
            <span className="material-symbols-outlined text-secondary">
              grid_view
            </span>
            Acciones Operativas de Tránsito
          </h2>

          <Link
            href="/actas/nueva"
            className="group block bg-primary-container text-on-primary rounded-xl p-pad-xl border-2 border-primary shadow-md hover:bg-primary transition-all active:scale-[0.99]"
          >
            <span className="inline-flex items-center gap-1 bg-secondary text-on-secondary text-[10px] font-label-sm font-bold uppercase px-2 py-0.5 rounded mb-3">
              Acción Rápida
            </span>
            <h3 className="text-headline-sm font-headline-sm font-bold mb-1">
              Cargar Nueva Acta
            </h3>
            <p className="text-body-sm text-primary-fixed-dim">
              Labrar acta de comprobación a conductor e inspección vehicular con
              firma digital.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-label-sm font-label-sm uppercase">
              Emisión Inmediata (Ord. N° 385/12)
              <span className="material-symbols-outlined text-[18px]">
                arrow_forward
              </span>
            </span>
          </Link>

          <div className="grid gap-pad-md sm:grid-cols-2">
            <TarjetaAccion
              href="/actas"
              icono="task_alt"
              titulo="Actas Realizadas"
              descripcion="Ver actas del turno actual y su estado de firma."
              badge={`${actasHoy} en guardia`}
            />
            <TarjetaAccion
              href="/guardia/historial"
              icono="history"
              titulo="Historial y Cierre de Guardia"
              descripcion="Parte diario, vehículos remitidos y cierre de turno."
            />
            <TarjetaAccion
              href="/estadisticas"
              icono="bar_chart"
              titulo="Estadísticas y Rendición"
              descripcion="Recaudación mensual, ranking de infracciones y comparativas."
              badge="Mensual"
              className="sm:col-span-2"
            />
          </div>
        </section>

        <form action={cerrarSesion}>
          <Boton type="submit" variante="fantasma" fullWidth icono="logout">
            Cerrar sesión
          </Boton>
        </form>
      </main>
      <BottomNav />
    </>
  );
}

function TarjetaAccion({
  href,
  icono,
  titulo,
  descripcion,
  badge,
  className,
}: {
  href: string;
  icono: string;
  titulo: string;
  descripcion: string;
  badge?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`block bg-surface-container-lowest rounded-xl border border-outline-variant p-pad-lg shadow-sm hover:bg-surface-container transition-colors ${className ?? ""}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
          <span className="material-symbols-outlined text-secondary">
            {icono}
          </span>
        </span>
        {badge && (
          <span className="text-label-sm font-label-sm bg-surface-container text-on-surface-variant px-2 py-0.5 rounded">
            {badge}
          </span>
        )}
      </div>
      <h3 className="text-headline-sm font-headline-sm font-bold text-on-surface mb-1">
        {titulo}
      </h3>
      <p className="text-body-sm text-on-surface-variant">{descripcion}</p>
    </Link>
  );
}
