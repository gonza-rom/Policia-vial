"use server";

import { prisma } from "@/lib/prisma";
import { getAgenteActual } from "@/lib/auth";

type SincronizarCierreGuardiaInput = {
  guardiaId: string;
  notasCierre: string | null;
};

export type ResultadoSincronizacionCierreGuardia =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Sincroniza un pedido de "Cerrar Guardia" hecho sin conexión. No hay
 * conflicto que resolver ni "última versión" con la que comparar — cerrar
 * es una acción, no reemplaza datos: si para cuando llega la señal la
 * guardia ya estaba cerrada (otro dispositivo, u otro intento que sí tuvo
 * éxito), no se toca nada y se cuenta igual como "listo".
 */
export async function sincronizarCierreGuardiaOffline(
  input: SincronizarCierreGuardiaInput,
): Promise<ResultadoSincronizacionCierreGuardia> {
  const agente = await getAgenteActual();

  const guardia = await prisma.guardia.findUnique({ where: { id: input.guardiaId } });
  if (!guardia || guardia.agenteId !== agente.id) {
    return { ok: false, error: "Esa guardia ya no es válida para tu usuario." };
  }
  if (guardia.estado === "CERRADA") {
    return { ok: true };
  }

  try {
    await prisma.guardia.update({
      where: { id: input.guardiaId },
      data: {
        estado: "CERRADA",
        turnoFin: new Date(),
        horaCierre: new Date(),
        notasCierre: input.notasCierre || null,
      },
    });
    return { ok: true };
  } catch (err) {
    console.error("[sync-cierre-guardia] error al sincronizar:", err);
    return { ok: false, error: "No se pudo guardar en el servidor. Se reintenta más tarde." };
  }
}
