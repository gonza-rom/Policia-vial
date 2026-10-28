"use server";

import { prisma } from "@/lib/prisma";
import { getAgenteActual } from "@/lib/auth";
import { MODALIDADES_RELEVAMIENTO } from "@/lib/relevamientos";

type RegistroInput = {
  id: string;
  modalidad: string;
  cantidadPersonas: number;
  procedencia: string | null;
  medioTransporte: string | null;
  sexo: string | null;
};

type SincronizarRelevamientoInput = {
  registros: RegistroInput[];
  puestoId: string;
  agenteId: string;
};

export type ResultadoSincronizacionRelevamiento =
  | { ok: true; creados: number; yaExistian: number }
  | { ok: false; error: string };

const MEDIOS_VALIDOS = [
  "VEHICULO",
  "CAMINATA",
  "BICICLETA",
  "CABALLO",
  "COLECTIVO",
  "CAMION",
] as const;
const SEXOS_VALIDOS = ["FEMENINO", "MASCULINO", "NO_BINARIO"] as const;

/**
 * Sincroniza uno o más registros de relevamiento cargados sin conexión
 * (la carga rápida de Día de la Virgen manda hasta 3 de una vez). Solo
 * alta, igual criterio que el acta municipal y los procedimientos — y por
 * la misma razón no hace falta resolver conflictos: si un id ya existe en
 * el servidor es que ya se sincronizó antes, se lo cuenta como hecho y no
 * se duplica.
 */
export async function sincronizarRelevamientoOffline(
  input: SincronizarRelevamientoInput,
): Promise<ResultadoSincronizacionRelevamiento> {
  const agente = await getAgenteActual();
  if (agente.id !== input.agenteId) {
    return { ok: false, error: "Esta carga pertenece a otra sesión de agente." };
  }
  if (input.registros.length === 0) {
    return { ok: false, error: "No hay nada para sincronizar." };
  }

  let creados = 0;
  let yaExistian = 0;

  try {
    for (const r of input.registros) {
      const existente = await prisma.relevamiento.findUnique({ where: { id: r.id } });
      if (existente) {
        yaExistian += 1;
        continue;
      }

      const modalidad = (
        MODALIDADES_RELEVAMIENTO as readonly string[]
      ).includes(r.modalidad)
        ? (r.modalidad as (typeof MODALIDADES_RELEVAMIENTO)[number])
        : "FINES_LARGOS";
      const cantidadPersonas =
        Number.isFinite(r.cantidadPersonas) && r.cantidadPersonas > 0
          ? Math.round(r.cantidadPersonas)
          : 1;
      const medioTransporte = (
        MEDIOS_VALIDOS as readonly string[]
      ).includes(r.medioTransporte ?? "")
        ? (r.medioTransporte as (typeof MEDIOS_VALIDOS)[number])
        : null;
      const sexo = (SEXOS_VALIDOS as readonly string[]).includes(r.sexo ?? "")
        ? (r.sexo as (typeof SEXOS_VALIDOS)[number])
        : null;

      await prisma.relevamiento.create({
        data: {
          id: r.id,
          modalidad,
          cantidadPersonas,
          procedencia: r.procedencia || null,
          medioTransporte,
          sexo,
          puestoId: input.puestoId,
          agenteId: agente.id,
        },
      });
      creados += 1;
    }

    console.info(
      `[auditoria-relevamientos] sincronizados offline ${creados} registro(s) por agente=${agente.legajo}`,
    );

    return { ok: true, creados, yaExistian };
  } catch (err) {
    console.error("[sync-relevamiento] error al sincronizar:", err);
    return { ok: false, error: "No se pudo guardar en el servidor. Se reintenta más tarde." };
  }
}
