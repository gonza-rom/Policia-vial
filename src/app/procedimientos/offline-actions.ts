"use server";

import { prisma } from "@/lib/prisma";
import { getAgenteActual, puedeEditarRegistroPropio } from "@/lib/auth";

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
  accion: "crear" | "editar";
  campos: Record<string, string>;
  puestoId: string;
  agenteId: string;
  creadoEnCliente: string;
};

export type ResultadoSincronizacionProcedimiento =
  | { ok: true; conflicto: boolean }
  | { ok: false; error: string };

/**
 * Sincroniza un procedimiento cargado o editado sin conexión.
 * - Alta: si el id ya existe en el servidor, es que un intento anterior ya
 *   tuvo éxito pero el cliente no llegó a enterarse — no se vuelve a crear.
 * - Edición: misma mecánica de "última edición gana" que las actas — la
 *   modalidad/jurisdicción no se vuelven a pedir (igual que al editar con
 *   señal, quedaron fijadas al crear).
 */
export async function sincronizarProcedimientoOffline(
  input: SincronizarProcedimientoInput,
): Promise<ResultadoSincronizacionProcedimiento> {
  const agente = await getAgenteActual();
  if (agente.id !== input.agenteId) {
    return { ok: false, error: "Esta carga pertenece a otra sesión de agente." };
  }

  const c = input.campos;
  const texto = (k: string) => (c[k] ?? "").trim();
  const descripcion = texto("descripcion");
  if (!descripcion) {
    return { ok: false, error: "Falta la descripción del procedimiento." };
  }

  if (input.accion === "editar") {
    const actual = await prisma.procedimiento.findUnique({ where: { id: input.id } });
    if (!actual) {
      return { ok: false, error: "El procedimiento ya no existe en el servidor." };
    }
    if (!puedeEditarRegistroPropio(agente, actual)) {
      return { ok: false, error: "Ya no tenés permiso para editar este procedimiento." };
    }
    const tipoTexto = texto("tipo");
    const tipo = (TIPOS_VALIDOS as readonly string[]).includes(tipoTexto)
      ? (tipoTexto as (typeof TIPOS_VALIDOS)[number])
      : actual.tipo;
    const datosEditados = {
      tipo,
      personaNombre: texto("personaNombre") || null,
      personaDni: texto("personaDni") || null,
      vehiculoDominio: texto("vehiculoDominio").toUpperCase() || null,
      descripcion,
      datosOrden: texto("datosOrden") || null,
      observaciones: texto("observaciones") || null,
    };

    if (actual.updatedAt > new Date(input.creadoEnCliente)) {
      await prisma.conflictoSincronizacion.create({
        data: {
          procedimientoId: input.id,
          agenteId: agente.id,
          descartado: datosEditados,
          motivo:
            "Edición offline más vieja que la versión ya guardada en el servidor (última edición gana).",
        },
      });
      return { ok: true, conflicto: true };
    }

    try {
      await prisma.procedimiento.update({ where: { id: input.id }, data: datosEditados });
      return { ok: true, conflicto: false };
    } catch (err) {
      console.error("[sync-procedimiento] error al editar:", err);
      return { ok: false, error: "No se pudo guardar en el servidor. Se reintenta más tarde." };
    }
  }

  const existente = await prisma.procedimiento.findUnique({ where: { id: input.id } });
  if (existente) {
    return { ok: true, conflicto: false };
  }

  const tipoTexto = texto("tipo");
  const tipo = (TIPOS_VALIDOS as readonly string[]).includes(tipoTexto)
    ? (tipoTexto as (typeof TIPOS_VALIDOS)[number])
    : "DEMORA";

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

    return { ok: true, conflicto: false };
  } catch (err) {
    console.error("[sync-procedimiento] error al crear:", err);
    return { ok: false, error: "No se pudo guardar en el servidor. Se reintenta más tarde." };
  }
}
