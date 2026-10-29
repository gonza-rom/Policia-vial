"use server";

import { prisma } from "@/lib/prisma";
import { getAgenteActual, puedeEditarRegistroPropio } from "@/lib/auth";

type SincronizarRequerimientoInput = {
  id: string;
  accion: "crear" | "editar";
  campos: Record<string, string>;
  puestoId: string;
  agenteId: string;
  creadoEnCliente: string;
};

export type ResultadoSincronizacionRequerimiento =
  | { ok: true; conflicto: boolean }
  | { ok: false; error: string };

function leerCampos(campos: Record<string, string>) {
  const texto = (k: string) => (campos[k] ?? "").trim();
  return {
    tipo: texto("tipo") === "VEHICULO" ? ("VEHICULO" as const) : ("PERSONA" as const),
    descripcion: texto("descripcion"),
    datosOrden: texto("datosOrden") || null,
    motivo: texto("motivo") || null,
    observaciones: texto("observaciones") || null,
  };
}

/**
 * Sincroniza un requerimiento cargado o editado sin conexión. Mismo
 * criterio de idempotencia que procedimientos para el alta (si el id ya
 * existe, no se vuelve a crear) y el de "última edición gana" de actas
 * para la edición (ver `ConflictoSincronizacion`).
 */
export async function sincronizarRequerimientoOffline(
  input: SincronizarRequerimientoInput,
): Promise<ResultadoSincronizacionRequerimiento> {
  const agente = await getAgenteActual();
  if (agente.id !== input.agenteId) {
    return { ok: false, error: "Esta carga pertenece a otra sesión de agente." };
  }

  const datos = leerCampos(input.campos);
  if (!datos.descripcion) {
    return { ok: false, error: "Falta la descripción/identificación." };
  }

  if (input.accion === "editar") {
    const actual = await prisma.requerimiento.findUnique({ where: { id: input.id } });
    if (!actual) {
      return { ok: false, error: "El requerimiento ya no existe en el servidor." };
    }
    if (!puedeEditarRegistroPropio(agente, actual)) {
      return { ok: false, error: "Ya no tenés permiso para editar este requerimiento." };
    }
    if (actual.updatedAt > new Date(input.creadoEnCliente)) {
      await prisma.conflictoSincronizacion.create({
        data: {
          requerimientoId: input.id,
          agenteId: agente.id,
          descartado: datos,
          motivo:
            "Edición offline más vieja que la versión ya guardada en el servidor (última edición gana).",
        },
      });
      return { ok: true, conflicto: true };
    }
    try {
      await prisma.requerimiento.update({ where: { id: input.id }, data: datos });
      return { ok: true, conflicto: false };
    } catch (err) {
      console.error("[sync-requerimiento] error al editar:", err);
      return { ok: false, error: "No se pudo guardar en el servidor. Se reintenta más tarde." };
    }
  }

  const existente = await prisma.requerimiento.findUnique({ where: { id: input.id } });
  if (existente) {
    return { ok: true, conflicto: false };
  }

  try {
    const requerimiento = await prisma.requerimiento.create({
      data: {
        id: input.id,
        ...datos,
        puestoId: input.puestoId,
        agenteId: agente.id,
      },
    });
    console.info(
      `[auditoria-requerimientos] sincronizado offline N°${requerimiento.numero} (${requerimiento.tipo}) por agente=${agente.legajo}`,
    );
    return { ok: true, conflicto: false };
  } catch (err) {
    console.error("[sync-requerimiento] error al crear:", err);
    return { ok: false, error: "No se pudo guardar en el servidor. Se reintenta más tarde." };
  }
}
