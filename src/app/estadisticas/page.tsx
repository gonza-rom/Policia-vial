import Link from "next/link";
import { esJefe, getAgenteActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { BarraHorizontal } from "@/components/ui/BarraHorizontal";
import { StatTile } from "@/components/ui/StatTile";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import {
  formatoMoneda,
  TIPO_RODADO_LABEL,
  TIPO_RODADO_ICON,
  GRAVEDAD_LABEL,
} from "@/lib/formato";
import {
  agruparPorDia,
  agruparPorEdad,
  agruparPorGravedad,
  agruparPorInfraccion,
  agruparPorSemana,
  agruparPorVehiculo,
} from "@/lib/estadisticas";
import { EvolucionChart } from "./EvolucionChart";
import { COLOR_GRAVEDAD, COLOR_VEHICULO } from "@/lib/chartColors";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function parseMes(mesParam: string | undefined) {
  const ahora = new Date();
  if (mesParam && /^\d{4}-\d{2}$/.test(mesParam)) {
    const [y, m] = mesParam.split("-").map(Number);
    return { anio: y, mes: m - 1 };
  }
  return { anio: ahora.getFullYear(), mes: ahora.getMonth() };
}

export default async function EstadisticasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; puesto?: string }>;
}) {
  const { mes: mesParam, puesto: puestoParam } = await searchParams;
  const agente = await getAgenteActual();
  const puedeVerRecaudacion = esJefe(agente);
  const { anio, mes } = parseMes(mesParam);

  const inicioMes = new Date(anio, mes, 1);
  const finMes = new Date(anio, mes + 1, 1);
  const inicioMesAnterior = new Date(anio, mes - 1, 1);

  const mesAnteriorParam = `${inicioMesAnterior.getFullYear()}-${String(inicioMesAnterior.getMonth() + 1).padStart(2, "0")}`;
  const mesSiguienteDate = new Date(anio, mes + 1, 1);
  const mesSiguienteParam = `${mesSiguienteDate.getFullYear()}-${String(mesSiguienteDate.getMonth() + 1).padStart(2, "0")}`;
  const esMesActual =
    finMes > new Date() && inicioMes <= new Date() && inicioMes.getMonth() === new Date().getMonth() && inicioMes.getFullYear() === new Date().getFullYear();

  // Las actas contravencionales no tienen monto ni infracciones tipificadas
  // de esta tabla — este dashboard (recaudación, gravedad, vehículos) es
  // específico del acta municipal.
  const puestos = await prisma.puesto.findMany({
    where: { activo: true },
    orderBy: { orden: "asc" },
  });

  const whereBase = {
    tipo: "MUNICIPAL" as const,
    fecha: { gte: inicioMes, lt: finMes },
    estado: { not: "ANULADA" as const },
    ...(puestoParam ? { puestoId: puestoParam } : {}),
  };

  // La recaudación (este mes, mes anterior, evolución) es monetaria: solo se
  // consulta a la base si quien mira el panel es jefe/admin — un agente ni
  // siquiera dispara esas queries, no es solo una cuestión de qué se pinta.
  const [actas, actasContravencionales, agregadoMesAnterior] = await Promise.all([
    prisma.acta.findMany({
      where: whereBase,
      include: { infracciones: { include: { infraccion: true } } },
      orderBy: { fecha: "asc" },
    }),
    prisma.acta.count({
      where: {
        tipo: "CONTRAVENCIONAL",
        fecha: { gte: inicioMes, lt: finMes },
        estado: { not: "ANULADA" },
        ...(puestoParam ? { puestoId: puestoParam } : {}),
      },
    }),
    puedeVerRecaudacion
      ? prisma.acta.aggregate({
          where: {
            tipo: "MUNICIPAL",
            fecha: { gte: inicioMesAnterior, lt: inicioMes },
            estado: { not: "ANULADA" },
            ...(puestoParam ? { puestoId: puestoParam } : {}),
          },
          _sum: { montoConDescuento: true },
        })
      : Promise.resolve(null),
  ]);

  const totalMes = puedeVerRecaudacion
    ? actas.reduce((acc, a) => acc + Number(a.montoConDescuento), 0)
    : 0;
  const totalMesAnterior = Number(agregadoMesAnterior?._sum.montoConDescuento ?? 0);
  const variacion =
    puedeVerRecaudacion && totalMesAnterior > 0
      ? ((totalMes - totalMesAnterior) / totalMesAnterior) * 100
      : null;

  const porSemana = agruparPorSemana(actas);
  const porDia = agruparPorDia(actas);
  const promedioSemanal =
    porSemana.length > 0 ? totalMes / porSemana.length : 0;
  const diasDivisor = esMesActual
    ? new Date().getDate()
    : Math.round((finMes.getTime() - inicioMes.getTime()) / 86_400_000);
  const promedioDiario = diasDivisor > 0 ? totalMes / diasDivisor : 0;

  const gravedad = agruparPorGravedad(actas);
  const infracciones = agruparPorInfraccion(actas);
  const vehiculos = agruparPorVehiculo(actas);
  const { buckets: edadBuckets, sinDato: edadSinDato } = agruparPorEdad(actas);

  const maxInfraccion = Math.max(1, ...infracciones.map((i) => i.cantidad));
  const maxVehiculo = Math.max(1, ...Array.from(vehiculos.values()).map((v) => v.cantidad));
  const maxEdad = Math.max(1, ...edadBuckets.map((b) => b.cantidad));
  const totalGravedad = Math.max(1, actas.length);

  return (
    <>
      <AppHeader nombreApellido={agente.nombreApellido} legajo={agente.legajo} />
      <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-24 space-y-5">
        <div>
          <h1 className="text-headline-md font-headline-md text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">
              bar_chart
            </span>
            Estadísticas y Recaudación
          </h1>
          <p className="text-body-sm text-on-surface-variant">
            Policía de Catamarca · Dirección de Seguridad Vial · Huillapima
          </p>
        </div>

        <div className="flex items-center justify-between bg-surface-container-lowest border border-outline-variant rounded-lg p-2">
          <Link
            href={`/estadisticas?mes=${mesAnteriorParam}${puestoParam ? `&puesto=${puestoParam}` : ""}`}
            className="p-2 rounded hover:bg-surface-container"
            aria-label="Mes anterior"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </Link>
          <span className="font-label-lg text-label-lg uppercase text-primary">
            {MESES[mes]} {anio}
          </span>
          <Link
            href={`/estadisticas?mes=${mesSiguienteParam}${puestoParam ? `&puesto=${puestoParam}` : ""}`}
            className="p-2 rounded hover:bg-surface-container"
            aria-label="Mes siguiente"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </Link>
        </div>

        <form className="flex items-center gap-2">
          <input type="hidden" name="mes" value={`${anio}-${String(mes + 1).padStart(2, "0")}`} />
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

        {puedeVerRecaudacion ? (
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              icono="payments"
              label="Recaudación del Mes"
              valor={formatoMoneda(totalMes)}
              delta={variacion}
            />
            <StatTile
              icono="calendar_view_week"
              label="Promedio Semanal"
              valor={formatoMoneda(promedioSemanal)}
            />
            <StatTile
              icono="today"
              label="Promedio Diario"
              valor={formatoMoneda(promedioDiario)}
            />
            <StatTile
              icono="description"
              label="Actas Municipales"
              valor={String(actas.length)}
            />
          </div>
        ) : (
          <StatTile
            icono="description"
            label="Actas Municipales del Mes"
            valor={String(actas.length)}
          />
        )}

        {actasContravencionales > 0 && (
          <Link
            href="/actas"
            className="flex items-center justify-between bg-surface-container-lowest rounded-lg border border-outline-variant p-3 shadow-sm hover:bg-surface-container"
          >
            <span className="flex items-center gap-2 text-body-md text-on-surface">
              <span className="material-symbols-outlined text-secondary">
                local_police
              </span>
              Actas Contravencionales del mes
            </span>
            <span className="font-display text-lg font-bold text-primary">
              {actasContravencionales}
            </span>
          </Link>
        )}

        {puedeVerRecaudacion && (
          <EvolucionChart porSemana={porSemana} porDia={porDia} />
        )}

        <section className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-sm space-y-3">
          <h2 className="text-label-lg font-label-lg text-primary uppercase">
            {puedeVerRecaudacion ? "Montos por Gravedad" : "Actas por Gravedad"}
          </h2>
          {(["GRAVISIMA", "GRAVE", "LEVE"] as const).map((g) => (
            <BarraHorizontal
              key={g}
              etiqueta={GRAVEDAD_LABEL[g]}
              valor={gravedad[g].cantidad}
              valorMostrado={
                puedeVerRecaudacion
                  ? formatoMoneda(gravedad[g].monto)
                  : `${gravedad[g].cantidad} actas`
              }
              porcentaje={(gravedad[g].cantidad / totalGravedad) * 100}
              color={COLOR_GRAVEDAD[g]}
              icono={
                g === "GRAVISIMA"
                  ? "report"
                  : g === "GRAVE"
                    ? "warning"
                    : "info"
              }
            />
          ))}
        </section>

        <section className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-sm space-y-3">
          <h2 className="text-label-lg font-label-lg text-primary uppercase">
            Infracciones Más Frecuentes
          </h2>
          {infracciones.length === 0 && <EstadoVacio>Sin datos en el período.</EstadoVacio>}
          {infracciones.slice(0, 8).map((inf) => (
            <BarraHorizontal
              key={inf.descripcion}
              etiqueta={inf.descripcion}
              valor={inf.cantidad}
              valorMostrado={
                puedeVerRecaudacion
                  ? `${inf.cantidad} · ${formatoMoneda(inf.montoBase)}`
                  : String(inf.cantidad)
              }
              porcentaje={(inf.cantidad / maxInfraccion) * 100}
              color="#2a78d6"
            />
          ))}
        </section>

        <section className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-sm space-y-3">
          <h2 className="text-label-lg font-label-lg text-primary uppercase">
            Vehículos Involucrados
          </h2>
          {vehiculos.size === 0 && <EstadoVacio>Sin datos en el período.</EstadoVacio>}
          {Array.from(vehiculos.entries()).map(([tipo, datos]) => (
            <BarraHorizontal
              key={tipo}
              etiqueta={TIPO_RODADO_LABEL[tipo]}
              valor={datos.cantidad}
              valorMostrado={
                puedeVerRecaudacion
                  ? `${datos.cantidad} · ${formatoMoneda(datos.monto)}`
                  : String(datos.cantidad)
              }
              porcentaje={(datos.cantidad / maxVehiculo) * 100}
              color={COLOR_VEHICULO[tipo as keyof typeof COLOR_VEHICULO]}
              icono={TIPO_RODADO_ICON[tipo]}
            />
          ))}
        </section>

        <section className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-sm space-y-3">
          <h2 className="text-label-lg font-label-lg text-primary uppercase">
            Edad de los Infractores
          </h2>
          {actas.length === 0 && <EstadoVacio>Sin datos en el período.</EstadoVacio>}
          {edadBuckets.map((b) => (
            <BarraHorizontal
              key={b.label}
              etiqueta={`${b.label} años`}
              valor={b.cantidad}
              valorMostrado={String(b.cantidad)}
              porcentaje={(b.cantidad / maxEdad) * 100}
              color="#4a3aa7"
            />
          ))}
          {edadSinDato > 0 && (
            <p className="text-body-sm text-on-surface-variant">
              {edadSinDato} acta(s) sin edad registrada.
            </p>
          )}
        </section>
      </main>
      <BottomNav verAgentes={esJefe(agente)} />
    </>
  );
}
