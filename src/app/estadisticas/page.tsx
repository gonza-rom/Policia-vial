import Link from "next/link";
import { getAgenteActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { BarraHorizontal } from "@/components/ui/BarraHorizontal";
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

const COLOR_GRAVEDAD = {
  LEVE: "#0ca30c",
  GRAVE: "#ec835a",
  GRAVISIMA: "#d03b3b",
} as const;

const COLOR_VEHICULO = {
  AUTO: "#2a78d6",
  MOTO: "#eb6834",
  PICKUP: "#1baf7a",
  CARGA: "#eda100",
} as const;

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
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes: mesParam } = await searchParams;
  const agente = await getAgenteActual();
  const { anio, mes } = parseMes(mesParam);

  const inicioMes = new Date(anio, mes, 1);
  const finMes = new Date(anio, mes + 1, 1);
  const inicioMesAnterior = new Date(anio, mes - 1, 1);

  const mesAnteriorParam = `${inicioMesAnterior.getFullYear()}-${String(inicioMesAnterior.getMonth() + 1).padStart(2, "0")}`;
  const mesSiguienteDate = new Date(anio, mes + 1, 1);
  const mesSiguienteParam = `${mesSiguienteDate.getFullYear()}-${String(mesSiguienteDate.getMonth() + 1).padStart(2, "0")}`;
  const esMesActual =
    finMes > new Date() && inicioMes <= new Date() && inicioMes.getMonth() === new Date().getMonth() && inicioMes.getFullYear() === new Date().getFullYear();

  const whereBase = {
    fecha: { gte: inicioMes, lt: finMes },
    estado: { not: "ANULADA" as const },
  };

  const [actas, agregadoMesAnterior] = await Promise.all([
    prisma.acta.findMany({
      where: whereBase,
      include: { infracciones: { include: { infraccion: true } } },
      orderBy: { fecha: "asc" },
    }),
    prisma.acta.aggregate({
      where: {
        fecha: { gte: inicioMesAnterior, lt: inicioMes },
        estado: { not: "ANULADA" },
      },
      _sum: { montoConDescuento: true },
    }),
  ]);

  const totalMes = actas.reduce((acc, a) => acc + Number(a.montoConDescuento), 0);
  const totalMesAnterior = Number(agregadoMesAnterior._sum.montoConDescuento ?? 0);
  const variacion =
    totalMesAnterior > 0
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
            href={`/estadisticas?mes=${mesAnteriorParam}`}
            className="p-2 rounded hover:bg-surface-container"
            aria-label="Mes anterior"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </Link>
          <span className="font-label-lg text-label-lg uppercase text-primary">
            {MESES[mes]} {anio}
          </span>
          <Link
            href={`/estadisticas?mes=${mesSiguienteParam}`}
            className="p-2 rounded hover:bg-surface-container"
            aria-label="Mes siguiente"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </Link>
        </div>

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
            label="Total Actas Emitidas"
            valor={String(actas.length)}
          />
        </div>

        <EvolucionChart porSemana={porSemana} porDia={porDia} />

        <section className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-sm space-y-3">
          <h2 className="text-label-lg font-label-lg text-primary uppercase">
            Montos por Gravedad
          </h2>
          {(["GRAVISIMA", "GRAVE", "LEVE"] as const).map((g) => (
            <BarraHorizontal
              key={g}
              etiqueta={`${GRAVEDAD_LABEL[g]} — ${gravedad[g].cantidad} actas`}
              valor={gravedad[g].cantidad}
              valorMostrado={formatoMoneda(gravedad[g].monto)}
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
          {infracciones.length === 0 && (
            <p className="text-body-sm text-on-surface-variant">Sin datos en el período.</p>
          )}
          {infracciones.slice(0, 8).map((inf) => (
            <BarraHorizontal
              key={inf.descripcion}
              etiqueta={inf.descripcion}
              valor={inf.cantidad}
              valorMostrado={`${inf.cantidad} · ${formatoMoneda(inf.montoBase)}`}
              porcentaje={(inf.cantidad / maxInfraccion) * 100}
              color="#2a78d6"
            />
          ))}
        </section>

        <section className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-sm space-y-3">
          <h2 className="text-label-lg font-label-lg text-primary uppercase">
            Vehículos Involucrados
          </h2>
          {vehiculos.size === 0 && (
            <p className="text-body-sm text-on-surface-variant">Sin datos en el período.</p>
          )}
          {Array.from(vehiculos.entries()).map(([tipo, datos]) => (
            <BarraHorizontal
              key={tipo}
              etiqueta={TIPO_RODADO_LABEL[tipo]}
              valor={datos.cantidad}
              valorMostrado={`${datos.cantidad} · ${formatoMoneda(datos.monto)}`}
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
          {actas.length === 0 && (
            <p className="text-body-sm text-on-surface-variant">Sin datos en el período.</p>
          )}
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
      <BottomNav />
    </>
  );
}

function StatTile({
  icono,
  label,
  valor,
  delta,
}: {
  icono: string;
  label: string;
  valor: string;
  delta?: number | null;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-3 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <span className="text-label-sm font-label-sm text-on-surface-variant uppercase">
          {label}
        </span>
        <span className="material-symbols-outlined text-secondary text-[18px]">
          {icono}
        </span>
      </div>
      <p className="text-headline-sm font-display font-bold text-primary truncate">
        {valor}
      </p>
      {delta != null && (
        <p
          className={`text-body-sm font-semibold flex items-center gap-0.5 ${
            delta >= 0 ? "text-emerald-600" : "text-error"
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">
            {delta >= 0 ? "trending_up" : "trending_down"}
          </span>
          {delta >= 0 ? "+" : ""}
          {delta.toFixed(1)}% vs mes anterior
        </p>
      )}
    </div>
  );
}
