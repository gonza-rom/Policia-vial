"use server";

import { prisma } from "@/lib/prisma";
import { getAgenteActual } from "@/lib/auth";

type SincronizarFirmaInput = {
  actaId: string;
  infractorSeNiegaAFirmar: boolean;
  firmaInfractorUrl: string | null;
  firmaActuanteUrl: string;
  firmaSecretarioUrl: string | null;
};

export type ResultadoSincronizacionFirma =
  | { ok: true; yaEstabaFirmada: boolean }
  | { ok: false; error: string };

/**
 * Sincroniza una firma hecha sin conexión sobre un acta que ya estaba
 * sincronizada con el servidor (ver README — firmar una recién creada
 * offline, sin haber tenido señal ni una vez, queda fuera de este
 * alcance). Las imágenes ya se subieron a Cloudinary antes de llamar a
 * esto (ver sincronizar.ts, mismo mecanismo que las fotos del acta).
 */
export async function sincronizarFirmaOffline(
  input: SincronizarFirmaInput,
): Promise<ResultadoSincronizacionFirma> {
  const agente = await getAgenteActual();

  const acta = await prisma.acta.findUnique({ where: { id: input.actaId } });
  if (!acta || acta.agenteId !== agente.id) {
    return { ok: false, error: "Esa acta ya no es válida para tu usuario." };
  }
  if (acta.estado === "FIRMADA") {
    return { ok: true, yaEstabaFirmada: true };
  }

  try {
    await prisma.acta.update({
      where: { id: input.actaId },
      data: {
        infractorSeNiegaAFirmar: input.infractorSeNiegaAFirmar,
        firmaInfractorUrl: input.firmaInfractorUrl,
        firmaActuanteUrl: input.firmaActuanteUrl,
        ...(acta.tipo === "CONTRAVENCIONAL"
          ? { firmaSecretarioUrl: input.firmaSecretarioUrl }
          : {}),
        estado: "FIRMADA",
      },
    });
    return { ok: true, yaEstabaFirmada: false };
  } catch (err) {
    console.error("[sync-firma] error al sincronizar:", err);
    return { ok: false, error: "No se pudo guardar en el servidor. Se reintenta más tarde." };
  }
}
