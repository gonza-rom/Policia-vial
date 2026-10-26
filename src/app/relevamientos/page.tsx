import Link from "next/link";
import { esJefe, getAgenteActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { Boton } from "@/components/ui/Boton";
import { BarraHorizontal } from "@/components/ui/BarraHorizontal";
import { TarjetaSeccion } from "@/components/ui/Tarjeta";
import { FiltroPill } from "@/components/ui/FiltroPill";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { PALETA_CATEGORICA } from "@/lib/chartColors";
import { formatoFechaHora } from "@/lib/formato";
import { NOMBRE_RELEVAMIENTOS } from "@/lib/config";
import {
  agruparPorClave,
  MEDIO_TRANSPORTE_LABEL,
  SEXO_LABEL,
} from "@/lib/relevamientos";
import { eliminarRelevamiento } from "./actions";
import { BotonEliminarConConfirmacion } from "@/components/ui/BotonEliminarConConfirmacion";

export default async function RelevamientosPage({
  searchParams,
}: {
  searchParams: Promise<{ modalidad?: string; puesto?: string }>;
}) {
  const { modalidad: modalidadParam, puesto: puestoParam } = await searchParams;
  const agente = await getAgenteActual();

  const modalidad =
    modalidadParam === "DIA_VIRGEN" ? "DIA_VIRGEN" : ("FINES_LARGOS" as const);
  const esDiaVirgen = modalidad === "DIA_VIRGEN";

  const [puestos, registros] = await Promise.all([
    prisma.puesto.findMany({ where: { activo: true }, orderBy: { orden: "asc" } }),
    prisma.relevamiento.findMany({
      where: { modalidad, ...(puestoParam ? { puestoId: puestoParam } : {}) },
      orderBy: { fecha: "desc" },
      include: { agente: true, puesto: true },
      take: 300,
    }),
  ]);

  const totalPersonas = registros.reduce((acc, r) => acc + r.cantidadPersonas, 0);
  const porProcedencia = agruparPorClave(registros, (r) => r.procedencia);
  const porMedio = esDiaVirgen
    ? agruparPorClave(registros, (r) =>
        r.medioTransporte ? MEDIO_TRANSPORTE_LABEL[r.medioTransporte] : null,
      )
    : [];
  const porSexo = esDiaVirgen
    ? agruparPorClave(registros, (r) => (r.sexo ? SEXO_LABEL[r.sexo] : null))
    : [];

  const maxProcedencia = Math.max(1, ...porProcedencia.map((p) => p.cantidad));
  const maxMedio = Math.max(1, ...porMedio.map((p) => p.cantidad));
  const maxSexo = Math.max(1, ...porSexo.map((p) => p.cantidad));

  const recientes = registros.slice(0, 15);

  return (
    <>
      <AppHeader nombreApellido={agente.nombreApellido} legajo={agente.legajo} />
      <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-24 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-headline-md font-headline-md text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">
              groups
            </span>
            {NOMBRE_RELEVAMIENTOS}
          </h1>
          <Boton
            as={Link}
            href={`/relevamientos/nuevo?modalidad=${modalidad}`}
            icono="add"
            className="px-4"
          >
            Nuevo
          </Boton>
        </div>
        <p className="text-body-sm text-on-surface-variant -mt-2">
          Conteos de operativos puntuales — no son actas ni recaudación.
        </p>

        <div className="flex gap-2">
          <FiltroPill href="/relevamientos?modalidad=FINES_LARGOS" activo={!esDiaVirgen}>
            Fines Largos
          </FiltroPill>
          <FiltroPill href="/relevamientos?modalidad=DIA_VIRGEN" activo={esDiaVirgen}>
            Día de la Virgen
          </FiltroPill>
        </div>

        <form className="flex items-center gap-2">
          <input type="hidden" name="modalidad" value={modalidad} />
          <select
            name="puesto"
            defaultValue={puestoParam ?? ""}
            aria-label="Filtrar por puesto"
            className="bg-surface-container-low border border-outline rounded text-body-sm px-3 py-2 min-h-touch-min flex-1"
          >
            <option value="">Todos los puestos</option>
            {puestos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="min-h-touch-min px-3 bg-surface-container border border-outline-variant rounded text-label-sm font-label-sm"
          >
            Filtrar
          </button>
        </form>

        <section className="bg-primary rounded-lg p-4 shadow-sm text-on-primary">
          <span className="text-label-sm font-label-sm uppercase text-primary-fixed-dim block">
            Total de Personas Contabilizadas
          </span>
          <span className="font-display text-2xl font-bold">{totalPersonas}</span>
          <p className="text-body-sm text-primary-fixed-dim mt-1">
            {registros.length} registro(s) cargado(s)
          </p>
        </section>

        {esDiaVirgen && porMedio.length > 0 && (
          <TarjetaSeccion icono="commute" titulo="Por Medio de Transporte">
            {porMedio.map((p) => (
              <BarraHorizontal
                key={p.etiqueta}
                etiqueta={p.etiqueta}
                valor={p.cantidad}
                valorMostrado={String(p.cantidad)}
                porcentaje={(p.cantidad / maxMedio) * 100}
                color={PALETA_CATEGORICA[0]}
              />
            ))}
          </TarjetaSeccion>
        )}

        {esDiaVirgen && porSexo.length > 0 && (
          <TarjetaSeccion icono="wc" titulo="Por Sexo">
            {porSexo.map((p) => (
              <BarraHorizontal
                key={p.etiqueta}
                etiqueta={p.etiqueta}
                valor={p.cantidad}
                valorMostrado={String(p.cantidad)}
                porcentaje={(p.cantidad / maxSexo) * 100}
                color={PALETA_CATEGORICA[1]}
              />
            ))}
          </TarjetaSeccion>
        )}

        {porProcedencia.length > 0 && (
          <TarjetaSeccion icono="map" titulo="Por Procedencia">
            {porProcedencia.slice(0, 10).map((p) => (
              <BarraHorizontal
                key={p.etiqueta}
                etiqueta={p.etiqueta}
                valor={p.cantidad}
                valorMostrado={String(p.cantidad)}
                porcentaje={(p.cantidad / maxProcedencia) * 100}
                color={PALETA_CATEGORICA[2]}
              />
            ))}
          </TarjetaSeccion>
        )}

        <section className="space-y-2">
          <h2 className="text-label-lg font-label-lg text-primary uppercase">
            Últimos Registros
          </h2>
          {recientes.length === 0 && (
            <EstadoVacio>Todavía no hay conteos cargados para esta modalidad.</EstadoVacio>
          )}
          <ul className="space-y-2">
            {recientes.map((r) => {
              const puedeEditar = r.agenteId === agente.id || esJefe(agente);
              return (
                <li
                  key={r.id}
                  className="bg-surface-container-lowest rounded-lg border border-outline-variant p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-headline-sm font-bold text-primary">
                      {r.cantidadPersonas}
                    </span>
                    <span className="text-body-sm text-on-surface-variant">
                      {formatoFechaHora(r.fecha)} Hs
                    </span>
                  </div>
                  <p className="text-body-sm text-on-surface">
                    {esDiaVirgen && r.medioTransporte
                      ? `${MEDIO_TRANSPORTE_LABEL[r.medioTransporte]} · `
                      : ""}
                    {esDiaVirgen && r.sexo ? `${SEXO_LABEL[r.sexo]} · ` : ""}
                    {r.procedencia ?? "Sin procedencia"}
                  </p>
                  <p className="text-body-sm text-on-surface-variant">
                    {r.puesto.nombre} · {r.agente.nombreApellido}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <Link
                      href={`/relevamientos/${r.id}`}
                      className="flex items-center gap-1 text-secondary text-label-sm font-label-sm uppercase"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        print
                      </span>
                      Ver / Exportar PDF
                    </Link>
                    {puedeEditar && (
                      <Link
                        href={`/relevamientos/${r.id}/editar`}
                        className="flex items-center gap-1 text-secondary text-label-sm font-label-sm uppercase"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          edit
                        </span>
                        Editar
                      </Link>
                    )}
                    {puedeEditar && esJefe(agente) && (
                      <form action={eliminarRelevamiento}>
                        <input type="hidden" name="id" value={r.id} />
                        <BotonEliminarConConfirmacion
                          mensaje="¿Eliminar este registro? Esta acción no se puede deshacer."
                        />
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
      <BottomNav verAgentes={esJefe(agente)} />
    </>
  );
}
