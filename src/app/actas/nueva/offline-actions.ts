"use server";

import { prisma } from "@/lib/prisma";
import { getAgenteActual } from "@/lib/auth";

type SincronizarActaInput = {
  id: string;
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

  const guardia = await prisma.guardia.findUnique({ where: { id: input.guardiaId } });
  if (!guardia || guardia.agenteId !== agente.id) {
    return { ok: false, error: "La guardia de esta acta ya no es válida para tu usuario." };
  }

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

  const datosActa = {
    tipo: "MUNICIPAL" as const,
    guardiaId: guardia.id,
    agenteId: agente.id,
    puestoId: input.puestoId,
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

  const detalleOtra = texto("detalleOtraInfraccion");
  const crearInfracciones = input.infraccionIds.map((infraccionId) => ({
    infraccionId,
    detalleOperativo: infraccionId === input.otraInfraccionId ? detalleOtra || null : null,
  }));

  try {
    const existente = await prisma.acta.findUnique({ where: { id: input.id } });

    // "Última edición gana": si ya hay una versión en el servidor más nueva
    // que el momento en que se escribió esto offline, no la pisamos — se
    // guarda la que llegó offline como descartada, auditada, y gana la del
    // servidor.
    if (existente && existente.updatedAt > new Date(input.creadoEnCliente)) {
      await prisma.conflictoSincronizacion.create({
        data: {
          actaId: input.id,
          agenteId: agente.id,
          descartado: { ...datosActa, infracciones: input.infraccionIds },
          motivo:
            "Edición offline más vieja que la versión ya guardada en el servidor (última edición gana).",
        },
      });
      console.warn(
        `[auditoria-sync] conflicto en acta ${input.id}: se descartó la versión offline de agente=${agente.legajo}`,
      );
      return { ok: true, actaId: existente.id, numero: existente.numero, conflicto: true };
    }

    const acta = await prisma.$transaction(async (tx) => {
      const acta = await tx.acta.upsert({
        where: { id: input.id },
        create: { id: input.id, ...datosActa },
        update: datosActa,
      });
      await tx.actaInfraccion.deleteMany({ where: { actaId: acta.id } });
      if (crearInfracciones.length > 0) {
        await tx.actaInfraccion.createMany({
          data: crearInfracciones.map((i) => ({ actaId: acta.id, ...i })),
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
