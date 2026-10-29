"use server";

import { prisma } from "@/lib/prisma";
import { getAgenteActual, puedeEditarRegistroPropio } from "@/lib/auth";
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
  accion: "crear" | "editar";
  registros: RegistroInput[];
  puestoId: string;
  agenteId: string;
  creadoEnCliente: string;
};

export type ResultadoSincronizacionRelevamiento =
  | { ok: true; creados: number; yaExistian: number; conflicto: boolean }
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

function normalizarRegistro(r: RegistroInput) {
  const modalidad = (MODALIDADES_RELEVAMIENTO as readonly string[]).includes(r.modalidad)
    ? (r.modalidad as (typeof MODALIDADES_RELEVAMIENTO)[number])
    : "FINES_LARGOS";
  const cantidadPersonas =
    Number.isFinite(r.cantidadPersonas) && r.cantidadPersonas > 0
      ? Math.round(r.cantidadPersonas)
      : 1;
  const medioTransporte = (MEDIOS_VALIDOS as readonly string[]).includes(r.medioTransporte ?? "")
    ? (r.medioTransporte as (typeof MEDIOS_VALIDOS)[number])
    : null;
  const sexo = (SEXOS_VALIDOS as readonly string[]).includes(r.sexo ?? "")
    ? (r.sexo as (typeof SEXOS_VALIDOS)[number])
    : null;
  return { modalidad, cantidadPersonas, procedencia: r.procedencia || null, medioTransporte, sexo };
}

/**
 * Sincroniza uno o más registros de relevamiento cargados sin conexión
 * (la carga rápida de Día de la Virgen manda hasta 3 de una vez) o la
 * edición de uno existente (siempre un solo registro — el formulario de
 * Día de la Virgen no tiene modo edición).
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

  if (input.accion === "editar") {
    const r = input.registros[0];
    const actual = await prisma.relevamiento.findUnique({ where: { id: r.id } });
    if (!actual) {
      return { ok: false, error: "El relevamiento ya no existe en el servidor." };
    }
    if (!puedeEditarRegistroPropio(agente, actual)) {
      return { ok: false, error: "Ya no tenés permiso para editar este relevamiento." };
    }
    const datosEditados = normalizarRegistro(r);

    if (actual.updatedAt > new Date(input.creadoEnCliente)) {
      await prisma.conflictoSincronizacion.create({
        data: {
          relevamientoId: r.id,
          agenteId: agente.id,
          descartado: datosEditados,
          motivo:
            "Edición offline más vieja que la versión ya guardada en el servidor (última edición gana).",
        },
      });
      return { ok: true, creados: 0, yaExistian: 0, conflicto: true };
    }

    try {
      await prisma.relevamiento.update({ where: { id: r.id }, data: datosEditados });
      return { ok: true, creados: 0, yaExistian: 0, conflicto: false };
    } catch (err) {
      console.error("[sync-relevamiento] error al editar:", err);
      return { ok: false, error: "No se pudo guardar en el servidor. Se reintenta más tarde." };
    }
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

      await prisma.relevamiento.create({
        data: {
          id: r.id,
          ...normalizarRegistro(r),
          puestoId: input.puestoId,
          agenteId: agente.id,
        },
      });
      creados += 1;
    }

    console.info(
      `[auditoria-relevamientos] sincronizados offline ${creados} registro(s) por agente=${agente.legajo}`,
    );

    return { ok: true, creados, yaExistian, conflicto: false };
  } catch (err) {
    console.error("[sync-relevamiento] error al sincronizar:", err);
    return { ok: false, error: "No se pudo guardar en el servidor. Se reintenta más tarde." };
  }
}
