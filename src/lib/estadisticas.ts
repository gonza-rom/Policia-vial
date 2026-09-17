import type { Prisma } from "@/generated/prisma/client";

type ActaConInfracciones = Prisma.ActaGetPayload<{
  include: { infracciones: { include: { infraccion: true } } };
}>;

const ORDEN_GRAVEDAD = { GRAVISIMA: 3, GRAVE: 2, LEVE: 1 } as const;

export function gravedadMaxima(acta: ActaConInfracciones) {
  let max: "LEVE" | "GRAVE" | "GRAVISIMA" | null = null;
  for (const ai of acta.infracciones) {
    const g = ai.infraccion.gravedad;
    if (!max || ORDEN_GRAVEDAD[g] > ORDEN_GRAVEDAD[max]) max = g;
  }
  return max ?? "LEVE";
}

export function numeroSemanaDelMes(fecha: Date) {
  return Math.ceil(fecha.getDate() / 7);
}

export function agruparPorGravedad(actas: ActaConInfracciones[]) {
  const buckets: Record<"LEVE" | "GRAVE" | "GRAVISIMA", { cantidad: number; monto: number }> = {
    LEVE: { cantidad: 0, monto: 0 },
    GRAVE: { cantidad: 0, monto: 0 },
    GRAVISIMA: { cantidad: 0, monto: 0 },
  };
  for (const acta of actas) {
    const g = gravedadMaxima(acta);
    buckets[g].cantidad += 1;
    buckets[g].monto += Number(acta.montoConDescuento);
  }
  return buckets;
}

export function agruparPorSemana(actas: ActaConInfracciones[]) {
  const mapa = new Map<number, number>();
  for (const acta of actas) {
    const sem = numeroSemanaDelMes(acta.fecha);
    mapa.set(sem, (mapa.get(sem) ?? 0) + Number(acta.montoConDescuento));
  }
  return Array.from(mapa.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([semana, monto]) => ({ semana, monto }));
}

export function agruparPorDia(actas: ActaConInfracciones[]) {
  const mapa = new Map<string, number>();
  for (const acta of actas) {
    const clave = acta.fecha.toISOString().slice(0, 10);
    mapa.set(clave, (mapa.get(clave) ?? 0) + Number(acta.montoConDescuento));
  }
  return Array.from(mapa.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([fecha, monto]) => ({ fecha, monto }));
}

export function agruparPorInfraccion(actas: ActaConInfracciones[]) {
  const mapa = new Map<
    string,
    { descripcion: string; gravedad: string; montoBase: number; cantidad: number }
  >();
  for (const acta of actas) {
    for (const ai of acta.infracciones) {
      const existente = mapa.get(ai.infraccionId);
      if (existente) {
        existente.cantidad += 1;
      } else {
        mapa.set(ai.infraccionId, {
          descripcion: ai.infraccion.descripcion,
          gravedad: ai.infraccion.gravedad,
          montoBase: Number(ai.infraccion.montoBase),
          cantidad: 1,
        });
      }
    }
  }
  return Array.from(mapa.values()).sort((a, b) => b.cantidad - a.cantidad);
}

export function agruparPorVehiculo(actas: ActaConInfracciones[]) {
  const mapa = new Map<string, { cantidad: number; monto: number }>();
  for (const acta of actas) {
    const existente = mapa.get(acta.vehiculoTipo) ?? { cantidad: 0, monto: 0 };
    existente.cantidad += 1;
    existente.monto += Number(acta.montoConDescuento);
    mapa.set(acta.vehiculoTipo, existente);
  }
  return mapa;
}

const RANGOS_EDAD: [number, number, string][] = [
  [16, 20, "16-20"],
  [21, 25, "21-25"],
  [26, 35, "26-35"],
  [36, 45, "36-45"],
  [46, 55, "46-55"],
  [56, 65, "56-65"],
  [66, 130, "66+"],
];

export function agruparPorEdad(actas: ActaConInfracciones[]) {
  const buckets = RANGOS_EDAD.map(([, , label]) => ({ label, cantidad: 0 }));
  let sinDato = 0;
  for (const acta of actas) {
    if (acta.conductorEdad == null) {
      sinDato += 1;
      continue;
    }
    const idx = RANGOS_EDAD.findIndex(
      ([min, max]) => acta.conductorEdad! >= min && acta.conductorEdad! <= max,
    );
    if (idx >= 0) buckets[idx].cantidad += 1;
    else sinDato += 1;
  }
  return { buckets, sinDato };
}
