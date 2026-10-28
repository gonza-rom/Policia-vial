import Link from "next/link";
import { redirect } from "next/navigation";
import { esJefe, getAgenteActual, getGuardiaActiva } from "@/lib/auth";
import { getPuestoSeleccionado } from "@/lib/puesto";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { Boton } from "@/components/ui/Boton";
import { StatTile } from "@/components/ui/StatTile";
import { formatoMoneda } from "@/lib/formato";
import { NOMBRE_RELEVAMIENTOS } from "@/lib/config";
import { cerrarGuardia, cerrarSesion, iniciarGuardia } from "./actions";

export default async function GuardiaPage() {
  const agente = await getAgenteActual();
  const [guardia, puestoContexto] = await Promise.all([
    getGuardiaActiva(agente.id),
    getPuestoSeleccionado(),
  ]);

  if (!guardia) {
    if (!puestoContexto) redirect("/puesto");

    return (
      <>
        <AppHeader />
        <main className="flex-1 max-w-2xl w-full mx-auto px-pad-lg pt-pad-xl pb-24 space-y-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-pad-xl text-center space-y-4">
            <span className="material-symbols-outlined text-5xl text-secondary">
              shield
            </span>
            <h1 className="text-headline-md font-headline-md text-primary">
              No tenés una guardia activa
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Vas a iniciar turno en <strong>{puestoContexto.nombre}</strong>.
            </p>
            <form action={iniciarGuardia} className="space-y-3">
              <input type="hidden" name="puestoId" value={puestoContexto.id} />
              <Boton type="submit" icono="play_arrow" fullWidth>
                Iniciar Guardia en {puestoContexto.nombre}
              </Boton>
            </form>
            <Link
              href="/puesto"
              className="inline-block text-label-sm font-label-sm text-secondary uppercase"
            >
              Cambiar de puesto
            </Link>
          </div>
          <TarjetaAccion
            href="/requerimientos"
            icono="gpp_maybe"
            titulo="Requerimientos"
            descripcion="Pedidos de captura o secuestro sobre personas o vehículos."
          />
          <TarjetaAccion
            href="/procedimientos"
            icono="gavel"
            titulo="Procedimientos"
            descripcion="Órdenes judiciales, secuestros, demoras, arrestos, detenciones y más."
          />
          <TarjetaAccion
            href="/relevamientos"
            icono="groups"
            titulo={NOMBRE_RELEVAMIENTOS}
            descripcion="Conteos de Fines Largos y Día de la Virgen."
          />
          {esJefe(agente) && (
            <TarjetaAccion
              href="/agentes"
              icono="groups"
              titulo="Mis Agentes"
              descripcion="Alta de usuarios, guardias y actas de tu personal."
            />
          )}
          {esJefe(agente) && (
            <TarjetaAccion
              href="/puestos"
              icono="location_on"
              titulo="Puestos y Mapa"
              descripcion="Registro de puestos, coordenadas y jurisdicción municipal."
            />
          )}
          <form action={cerrarSesion}>
            <Boton
              type="submit"
              variante="outline"
              fullWidth
              icono="logout"
              className="text-error border-error"
            >
              Cerrar Sesión
            </Boton>
          </form>
        </main>
        <BottomNav verAgentes={esJefe(agente)} />
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
      <AppHeader />
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
              <p className="text-body-sm font-body-sm text-on-surface-variant flex items-center gap-1 flex-wrap">
                <span className="material-symbols-outlined text-sm">
                  location_on
                </span>
                {guardia.puesto.nombre}
                {guardia.puesto.kmRuta ? ` · ${guardia.puesto.kmRuta}` : ""}
                <Link
                  href="/puesto"
                  className="text-secondary font-label-sm text-label-sm uppercase ml-1"
                >
                  (cambiar)
                </Link>
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <StatTile label="Actas" valor={String(actasHoy)} tono="secundario" />
              <StatTile
                label="Aforo Estim."
                valor={formatoMoneda(totalEstimado)}
                tono="primario"
                className="whitespace-nowrap"
              />
              <StatTile label="Alcoholemias" valor={String(alcoholemias)} tono="error" />
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

          {/* <a> normal, no <Link>: fuerza una recarga completa para que el
          Service Worker cachee el HTML servido (con el catálogo de
          infracciones ya incluido) y la página quede disponible sin
          conexión. Una transición cliente de Next no pasa por el SW. */}
          <a
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
          </a>

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
            />
            <TarjetaAccion
              href="/requerimientos"
              icono="gpp_maybe"
              titulo="Requerimientos"
              descripcion="Pedidos de captura o secuestro sobre personas o vehículos."
            />
            <TarjetaAccion
              href="/procedimientos"
              icono="gavel"
              titulo="Procedimientos"
              descripcion="Órdenes judiciales, secuestros, demoras, arrestos y más."
            />
            <TarjetaAccion
              href="/relevamientos"
              icono="groups"
              titulo={NOMBRE_RELEVAMIENTOS}
              descripcion="Conteos de Fines Largos y Día de la Virgen."
              className={esJefe(agente) ? undefined : "sm:col-span-2"}
            />
            {esJefe(agente) && (
              <TarjetaAccion
                href="/agentes"
                icono="groups"
                titulo="Mis Agentes"
                descripcion="Alta de usuarios, guardias y actas de tu personal."
              />
            )}
            {esJefe(agente) && (
              <TarjetaAccion
                href="/puestos"
                icono="location_on"
                titulo="Puestos y Mapa"
                descripcion="Registro de puestos, coordenadas y jurisdicción municipal."
              />
            )}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-pad-md">
          <form action={cerrarGuardia}>
            <Boton type="submit" variante="outline" fullWidth icono="lock">
              Cerrar Guardia
            </Boton>
          </form>
          <form action={cerrarSesion}>
            <Boton
              type="submit"
              variante="outline"
              fullWidth
              icono="logout"
              className="text-error border-error"
            >
              Cerrar Sesión
            </Boton>
          </form>
        </div>
      </main>
      <BottomNav verAgentes={esJefe(agente)} />
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
