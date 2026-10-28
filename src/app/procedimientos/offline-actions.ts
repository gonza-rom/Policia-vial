"use server";

import { prisma } from "@/lib/prisma";
import { getAgenteActual } from "@/lib/auth";

const TIPOS_VALIDOS = [
  "ORDEN_JUDICIAL",
  "SECUESTRO",
  "DEMORA",
  "ARRESTO",
  "DETENCION",
  "UBICACION_PARADERO",
  "ESTUPEFACIENTES",
] as const;

type SincronizarProcedimientoInput = {
  id: string;
  campos: Record<string, string>;
  puestoId: string;
  agenteId: string;
};

export type ResultadoSincronizacionProcedimiento =
  | { ok: true; yaExistia: boolean }
  | { ok: false; error: string };

/**
 * Sincroniza un procedimiento cargado sin conexión. Solo alta (como el
 * acta municipal, editar uno existente sigue necesitando señal) — por eso
 * no hace falta resolver conflictos de "última edición gana": si el id ya
 * existe en el servidor, es que un intento de sincronización anterior tuvo
 * éxito pero el cliente no llegó a enterarse (se cortó la conexión justo
 * después); no se vuelve a crear ni se pisa nada.
 */
export async function sincronizarProcedimientoOffline(
  input: SincronizarProcedimientoInput,
): Promise<ResultadoSincronizacionProcedimiento> {
  const agente = await getAgenteActual();
  if (agente.id !== input.agenteId) {
    return { ok: false, error: "Esta carga pertenece a otra sesión de agente." };
  }

  const existente = await prisma.procedimiento.findUnique({ where: { id: input.id } });
  if (existente) {
    return { ok: true, yaExistia: true };
  }

  const c = input.campos;
  const texto = (k: string) => (c[k] ?? "").trim();
  const tipoTexto = texto("tipo");
  const tipo = (TIPOS_VALIDOS as readonly string[]).includes(tipoTexto)
    ? (tipoTexto as (typeof TIPOS_VALIDOS)[number])
    : "DEMORA";

  const descripcion = texto("descripcion");
  if (!descripcion) {
    return { ok: false, error: "Falta la descripción del procedimiento." };
  }

  const modalidadTrabajo =
    texto("modalidadTrabajo") === "OTRA_JURISDICCION"
      ? ("OTRA_JURISDICCION" as const)
      : ("HABITUAL" as const);
  const puestoTrabajoId =
    modalidadTrabajo === "OTRA_JURISDICCION" ? texto("puestoTrabajoId") || null : null;
  const motivoOtraJurisdiccion =
    modalidadTrabajo === "OTRA_JURISDICCION" ? texto("motivoOtraJurisdiccion") || null : null;
  if (modalidadTrabajo === "OTRA_JURISDICCION" && !motivoOtraJurisdiccion) {
    return { ok: false, error: "Falta el motivo de \"Otra Jurisdicción\"." };
  }

  try {
    const procedimiento = await prisma.procedimiento.create({
      data: {
        id: input.id,
        tipo,
        modalidadTrabajo,
        puestoTrabajoId,
        motivoOtraJurisdiccion,
        personaNombre: texto("personaNombre") || null,
        personaDni: texto("personaDni") || null,
        vehiculoDominio: texto("vehiculoDominio").toUpperCase() || null,
        descripcion,
        datosOrden: texto("datosOrden") || null,
        observaciones: texto("observaciones") || null,
        puestoId: input.puestoId,
        agenteId: agente.id,
      },
    });

    console.info(
      `[auditoria-procedimientos] sincronizado offline N°${procedimiento.numero} (${procedimiento.tipo}) por agente=${agente.legajo}`,
    );

    return { ok: true, yaExistia: false };
  } catch (err) {
    console.error("[sync-procedimiento] error al sincronizar:", err);
    return { ok: false, error: "No se pudo guardar en el servidor. Se reintenta más tarde." };
  }
}
