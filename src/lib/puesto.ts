import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const COOKIE_PUESTO = "puesto_actual";

/**
 * Puesto elegido como "contexto de trabajo" para esta sesión (Módulo 1).
 * Es independiente de la guardia: define dónde se inicia la próxima guardia,
 * no requiere tener un turno abierto. Se guarda en una cookie de sesión, no
 * en la base — así cada dispositivo/pestaña puede trabajar en un puesto
 * distinto sin pisarse.
 */
export async function getPuestoSeleccionado() {
  const cookieStore = await cookies();
  const puestoId = cookieStore.get(COOKIE_PUESTO)?.value;
  if (!puestoId) return null;

  const puesto = await prisma.puesto.findUnique({ where: { id: puestoId } });
  if (!puesto || !puesto.activo) return null;

  return puesto;
}
