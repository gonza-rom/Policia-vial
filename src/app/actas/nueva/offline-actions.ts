"use server";

import { prisma } from "@/lib/prisma";
import {
  getAgenteActual,
  puedeCrearActaMunicipalEnJurisdiccion,
  puedeEditarActa,
} from "@/lib/auth";

type SincronizarActaInput = {
  id: string;
  /** "editar": solo se tocan los campos de contenido, igual que
   * `actualizarActa` online — modalidad/jurisdicción/puesto/guardia quedan
   * como estaban, tal como ya no se vuelven a pedir en el formulario de
   * edición (no renderiza `SelectorModalidadTrabajo`). */
  accion: "crear" | "editar";
  campos: Record<string, string>;
  infraccionIds: string[];
  otraInfraccionId: string | null;
  retencionPreventiva: boolean;
  guardiaId: string;
  puestoId: string;
  creadoEnCliente: string;
  fotoVehiculoUrl: string | null;
  fotoDocumentoUrl: string | null;
};

export type ResultadoSincronizacion =
  | { ok: true; actaId: string; numero: number; conflicto: false }
  | { ok: true; actaId: string; numero: number; conflicto: true }
  | { ok: false; error: string };

/**
 * Sincroniza una acta municipal cargada sin conexión. Se llama directamente
 * desde el cliente (no es un submit de formulario) cuando vuelve la señal —
 * por eso no hace `redirect()`, devuelve un resultado que el cliente usa
 * para sacar (o no) la acta de la cola local.
 *
 * Idempotente: usa el id generado en el cliente como clave del upsert, así
 * que reintentar una sincronización que en realidad ya había llegado al
 * servidor no crea un acta duplicada.
 */
export async function sincronizarActaOffline(
  input: SincronizarActaInput,
): Promise<ResultadoSincronizacion> {
  const agente = await getAgenteActual();

  const c = input.campos;
  const texto = (k: string) => (c[k] ?? "").trim();
  const numero = (k: string, max?: number) => {
    const v = c[k];
    if (!v) return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) return null;
    if (max != null && n > max) return null;
    return n;
  };

  const montoBase = numero("montoBase") ?? 0;
  const porcentajeDescuento = 40;
  const montoConDescuento = Math.round(montoBase * (1 - porcentajeDescuento / 100));

  const detalleOtra = texto("detalleOtraInfraccion");
  const nuevasInfracciones = input.infraccionIds.map((infraccionId) => ({
    infraccionId,
    detalleOperativo: infraccionId === input.otraInfraccionId ? detalleOtra || null : null,
  }));

  // Campos de CONTENIDO — los únicos que se tocan al editar, igual que
  // `actualizarActa` online (que no vuelve a pedir modalidad/jurisdicción).
  const datosContenido = {
    lugarControl: texto("lugarControl") || null,

    conductorNombre: texto("conductorNombre"),
    conductorDni: texto("conductorDni"),
    conductorEdad: numero("conductorEdad", 120),
    conductorDomicilio: texto("conductorDomicilio") || null,
    conductorLicenciaNro: texto("conductorLicenciaNro") || null,
    conductorLicenciaClase: texto("conductorLicenciaClase") || null,
    conductorExpedidoPor: texto("conductorExpedidoPor") || null,

    vehiculoDominio: texto("vehiculoDominio").toUpperCase(),
    vehiculoMarcaModelo: texto("vehiculoMarcaModelo") || null,
    vehiculoTipo: texto("vehiculoTipo") as
      | "AUTO"
      | "MOTO"
      | "PICKUP"
      | "CARGA"
      | "PASAJEROS"
      | "EMERGENCIAS"
      | "OTRO",
    vehiculoTipoOtro: texto("vehiculoTipoOtro") || null,
    vehiculoRemitidoA: texto("vehiculoRemitidoA") || null,

    otrosDatosAmpliatorios: texto("otrosDatosAmpliatorios") || null,

    montoBase,
    porcentajeDescuento,
    montoConDescuento,

    ...(input.fotoVehiculoUrl ? { fotoVehiculoUrl: input.fotoVehiculoUrl } : {}),
    ...(input.fotoDocumentoUrl ? { fotoDocumentoUrl: input.fotoDocumentoUrl } : {}),

    retencionPreventiva: input.retencionPreventiva,
    tipoRetencion:
      (texto("tipoRetencion") as
        | "NINGUNA"
        | "LICENCIA"
        | "VEHICULO"
        | "LICENCIA_Y_VEHICULO") || "NINGUNA",

    alcoholemiaGraduacion: numero("alcoholemiaGraduacion", 10),
  };

  if (input.accion === "editar") {
    try {
      const actual = await prisma.acta.findUnique({ where: { id: input.id } });
      if (!actual) {
        return { ok: false, error: "El acta ya no existe en el servidor." };
      }
      if (!puedeEditarActa(agente, actual)) {
        return { ok: false, error: "Ya no tenés permiso para editar esta acta." };
      }

      if (actual.updatedAt > new Date(input.creadoEnCliente)) {
        await prisma.conflictoSincronizacion.create({
          data: {
            actaId: input.id,
            agenteId: agente.id,
            descartado: { ...datosContenido, infracciones: input.infraccionIds },
            motivo:
              "Edición offline más vieja que la versión ya guardada en el servidor (última edición gana).",
          },
        });
        return { ok: true, actaId: actual.id, numero: actual.numero, conflicto: true };
      }

      const acta = await prisma.$transaction(async (tx) => {
        const acta = await tx.acta.update({ where: { id: input.id }, data: datosContenido });
        await tx.actaInfraccion.deleteMany({ where: { actaId: acta.id } });
        if (nuevasInfracciones.length > 0) {
          await tx.actaInfraccion.createMany({
            data: nuevasInfracciones.map((i) => ({ actaId: acta.id, ...i })),
          });
        }
        return acta;
      });

      console.info(
        `[auditoria-actas] editada offline N°${acta.numero} por agente=${agente.legajo}`,
      );
      return { ok: true, actaId: acta.id, numero: acta.numero, conflicto: false };
    } catch (err) {
      console.error("[sync-acta] error al editar:", err);
      return { ok: false, error: "No se pudo guardar en el servidor. Se reintenta más tarde." };
    }
  }

  const guardia = await prisma.guardia.findUnique({
    where: { id: input.guardiaId },
    include: { puesto: true },
  });
  if (!guardia || guardia.agenteId !== agente.id) {
    return { ok: false, error: "La guardia de esta acta ya no es válida para tu usuario." };
  }

  const modalidadTrabajo = texto("modalidadTrabajo") === "OTRA_JURISDICCION"
    ? ("OTRA_JURISDICCION" as const)
    : ("HABITUAL" as const);
  const jurisdiccionTexto = texto("jurisdiccion");
  const JURISDICCIONES_VALIDAS = ["CAPITAL", "HUILLAPIMA", "LA_PUERTA"] as const;
  const jurisdiccion = (
    JURISDICCIONES_VALIDAS as readonly string[]
  ).includes(jurisdiccionTexto)
    ? (jurisdiccionTexto as (typeof JURISDICCIONES_VALIDAS)[number])
    : null;

  if (!puedeCrearActaMunicipalEnJurisdiccion(guardia.puesto, modalidadTrabajo, jurisdiccion)) {
    return {
      ok: false,
      error: "Tu puesto no tiene esa jurisdicción municipal habitual asignada.",
    };
  }

  const datosActa = {
    tipo: "MUNICIPAL" as const,
    guardiaId: guardia.id,
    agenteId: agente.id,
    puestoId: input.puestoId,
    jurisdiccion,
    modalidadTrabajo,
    puestoTrabajoId: modalidadTrabajo === "OTRA_JURISDICCION" ? texto("puestoTrabajoId") || null : null,
    motivoOtraJurisdiccion:
      modalidadTrabajo === "OTRA_JURISDICCION" ? texto("motivoOtraJurisdiccion") || null : null,
    ...datosContenido,
  };

  try {
    const existente = await prisma.acta.findUnique({ where: { id: input.id } });

    // Idempotencia de alta: si el id ya existe es que un intento anterior
    // ya tuvo éxito pero el cliente no llegó a enterarse — no se vuelve a
    // crear ni se pisa nada (a diferencia de una edición, acá no hay
    // "última versión" legítima con la que comparar).
    if (existente) {
      return { ok: true, actaId: existente.id, numero: existente.numero, conflicto: false };
    }

    const acta = await prisma.$transaction(async (tx) => {
      const acta = await tx.acta.create({ data: { id: input.id, ...datosActa } });
      if (nuevasInfracciones.length > 0) {
        await tx.actaInfraccion.createMany({
          data: nuevasInfracciones.map((i) => ({ actaId: acta.id, ...i })),
        });
      }
      return acta;
    });

    console.info(
      `[auditoria-actas] sincronizada acta offline N°${acta.numero} por agente=${agente.legajo}`,
    );

    return { ok: true, actaId: acta.id, numero: acta.numero, conflicto: false };
  } catch (err) {
    console.error("[sync-acta] error al sincronizar:", err);
    return { ok: false, error: "No se pudo guardar en el servidor. Se reintenta más tarde." };
  }
}

type SincronizarActaContravencionalInput = {
  id: string;
  accion: "crear" | "editar";
  campos: Record<string, string>;
  guardiaId: string;
  puestoId: string;
  creadoEnCliente: string;
  fotoVehiculoUrl: string | null;
  fotoDocumentoUrl: string | null;
};

/**
 * Igual idea que `sincronizarActaOffline`, para el acta contravencional —
 * sin infracciones, sin montos ni jurisdicción municipal, y los campos
 * dinámicos (`CampoContravencional`) se guardan tal cual vinieron, sin
 * tipar (mismo criterio que `crearActaContravencional`). Separada de la
 * municipal a propósito: son flujos distintos en el servidor y así no se
 * arriesga el camino municipal ya probado.
 */
export async function sincronizarActaContravencionalOffline(
  input: SincronizarActaContravencionalInput,
): Promise<ResultadoSincronizacion> {
  const agente = await getAgenteActual();

  const c = input.campos;
  const texto = (k: string) => (c[k] ?? "").trim();

  const camposConfigurados = await prisma.campoContravencional.findMany({
    where: { activo: true },
  });
  const datosDinamicos: Record<string, string> = {};
  for (const campo of camposConfigurados) {
    const valor = texto(campo.clave);
    if (valor) datosDinamicos[campo.clave] = valor;
  }

  // Campos de CONTENIDO — los únicos que se tocan al editar, igual que
  // `actualizarActaContravencional` online.
  const datosContenido = {
    lugarControl: texto("lugarControl") || null,
    datosContravencional: datosDinamicos,
    ...(input.fotoVehiculoUrl ? { fotoVehiculoUrl: input.fotoVehiculoUrl } : {}),
    ...(input.fotoDocumentoUrl ? { fotoDocumentoUrl: input.fotoDocumentoUrl } : {}),
  };

  if (input.accion === "editar") {
    try {
      const actual = await prisma.acta.findUnique({ where: { id: input.id } });
      if (!actual) {
        return { ok: false, error: "El acta ya no existe en el servidor." };
      }
      if (!puedeEditarActa(agente, actual)) {
        return { ok: false, error: "Ya no tenés permiso para editar esta acta." };
      }
      if (actual.updatedAt > new Date(input.creadoEnCliente)) {
        await prisma.conflictoSincronizacion.create({
          data: {
            actaId: input.id,
            agenteId: agente.id,
            descartado: datosContenido,
            motivo:
              "Edición offline más vieja que la versión ya guardada en el servidor (última edición gana).",
          },
        });
        return { ok: true, actaId: actual.id, numero: actual.numero, conflicto: true };
      }

      const acta = await prisma.acta.update({ where: { id: input.id }, data: datosContenido });
      console.info(
        `[auditoria-actas] editada contravencional offline N°${acta.numero} por agente=${agente.legajo}`,
      );
      return { ok: true, actaId: acta.id, numero: acta.numero, conflicto: false };
    } catch (err) {
      console.error("[sync-acta-contravencional] error al editar:", err);
      return { ok: false, error: "No se pudo guardar en el servidor. Se reintenta más tarde." };
    }
  }

  const guardia = await prisma.guardia.findUnique({
    where: { id: input.guardiaId },
  });
  if (!guardia || guardia.agenteId !== agente.id) {
    return { ok: false, error: "La guardia de esta acta ya no es válida para tu usuario." };
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

  const datosActa = {
    tipo: "CONTRAVENCIONAL" as const,
    guardiaId: guardia.id,
    agenteId: agente.id,
    puestoId: input.puestoId,
    modalidadTrabajo,
    puestoTrabajoId,
    motivoOtraJurisdiccion,
    ...datosContenido,
  };

  try {
    const existente = await prisma.acta.findUnique({ where: { id: input.id } });
    if (existente) {
      return { ok: true, actaId: existente.id, numero: existente.numero, conflicto: false };
    }

    const acta = await prisma.acta.create({ data: { id: input.id, ...datosActa } });

    console.info(
      `[auditoria-actas] sincronizada acta contravencional offline N°${acta.numero} por agente=${agente.legajo}`,
    );

    return { ok: true, actaId: acta.id, numero: acta.numero, conflicto: false };
  } catch (err) {
    console.error("[sync-acta-contravencional] error al sincronizar:", err);
    return { ok: false, error: "No se pudo guardar en el servidor. Se reintenta más tarde." };
  }
}
